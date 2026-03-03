// src/components/admin/LiveLeaderboard.jsx
import { Trophy, Zap, Hash } from 'lucide-react';
import { useLeaderboard } from '../../hooks/useLeaderboard';

export default function LiveLeaderboard() {
    const { teams, loading } = useLeaderboard();

    const maxBalance = Math.max(...teams.map(t => t.balance), 1);

    return (
        <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
                <Trophy size={14} style={{ color: '#ffd700' }} />
                <h3 className="text-xs font-mono uppercase tracking-widest" style={{ color: '#00f5ff' }}>
                    Live Leaderboard
                </h3>
                <span className="badge badge-tag ml-auto" style={{ fontSize: 10 }}>LIVE</span>
            </div>

            {loading && <p className="text-xs font-mono text-center py-6" style={{ color: '#475569' }}>Loading…</p>}

            {!loading && teams.length === 0 && (
                <p className="text-xs font-mono text-center py-6" style={{ color: '#475569' }}>No teams yet.</p>
            )}

            <div className="flex flex-col gap-2">
                {teams.map((team, idx) => (
                    <div key={team.id} className="rounded-xl p-3"
                        style={{
                            background: idx === 0
                                ? 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,165,0,0.04))'
                                : '#080c14',
                            border: `1px solid ${idx === 0 ? 'rgba(255,215,0,0.3)' : '#1e3a5f'}`,
                        }}>
                        <div className="flex items-center gap-3">
                            {/* Rank */}
                            <span className="text-sm font-black font-mono w-6 text-center"
                                style={{ color: idx === 0 ? '#ffd700' : idx === 1 ? '#94a3b8' : idx === 2 ? '#cd7f32' : '#475569' }}>
                                {idx === 0 ? '👑' : `#${idx + 1}`}
                            </span>

                            {/* Name */}
                            <span className="font-semibold text-sm flex-1 truncate" style={{ color: '#e2e8f0' }}>
                                {team.name}
                            </span>

                            {/* Questions */}
                            <div className="flex items-center gap-1 text-xs font-mono"
                                style={{ color: '#00ff88', minWidth: 60, justifyContent: 'flex-end' }}>
                                <Hash size={10} /> {team.questionsOwned}
                            </div>

                            {/* Balance */}
                            <div className="flex items-center gap-1 text-sm font-bold font-mono"
                                style={{ color: '#ffd700', minWidth: 80, justifyContent: 'flex-end' }}>
                                <Zap size={12} /> {team.balance}
                            </div>
                        </div>

                        {/* Balance bar */}
                        <div className="mt-2 rounded-full overflow-hidden" style={{ height: 3, background: '#1e3a5f' }}>
                            <div className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${Math.round((team.balance / maxBalance) * 100)}%`,
                                    background: idx === 0
                                        ? 'linear-gradient(90deg, #ffd700, #ff8c00)'
                                        : 'linear-gradient(90deg, #00f5ff, #0080ff)',
                                }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
