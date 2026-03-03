// src/pages/AdminPanel.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import GameControl from '../components/admin/GameControl';
import QuestionManager from '../components/admin/QuestionManager';
import TeamManager from '../components/admin/TeamManager';
import LiveLeaderboard from '../components/admin/LiveLeaderboard';
import ManualOverride from '../components/admin/ManualOverride';
import { Shield, Zap, LogOut, LayoutGrid, Users, Trophy, Settings, AlertTriangle } from 'lucide-react';

const TABS = [
    { id: 'control', label: 'Game Control', icon: <Settings size={14} /> },
    { id: 'questions', label: 'Questions', icon: <LayoutGrid size={14} /> },
    { id: 'teams', label: 'Teams', icon: <Users size={14} /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy size={14} /> },
    { id: 'override', label: 'Override', icon: <AlertTriangle size={14} /> },
];

export default function AdminPanel() {
    const { logout } = useAuth();
    const { gameState, questions } = useGame();
    const navigate = useNavigate();
    const [tab, setTab] = useState('control');

    const handleLogout = () => { logout(); navigate('/'); };

    const soldCount = questions.filter(q => q.status === 'sold').length;
    const openCount = questions.length - soldCount;

    return (
        <div className="flex flex-col" style={{ height: '100vh', overflow: 'hidden', background: '#080c14' }}>

            {/* Header */}
            <header style={{
                flexShrink: 0, background: '#0d1525',
                borderBottom: '1px solid rgba(168,85,247,0.3)',
                padding: '0 20px', height: 56,
                display: 'flex', alignItems: 'center', gap: 16,
            }}>
                <Shield size={18} style={{ color: '#a855f7' }} />
                <span className="font-black text-sm tracking-tight">
                    <span style={{ color: '#a855f7' }}>GOD MODE</span>
                    <span style={{ color: '#475569' }}> · Admin Panel</span>
                </span>

                {/* Quick stats */}
                <div className="flex items-center gap-4 ml-6">
                    <Stat label="Questions" value={questions.length} color="#00f5ff" />
                    <Stat label="Sold" value={soldCount} color="#00ff88" />
                    <Stat label="Open" value={openCount} color="#ffd700" />
                    <div className={`badge font-mono text-xs ml-2 ${gameState === 'active' ? '' : ''
                        }`} style={{
                            background: gameState === 'active' ? 'rgba(0,255,136,0.15)' : 'rgba(255,215,0,0.1)',
                            color: gameState === 'active' ? '#00ff88' : '#ffd700',
                            borderColor: gameState === 'active' ? 'rgba(0,255,136,0.4)' : 'rgba(255,215,0,0.3)',
                        }}>
                        {gameState.toUpperCase()}
                    </div>
                </div>

                <div className="flex-1" />
                <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}
                    onClick={handleLogout}>
                    <LogOut size={13} /> Exit Admin
                </button>
            </header>

            {/* Tab bar */}
            <div style={{
                flexShrink: 0, background: '#0a1020',
                borderBottom: '1px solid #1e3a5f',
                display: 'flex', padding: '0 20px', gap: 4,
            }}>
                {TABS.map(t => (
                    <button
                        key={t.id}
                        id={`admin-tab-${t.id}`}
                        className="btn"
                        style={{
                            padding: '10px 16px', fontSize: 12, borderRadius: '0 0 8px 8px',
                            background: tab === t.id ? 'rgba(168,85,247,0.15)' : 'transparent',
                            color: tab === t.id ? '#a855f7' : '#475569',
                            borderBottom: tab === t.id ? '2px solid #a855f7' : '2px solid transparent',
                            borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                        }}
                        onClick={() => setTab(t.id)}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <main style={{ flex: 1, overflow: 'auto', padding: 20 }}>
                {tab === 'control' && (
                    <div className="grid grid-cols-2 gap-5" style={{ maxWidth: 900 }}>
                        <div className="col-span-2"><GameControl gameState={gameState} /></div>
                    </div>
                )}
                {tab === 'questions' && <QuestionManager />}
                {tab === 'teams' && (
                    <div className="grid grid-cols-2 gap-5" style={{ maxWidth: 1000 }}>
                        <TeamManager />
                        <LiveLeaderboard />
                    </div>
                )}
                {tab === 'leaderboard' && (
                    <div style={{ maxWidth: 600 }}>
                        <LiveLeaderboard />
                    </div>
                )}
                {tab === 'override' && (
                    <div style={{ maxWidth: 520 }}>
                        <ManualOverride />
                    </div>
                )}
            </main>
        </div>
    );
}

function Stat({ label, value, color }) {
    return (
        <div className="text-center">
            <p className="text-xs font-mono" style={{ color: '#475569' }}>{label}</p>
            <p className="text-sm font-bold font-mono" style={{ color }}>{value}</p>
        </div>
    );
}
