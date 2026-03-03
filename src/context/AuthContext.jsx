// src/context/AuthContext.jsx
// Free Tier: No Cloud Functions. Auth is anonymous + Firestore password lookup only.
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

const TEAM_SESSION_KEY = 'cp_bidding_team';

export function AuthProvider({ children }) {
    const [currentTeam, setCurrentTeam] = useState(null);
    const [firebaseUser, setFirebaseUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // Restore session on mount
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            setFirebaseUser(user);
            if (user) {
                const saved = localStorage.getItem(TEAM_SESSION_KEY);
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        // Re-verify team still exists
                        const teamDoc = await getDoc(doc(db, 'teams', parsed.id));
                        if (teamDoc.exists()) {
                            setCurrentTeam({ id: teamDoc.id, ...teamDoc.data() });
                        } else {
                            localStorage.removeItem(TEAM_SESSION_KEY);
                        }
                    } catch {
                        localStorage.removeItem(TEAM_SESSION_KEY);
                    }
                }
                // Check admin session
                const adminSaved = localStorage.getItem('cp_bidding_admin');
                if (adminSaved === 'true') setIsAdmin(true);
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    // Login as a team
    const login = useCallback(async (teamName, password) => {
        try {
            // Ensure anonymous auth
            let user = auth.currentUser;
            if (!user) {
                const result = await signInAnonymously(auth);
                user = result.user;
            }

            // Find the team by name
            const q = query(collection(db, 'teams'), where('name', '==', teamName.trim()));
            const snap = await getDocs(q);
            if (snap.empty) throw new Error('Team not found.');

            const teamDoc = snap.docs[0];
            const teamData = teamDoc.data();

            // Verify password
            if (teamData.password !== password.trim()) throw new Error('Incorrect password.');

            const team = { id: teamDoc.id, ...teamData };
            setCurrentTeam(team);
            localStorage.setItem(TEAM_SESSION_KEY, JSON.stringify(team));
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }, []);

    // Admin login (password compared against Firestore config doc)
    const adminLogin = useCallback(async (password) => {
        try {
            let user = auth.currentUser;
            if (!user) {
                const result = await signInAnonymously(auth);
                user = result.user;
            }
            const configDoc = await getDoc(doc(db, 'config', 'main'));
            if (!configDoc.exists()) throw new Error('Config not found. Initialize Firebase first.');
            if (configDoc.data().adminPassword !== password) throw new Error('Incorrect admin password.');
            setIsAdmin(true);
            localStorage.setItem('cp_bidding_admin', 'true');
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }, []);

    const logout = useCallback(() => {
        setCurrentTeam(null);
        setIsAdmin(false);
        localStorage.removeItem(TEAM_SESSION_KEY);
        localStorage.removeItem('cp_bidding_admin');
    }, []);

    // Keep currentTeam in sync with Firestore live updates (balance changes etc.)
    useEffect(() => {
        if (!currentTeam?.id) return;
        // Dynamic import to avoid circular deps
        import('firebase/firestore').then(({ onSnapshot, doc: fsDoc }) => {
            return onSnapshot(fsDoc(db, 'teams', currentTeam.id), (snap) => {
                if (snap.exists()) {
                    const updated = { id: snap.id, ...snap.data() };
                    setCurrentTeam(updated);
                    localStorage.setItem(TEAM_SESSION_KEY, JSON.stringify(updated));
                }
            });
        });
    }, [currentTeam?.id]);

    const value = { currentTeam, firebaseUser, isAdmin, loading, login, adminLogin, logout };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
