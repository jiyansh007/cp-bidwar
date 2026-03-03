// src/context/GameContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { collection, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

const GameContext = createContext(null);

export function GameProvider({ children }) {
    const [questions, setQuestions] = useState([]);
    const [gameState, setGameState] = useState('idle'); // 'idle' | 'active' | 'frozen'
    const [configLoading, setConfigLoading] = useState(true);
    const [questionsLoading, setQuestionsLoading] = useState(true);

    // Subscribe to game config
    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'config', 'main'), (snap) => {
            if (snap.exists()) {
                setGameState(snap.data().gameState ?? 'idle');
            }
            setConfigLoading(false);
        }, (err) => {
            console.error('Config listener error:', err);
            setConfigLoading(false);
        });
        return unsub;
    }, []);

    // Subscribe to questions (real-time)
    useEffect(() => {
        const q = query(collection(db, 'questions'), orderBy('createdAt', 'asc'));
        const unsub = onSnapshot(q, (snap) => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setQuestions(docs);
            setQuestionsLoading(false);
        }, (err) => {
            console.error('Questions listener error:', err);
            setQuestionsLoading(false);
        });
        return unsub;
    }, []);

    const isActive = gameState === 'active';
    const isFrozen = gameState === 'frozen';
    const isIdle = gameState === 'idle';
    const loading = configLoading || questionsLoading;

    return (
        <GameContext.Provider value={{
            questions,
            gameState,
            isActive,
            isFrozen,
            isIdle,
            loading,
        }}>
            {children}
        </GameContext.Provider>
    );
}

export const useGame = () => {
    const ctx = useContext(GameContext);
    if (!ctx) throw new Error('useGame must be used inside GameProvider');
    return ctx;
};
