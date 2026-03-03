// src/pages/LoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Shield, ChevronRight } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [teamName, setTeamName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await login(teamName, password);
        setLoading(false);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error ?? 'Login failed.');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4"
            style={{ background: '#080c14' }}>

            {/* Animated background grid */}
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: `
          linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px)
        `,
                backgroundSize: '40px 40px',
            }} />

            {/* Glowing orbs */}
            <div className="absolute" style={{
                top: '10%', left: '15%', width: 300, height: 300,
                background: 'radial-gradient(circle, rgba(0,245,255,0.06) 0%, transparent 70%)', borderRadius: '50%'
            }} />
            <div className="absolute" style={{
                bottom: '10%', right: '15%', width: 400, height: 400,
                background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)', borderRadius: '50%'
            }} />

            {/* Logo / Hero */}
            <div className="text-center mb-10 relative z-10">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <Zap size={36} style={{ color: '#00f5ff', filter: 'drop-shadow(0 0 12px #00f5ff)' }} />
                    <h1 className="text-4xl font-black tracking-tight" style={{ color: '#e2e8f0' }}>
                        CP <span className="text-neon-cyan">BIDDING</span> WAR
                    </h1>
                </div>
                <p className="text-sm font-mono" style={{ color: '#475569' }}>
                    Real-Time Competitive Programming Auction Platform
                </p>
            </div>

            {/* Login card */}
            <div className="relative z-10 w-full" style={{ maxWidth: 400 }}>
                <div className="card p-8" style={{
                    background: 'rgba(13, 21, 37, 0.9)',
                    backdropFilter: 'blur(12px)',
                    borderColor: 'rgba(0,245,255,0.2)',
                }}>
                    <h2 className="text-lg font-bold mb-6" style={{ color: '#e2e8f0' }}>Team Login</h2>

                    {error && (
                        <div className="p-3 rounded-lg mb-5 text-sm"
                            style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)', color: '#ff3366' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-mono mb-2" style={{ color: '#94a3b8' }}>TEAM NAME</label>
                            <input
                                id="team-name-input"
                                className="input"
                                type="text"
                                placeholder="e.g. Team Alpha"
                                value={teamName}
                                onChange={e => setTeamName(e.target.value)}
                                required
                                autoComplete="username"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-mono mb-2" style={{ color: '#94a3b8' }}>TEAM PASSWORD</label>
                            <input
                                id="team-password-input"
                                className="input"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                        </div>
                        <button
                            id="team-login-btn"
                            type="submit"
                            className="btn btn-primary w-full mt-2"
                            style={{ padding: '12px', fontSize: 15 }}
                            disabled={loading}
                        >
                            {loading
                                ? 'Connecting…'
                                : <span className="flex items-center gap-2">Enter the Arena <ChevronRight size={16} /></span>
                            }
                        </button>
                    </form>
                </div>

                {/* Admin link */}
                <div className="text-center mt-5">
                    <button
                        className="text-xs font-mono flex items-center gap-1 mx-auto"
                        style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer' }}
                        onClick={() => navigate('/admin-login')}
                    >
                        <Shield size={11} /> Admin Access
                    </button>
                </div>
            </div>
        </div>
    );
}
