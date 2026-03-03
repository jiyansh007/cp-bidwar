// functions/index.js
// ══════════════════════════════════════════════════════════════
// Firebase Cloud Functions — CP Bidding War
//
// Deploy:  firebase deploy --only functions
// Requires: Firebase Blaze (pay-as-you-go) plan
// ══════════════════════════════════════════════════════════════
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onCall } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

initializeApp();
const db = getFirestore();
const auth = getAuth();

// ──────────────────────────────────────────────────────────────
// processBid
// Triggered when a client creates a document in /bids/{bidId}.
// Runs a Firestore transaction to atomically:
//   1. Validate bid > currentPrice
//   2. Validate team balance >= bidAmount
//   3. Refund previous winner
//   4. Deduct from new winner
//   5. Update question document
//   6. Update watchlist entries
//   7. Increment questionsOwned counters
// ──────────────────────────────────────────────────────────────
exports.processBid = onDocumentCreated('bids/{bidId}', async (event) => {
    const bid = event.data.data();
    const bidRef = event.data.ref;

    const { teamId, questionId, bidAmount } = bid;

    // Input sanity checks (belt-and-suspenders on top of security rules)
    if (!teamId || !questionId || typeof bidAmount !== 'number' || bidAmount <= 0) {
        await bidRef.update({ status: 'rejected', failReason: 'Invalid bid payload.' });
        return;
    }

    try {
        await db.runTransaction(async (t) => {
            const questionRef = db.doc(`questions/${questionId}`);
            const teamRef = db.doc(`teams/${teamId}`);

            const [questionSnap, teamSnap] = await Promise.all([
                t.get(questionRef),
                t.get(teamRef),
            ]);

            // ── Validate question & team exist ──
            if (!questionSnap.exists) {
                t.update(bidRef, { status: 'failed', failReason: 'Question not found.' });
                return;
            }
            if (!teamSnap.exists) {
                t.update(bidRef, { status: 'failed', failReason: 'Team not found.' });
                return;
            }

            const question = questionSnap.data();
            const team = teamSnap.data();

            // ── Validate game is active ──
            const configSnap = await t.get(db.doc('config/main'));
            if (!configSnap.exists || configSnap.data().gameState !== 'active') {
                t.update(bidRef, { status: 'rejected', failReason: 'Bidding is not active.' });
                return;
            }

            // ── Validate bid amount ──
            if (bidAmount <= (question.currentPrice ?? question.basePrice)) {
                t.update(bidRef, {
                    status: 'failed',
                    failReason: `Bid must exceed current price of ${question.currentPrice} pts.`,
                });
                return;
            }

            // ── Validate team balance ──
            if (team.balance < bidAmount) {
                t.update(bidRef, {
                    status: 'failed',
                    failReason: `Insufficient balance. You have ${team.balance} pts.`,
                });
                return;
            }

            // ── Prevent re-bidding own current win ──
            if (question.currentWinner === teamId) {
                t.update(bidRef, { status: 'rejected', failReason: 'You already own this question.' });
                return;
            }

            // ── Refund previous winner ──
            const previousWinnerId = question.currentWinner ?? null;
            if (previousWinnerId) {
                const prevTeamRef = db.doc(`teams/${previousWinnerId}`);
                const prevTeamSnap = await t.get(prevTeamRef);
                if (prevTeamSnap.exists) {
                    const refundAmount = question.currentPrice;
                    t.update(prevTeamRef, {
                        balance: prevTeamSnap.data().balance + refundAmount,
                        questionsOwned: Math.max(0, (prevTeamSnap.data().questionsOwned ?? 0) - 1),
                    });
                }
                // Mark previous winner as outbid in their watchlist
                const prevWatchRef = db.doc(`watchlist/${previousWinnerId}/items/${questionId}`);
                t.set(prevWatchRef, {
                    status: 'outbid',
                    myLastBid: question.currentPrice,
                    updatedAt: FieldValue.serverTimestamp(),
                }, { merge: true });
            }

            // ── Deduct from new winner ──
            t.update(teamRef, {
                balance: team.balance - bidAmount,
                questionsOwned: (team.questionsOwned ?? 0) + 1,
            });

            // ── Update question ──
            t.update(questionRef, {
                currentPrice: bidAmount,
                currentWinner: teamId,
                currentWinnerName: team.name,
                previousWinner: previousWinnerId,
                status: 'sold',
            });

            // ── Update new winner's watchlist ──
            const newWatchRef = db.doc(`watchlist/${teamId}/items/${questionId}`);
            t.set(newWatchRef, {
                status: 'winning',
                myLastBid: bidAmount,
                updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });

            // ── Mark bid as success ──
            t.update(bidRef, { status: 'success' });

            // ── Audit log ──
            const auditRef = db.collection('auditLog').doc();
            t.set(auditRef, {
                type: 'bid',
                actor: teamId,
                actorName: team.name,
                questionId,
                questionTitle: question.title,
                bidAmount,
                previousWinner: previousWinnerId,
                timestamp: FieldValue.serverTimestamp(),
            });
        });
    } catch (err) {
        console.error('processBid transaction failed:', err);
        // Update bid doc outside transaction since transaction may have failed
        try {
            await bidRef.update({
                status: 'failed',
                failReason: 'Server error. Please try again.',
            });
        } catch (_) { }
    }
});

// ──────────────────────────────────────────────────────────────
// setTeamClaim
// Callable function: sets custom claim { teamId } on the
// anonymous user so Firestore security rules can verify teamId.
// Called by AuthContext after successful team password verification.
// ──────────────────────────────────────────────────────────────
exports.setTeamClaim = onCall(async (request) => {
    if (!request.auth) {
        throw new Error('Unauthenticated.');
    }

    const { teamId } = request.data;
    if (!teamId || typeof teamId !== 'string') {
        throw new Error('Invalid teamId.');
    }

    // Verify this team exists
    const teamSnap = await db.doc(`teams/${teamId}`).get();
    if (!teamSnap.exists) {
        throw new Error('Team does not exist.');
    }

    await auth.setCustomUserClaims(request.auth.uid, { teamId });
    return { success: true };
});
