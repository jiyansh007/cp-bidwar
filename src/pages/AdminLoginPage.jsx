// src/pages/AdminLoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, ArrowLeft } from 'lucide-react';

export default function AdminLoginPage() {
    const { adminLogin } = useAuth();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await adminLogin(password);
        setLoading(false);
        if (result.success) {
            navigate('/admin');
        } else {
            setError(result.error ?? 'Incorrect password.');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4"
            style={{ background: '#080c14' }}>
            <div className="w-full" style={{ maxWidth: 380 }}>
                <button
                    className="flex items-center gap-1 text-xs font-mono mb-8"
                    style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={() => navigate('/')}
                >
                    <ArrowLeft size={12} /> Back to Team Login
                </button>

                <div className="card p-8" style={{ background: 'rgba(13,21,37,0.9)', borderColor: 'rgba(168,85,247,0.3)' }}>
                    <div className="flex items-center gap-3 mb-6">
                        <Shield size={20} style={{ color: '#a855f7' }} />
                        <h2 className="text-lg font-bold" style={{ color: '#e2e8f0' }}>God Mode Access</h2>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg mb-5 text-sm"
                            style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)', color: '#ff3366' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-mono mb-2" style={{ color: '#94a3b8' }}>ADMIN PASSWORD</label>
                            <input
                                id="admin-password-input"
                                className="input"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <button
                            id="admin-login-btn"
                            type="submit"
                            className="btn w-full mt-2"
                            style={{
                                padding: '12px', fontSize: 15,
                                background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                                color: '#fff', fontWeight: 700,
                            }}
                            disabled={loading}
                        >
                            {loading ? 'Authenticating…' : 'Access Control Panel'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
