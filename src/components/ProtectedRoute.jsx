// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
    const { currentTeam, loading } = useAuth();
    if (loading) return <LoadingScreen />;
    if (!currentTeam) return <Navigate to="/" replace />;
    return children;
}

export function AdminRoute({ children }) {
    const { isAdmin, loading } = useAuth();
    if (loading) return <LoadingScreen />;
    if (!isAdmin) return <Navigate to="/admin-login" replace />;
    return children;
}

function LoadingScreen() {
    return (
        <div className="flex items-center justify-center min-h-screen" style={{ background: '#080c14' }}>
            <div className="text-center">
                <div className="mb-4" style={{ color: '#00f5ff', fontSize: 32 }}>⚡</div>
                <p className="text-sm font-mono" style={{ color: '#475569' }}>Connecting to arena…</p>
            </div>
        </div>
    );
}
