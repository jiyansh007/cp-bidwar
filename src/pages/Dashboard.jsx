// src/pages/Dashboard.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, LogOut, Snowflake, Play, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import QuestionCard from '../components/QuestionCard';
import WatchlistSidebar from '../components/WatchlistSidebar';
import BidModal from '../components/BidModal';

const GAME_STATE_INFO = {
    idle: { label: 'Waiting to Start', icon: <Clock size={13} />, color: '#475569' },
    active: { label: 'BIDDING LIVE', icon: <Play size={13} />, color: '#00ff88' },
    frozen: { label: 'BIDDING FROZEN', icon: <Snowflake size={13} />, color: '#00f5ff' },
};

export default function Dashboard() {
    const { currentTeam, logout } = useAuth();
    const { questions, gameState, isActive, isFrozen, loading } = useGame();
    const navigate = useNavigate();

    const [selectedQuestion, setSelectedQuestion] = useState(null); // for BidModal
    const [filter, setFilter] = useState('all'); // 'all' | 'open' | 'mine' | 'sold'
    const [diffFilter, setDiffFilter] = useState('all');

    const handleLogout = () => { logout(); navigate('/'); };

    // Apply filters
    // Note: questions no longer have status='sold' during bidding — only currentWinner changes.
    const filteredQuestions = questions.filter(q => {
        let pass = true;
        if (filter === 'open') pass = !q.currentWinner;                           // No bids yet
        if (filter === 'mine') pass = q.currentWinner === currentTeam?.id;        // I am leading
        if (filter === 'contested') pass = !!q.currentWinner && q.currentWinner !== currentTeam?.id; // Others leading
        if (diffFilter !== 'all') pass = pass && q.difficulty === diffFilter;
        return pass;
    });

    const myCount = questions.filter(q => q.currentWinner === currentTeam?.id).length;
    const gsInfo = GAME_STATE_INFO[gameState] ?? GAME_STATE_INFO.idle;

    return (
        <div className="flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>

            {/* ── TOP HEADER ─────────────────────────────────────────── */}
            <header style={{
                flexShrink: 0, background: '#0d1525',
                borderBottom: '1px solid #1e3a5f', padding: '0 20px',
                height: 56, display: 'flex', alignItems: 'center', gap: 16, zIndex: 20,
            }}>
                {/* Logo */}
                <div className="flex items-center gap-2 mr-4">
                    <Zap size={20} style={{ color: '#00f5ff', filter: 'drop-shadow(0 0 8px #00f5ff)' }} />
                    <span className="font-black text-sm tracking-tight" style={{ color: '#e2e8f0' }}>
                        CP <span className="text-neon-cyan">BIDWAR</span>
                    </span>
                </div>

                {/* Game state badge */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold"
                    style={{
                        background: `${gsInfo.color}18`,
                        border: `1px solid ${gsInfo.color}50`,
                        color: gsInfo.color,
                    }}>
                    {gsInfo.icon} {gsInfo.label}
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Team info */}
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-xs font-mono" style={{ color: '#475569' }}>
                            {currentTeam?.name}
                        </p>
                        <p className="text-sm font-bold font-mono" style={{ color: '#ffd700' }}>
                            <Zap size={12} className="inline mr-0.5" style={{ verticalAlign: 'middle' }} />
                            {currentTeam?.balance ?? 0} pts
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-mono" style={{ color: '#475569' }}>Questions</p>
                        <p className="text-sm font-bold font-mono text-neon-green">{myCount}</p>
                    </div>
                    <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}
                        onClick={handleLogout}>
                        <LogOut size={13} /> Logout
                    </button>
                </div>
            </header>

            {/* ── MAIN BODY ──────────────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── QUESTION GRID ─────────────────────────────────────── */}
                <main className="flex-1 overflow-y-auto p-5">

                    {/* Filter bar */}
                    <div className="flex items-center gap-2 mb-5 flex-wrap">
                        <div className="flex gap-1 p-1 rounded-lg" style={{ background: '#0d1525', border: '1px solid #1e3a5f' }}>
                            {[['all', 'All'], ['open', 'Unclaimed'], ['mine', 'Leading'], ['contested', 'Contested']].map(([v, l]) => (
                                <button key={v}
                                    className="btn"
                                    style={{
                                        padding: '4px 12px', fontSize: 12,
                                        background: filter === v ? 'rgba(0,245,255,0.15)' : 'transparent',
                                        color: filter === v ? '#00f5ff' : '#475569',
                                        border: filter === v ? '1px solid rgba(0,245,255,0.3)' : '1px solid transparent',
                                    }}
                                    onClick={() => setFilter(v)}>{l}</button>
                            ))}
                        </div>
                        <div className="flex gap-1 p-1 rounded-lg" style={{ background: '#0d1525', border: '1px solid #1e3a5f' }}>
                            {[['all', 'All Diff'], ['Easy', 'Easy'], ['Medium', 'Medium'], ['Hard', 'Hard']].map(([v, l]) => (
                                <button key={v}
                                    className="btn"
                                    style={{
                                        padding: '4px 12px', fontSize: 12,
                                        background: diffFilter === v ? 'rgba(0,245,255,0.15)' : 'transparent',
                                        color: diffFilter === v ? '#00f5ff' : '#475569',
                                        border: diffFilter === v ? '1px solid rgba(0,245,255,0.3)' : '1px solid transparent',
                                    }}
                                    onClick={() => setDiffFilter(v)}>{l}</button>
                            ))}
                        </div>
                        <span className="text-xs font-mono ml-auto" style={{ color: '#475569' }}>
                            {filteredQuestions.length} / {questions.length} questions
                        </span>
                    </div>

                    {/* Loading state */}
                    {loading && (
                        <div className="flex items-center justify-center py-24">
                            <p className="text-sm font-mono" style={{ color: '#475569' }}>Loading questions…</p>
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && questions.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Zap size={40} style={{ color: '#1e3a5f' }} />
                            <p className="text-sm font-mono" style={{ color: '#475569' }}>
                                No questions added yet. Waiting for admin to load the arena…
                            </p>
                        </div>
                    )}

                    {/* Grid */}
                    {!loading && filteredQuestions.length > 0 && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: 12,
                        }}>
                            {filteredQuestions.map((q) => (
                                <QuestionCard
                                    key={q.id}
                                    question={q}
                                    myTeamId={currentTeam?.id}
                                    onBid={setSelectedQuestion}
                                    isGameActive={isActive}
                                    isFrozen={isFrozen}
                                    index={questions.indexOf(q)}
                                />
                            ))}
                        </div>
                    )}
                </main>

                {/* ── WATCHLIST SIDEBAR ──────────────────────────────────── */}
                <WatchlistSidebar onReBid={setSelectedQuestion} />
            </div>

            {/* ── BID MODAL ──────────────────────────────────────────── */}
            {selectedQuestion && (
                <BidModal
                    question={selectedQuestion}
                    onClose={() => setSelectedQuestion(null)}
                />
            )}
        </div>
    );
}
