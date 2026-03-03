// src/hooks/useWatchlist.js
import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

export function useWatchlist() {
    const { currentTeam } = useAuth();
    const [items, setItems] = useState([]); // [{ questionId, status, myLastBid, ...questionData }]

    useEffect(() => {
        if (!currentTeam?.id) {
            setItems([]);
            return;
        }
        const ref = collection(db, 'watchlist', currentTeam.id, 'items');
        const unsub = onSnapshot(ref, (snap) => {
            const docs = snap.docs.map(d => ({ questionId: d.id, ...d.data() }));
            // Sort: outbid first (urgent), then winning
            docs.sort((a, b) => {
                if (a.status === 'outbid' && b.status !== 'outbid') return -1;
                if (b.status === 'outbid' && a.status !== 'outbid') return 1;
                return 0;
            });
            setItems(docs);
        });
        return unsub;
    }, [currentTeam?.id]);

    // Can only dismiss if NOT the current winner
    const dismiss = useCallback(async (questionId, currentWinnerId) => {
        if (!currentTeam?.id) return;
        if (currentWinnerId === currentTeam.id) return; // Cannot dismiss if winning

        await deleteDoc(doc(db, 'watchlist', currentTeam.id, 'items', questionId));
    }, [currentTeam?.id]);

    const outbidCount = items.filter(i => i.status === 'outbid').length;
    const winningCount = items.filter(i => i.status === 'winning').length;

    return { items, dismiss, outbidCount, winningCount };
}
