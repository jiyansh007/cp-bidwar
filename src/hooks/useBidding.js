// src/hooks/useBidding.js
// ─────────────────────────────────────────────────────────────────────────
// FREE TIER: Client-side Firestore transaction.
// No Cloud Functions needed. All read-validate-write happens atomically
// inside a single runTransaction() call on the frontend.
//
// SECURITY NOTE: Since rules must allow client writes on Spark plan,
// a determined attacker with DevTools could attempt direct writes.
// The Firestore rules are set as restrictive as possible, but this is
// a known limitation of the free-tier approach.
// ─────────────────────────────────────────────────────────────────────────
import { useState, useCallback } from 'react';
import {
    runTransaction,
    doc,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export function useBidding() {
    const { currentTeam } = useAuth();
    const [loading, setLoading] = useState(false);

    const placeBid = useCallback(async (questionId, bidAmount, questionTitle) => {
        if (!currentTeam) {
            toast.error('You must be logged in to bid.');
            return { success: false };
        }

        const amount = Math.floor(Number(bidAmount));
        if (!amount || amount <= 0) {
            toast.error('Enter a valid bid amount.');
            return { success: false };
        }

        // Optimistic client-side balance check (real check is inside transaction)
        if (amount > currentTeam.balance) {
            toast.error(`Insufficient balance. You have ${currentTeam.balance} pts.`);
            return { success: false };
        }

        setLoading(true);
        const toastId = toast.loading(`Placing bid of ${amount} pts on "${questionTitle}"…`);

        try {
            const questionRef = doc(db, 'questions', questionId);
            const teamRef = doc(db, 'teams', currentTeam.id);

            await runTransaction(db, async (t) => {
                // ── READ PHASE (must precede all writes in Firestore transactions) ──
                const questionSnap = await t.get(questionRef);
                const teamSnap = await t.get(teamRef);

                if (!questionSnap.exists()) throw new Error('Question not found.');
                if (!teamSnap.exists()) throw new Error('Team not found.');

                const question = questionSnap.data();
                const team = teamSnap.data();

                // ── VALIDATE ────────────────────────────────────────────────────────
                if (amount <= question.currentPrice) {
                    throw new Error(
                        `Bid must exceed the current price of ${question.currentPrice} pts. (Race condition — price updated.)`
                    );
                }
                if (team.balance < amount) {
                    throw new Error(`Insufficient balance. You have ${team.balance} pts.`);
                }
                if (question.currentWinner === currentTeam.id) {
                    throw new Error('You already own this question.');
                }

                // ── REFUND PREVIOUS WINNER ──────────────────────────────────────────
                const previousWinnerId = question.currentWinner ?? null;
                const previousWinnerName = question.currentWinnerName ?? null;

                if (previousWinnerId) {
                    const prevTeamRef = doc(db, 'teams', previousWinnerId);
                    const prevTeamSnap = await t.get(prevTeamRef);

                    if (prevTeamSnap.exists()) {
                        const prevData = prevTeamSnap.data();
                        t.update(prevTeamRef, {
                            balance: prevData.balance + question.currentPrice,
                            questionsOwned: Math.max(0, (prevData.questionsOwned ?? 0) - 1),
                        });
                    }

                    // Mark previous winner as outbid in their watchlist
                    const prevWatchRef = doc(db, 'watchlist', previousWinnerId, 'items', questionId);
                    t.set(prevWatchRef, {
                        status: 'outbid',
                        myLastBid: question.currentPrice,
                        updatedAt: serverTimestamp(),
                    }, { merge: true });
                }

                // ── DEDUCT FROM NEW WINNER ──────────────────────────────────────────
                t.update(teamRef, {
                    balance: team.balance - amount,
                    questionsOwned: (team.questionsOwned ?? 0) + 1,
                });

                // ── UPDATE QUESTION ─────────────────────────────────────────────────
                // NOTE: status intentionally stays 'open' so other teams can outbid.
                // Questions only become visually "closed" when the admin freezes the game.
                t.update(questionRef, {
                    currentPrice: amount,
                    currentWinner: currentTeam.id,
                    currentWinnerName: team.name,
                    previousWinner: previousWinnerId,
                    // status is NOT changed — remains 'open'
                });

                // ── UPDATE NEW WINNER'S WATCHLIST ───────────────────────────────────
                const newWatchRef = doc(db, 'watchlist', currentTeam.id, 'items', questionId);
                t.set(newWatchRef, {
                    status: 'winning',
                    myLastBid: amount,
                    updatedAt: serverTimestamp(),
                }, { merge: true });
            });

            toast.success(
                `🏆 Bid won! "${questionTitle}" is yours for ${amount} pts.`,
                { id: toastId, duration: 5000 }
            );
            setLoading(false);
            return { success: true };

        } catch (err) {
            // Firestore transaction errors (aborted, contention) and our validation errors
            const isRaceCondition = err.message?.toLowerCase().includes('race condition')
                || err.code === 'failed-precondition'
                || err.code === 'aborted';

            const message = isRaceCondition
                ? 'Bid Failed — Price Updated (someone bid faster!)'
                : err.message ?? 'Bid failed. Please try again.';

            toast.error(message, { id: toastId, duration: 5000 });
            setLoading(false);
            return { success: false, reason: err.message };
        }
    }, [currentTeam]);

    return { placeBid, loading };
}
