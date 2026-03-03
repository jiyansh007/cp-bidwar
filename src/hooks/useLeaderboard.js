// src/hooks/useLeaderboard.js
import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

export function useLeaderboard() {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'teams'), (snap) => {
            const docs = snap.docs.map(d => ({
                id: d.id,
                name: d.data().name,
                balance: d.data().balance ?? 0,
                questionsOwned: d.data().questionsOwned ?? 0,
            }));
            // Sort by questionsOwned desc, then balance desc
            docs.sort((a, b) =>
                b.questionsOwned - a.questionsOwned || b.balance - a.balance
            );
            setTeams(docs);
            setLoading(false);
        });
        return unsub;
    }, []);

    return { teams, loading };
}
