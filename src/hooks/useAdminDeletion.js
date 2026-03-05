import { useState, useCallback } from 'react';
import { runTransaction, doc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

export function useAdminDeletion() {
    const [isDeleting, setIsDeleting] = useState(false);

    const deleteQuestionWithRefunds = useCallback(async (questionId) => {
        setIsDeleting(true);
        const toastId = toast.loading('Deleting question and processing refunds...');

        try {
            const questionRef = doc(db, 'questions', questionId);

            // Step 1: Atomic transaction to refund winner and delete the question document
            await runTransaction(db, async (t) => {
                const questionSnap = await t.get(questionRef);
                if (!questionSnap.exists()) {
                    throw new Error('Question does not exist.');
                }

                // If there's a winner, refund them
                const winnerId = questionSnap.data().currentWinner;
                if (winnerId) {
                    const winnerRef = doc(db, 'teams', winnerId);
                    const winnerSnap = await t.get(winnerRef);

                    if (winnerSnap.exists()) {
                        const winnerData = winnerSnap.data();
                        t.update(winnerRef, {
                            balance: winnerData.balance + questionSnap.data().currentPrice,
                            questionsOwned: Math.max(0, (winnerData.questionsOwned ?? 0) - 1),
                        });
                    }
                }

                // Delete the question itself
                t.delete(questionRef);
            });

            // Step 2: Clean up watchlists across ALL teams
            // (Using a normal batch write iterating through teams, avoiding collectionGroup index issues)
            const teamsSnap = await getDocs(collection(db, 'teams'));
            const batchLog = writeBatch(db);

            teamsSnap.docs.forEach((teamDoc) => {
                const itemRef = doc(db, 'watchlist', teamDoc.id, 'items', questionId);
                batchLog.delete(itemRef);
            });

            await batchLog.commit();

            toast.success('Question deleted successfully.', { id: toastId });
            setIsDeleting(false);
            return { success: true };
        } catch (error) {
            console.error('Deletion error:', error);
            toast.error(error.message || 'Failed to delete question.', { id: toastId });
            setIsDeleting(false);
            return { success: false, error: error.message };
        }
    }, []);

    return { deleteQuestionWithRefunds, isDeleting };
}
