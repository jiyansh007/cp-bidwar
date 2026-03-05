// src/components/WatchlistSidebar.jsx
import { useState } from 'react';
import { Eye, AlertTriangle, Trophy, X, ChevronRight, Bell } from 'lucide-react';
import { useWatchlist } from '../hooks/useWatchlist';
import { useGame } from '../context/GameContext';

export default function WatchlistSidebar({ onReBid }) {
    const { items, dismiss } = useWatchlist();
    const { questions, isActive } = useGame();
    const [collapsed, setCollapsed] = useState(false);

    // Enrich watchlist items with live question data
    const enriched = items.map(item => {
        const q = questions.find(q => q.id === item.questionId);
        return { ...item, question: q };
    }).filter(item => item.question); // only show items where question still exists

    // Calculate derived counts strictly from existing questions
    const outbidCount = enriched.filter(i => i.status === 'outbid').length;
    const winningCount = enriched.filter(i => i.status === 'winning').length;

    if (collapsed) {
        return (
            <div
                className="flex flex-col items-center py-4 gap-4 cursor-pointer"
                style={{
                    width: 48, background: '#0d1525', borderLeft: '1px solid #1e3a5f',
                    height: '100%',
                }}
                onClick={() => setCollapsed(false)}
            >
                <Eye size={18} style={{ color: '#00f5ff' }} />
                {outbidCount > 0 && (
                    <span className="badge badge-tag"
                        style={{ writingMode: 'vertical-rl', background: 'rgba(255,51,102,0.2)', color: '#ff3366', borderColor: 'rgba(255,51,102,0.4)' }}>
                        {outbidCount}
                    </span>
                )}
                <ChevronRight size={14} style={{ color: '#475569', marginTop: 'auto' }} />
            </div>
        );
    }

    return (
        <div className="sidebar">
            {/* Header */}
            <div className="p-4 flex items-center gap-2" style={{ borderBottom: '1px solid #1e3a5f', flexShrink: 0 }}>
                <Eye size={16} style={{ color: '#00f5ff' }} />
                <span className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>Watchlist</span>
                {outbidCount > 0 && (
                    <span className="badge ml-1"
                        style={{ background: 'rgba(255,51,102,0.2)', color: '#ff3366', borderColor: 'rgba(255,51,102,0.4)', fontSize: 10 }}>
                        <Bell size={9} /> {outbidCount} OUTBID
                    </span>
                )}
                {winningCount > 0 && (
                    <span className="badge ml-1"
                        style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88', borderColor: 'rgba(0,255,136,0.3)', fontSize: 10 }}>
                        {winningCount} WINNING
                    </span>
                )}
                <button
                    className="btn btn-ghost ml-auto"
                    style={{ padding: '4px', minWidth: 0 }}
                    onClick={() => setCollapsed(true)}
                    title="Collapse sidebar"
                >
                    <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />
                </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                {enriched.length === 0 && (
                    <div className="flex flex-col items-center justify-center flex-1 gap-3 py-12">
                        <Eye size={28} style={{ color: '#1e3a5f' }} />
                        <p className="text-xs text-center" style={{ color: '#475569' }}>
                            Questions you bid on will appear here with live status.
                        </p>
                    </div>
                )}

                {enriched.map(item => {
                    const isOutbid = item.status === 'outbid';
                    const isWinning = item.status === 'winning';
                    const q = item.question;
                    const canDismiss = isOutbid; // not winning

                    return (
                        <div
                            key={item.questionId}
                            className={`p-3 rounded-xl flex flex-col gap-2 relative ${isOutbid ? 'outbid-flash' : ''}`}
                            style={{
                                background: isOutbid
                                    ? 'rgba(255, 51, 102, 0.08)'
                                    : 'rgba(0, 255, 136, 0.06)',
                                border: isOutbid
                                    ? '1px solid rgba(255, 51, 102, 0.5)'
                                    : '1px solid rgba(0, 255, 136, 0.3)',
                            }}
                        >
                            {/* Dismiss button */}
                            {canDismiss && (
                                <button
                                    className="absolute top-2 right-2 p-1 rounded"
                                    style={{ color: '#475569', background: 'transparent' }}
                                    onClick={() => dismiss(item.questionId, q.currentWinner)}
                                    title="Remove from watchlist"
                                >
                                    <X size={12} />
                                </button>
                            )}

                            {/* Status badge */}
                            <div className="flex items-center gap-2">
                                {isOutbid ? (
                                    <>
                                        <AlertTriangle size={13} style={{ color: '#ff3366' }} />
                                        <span className="text-xs font-bold font-mono" style={{ color: '#ff3366' }}>
                                            OUTBIDDED!
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Trophy size={13} style={{ color: '#00ff88' }} />
                                        <span className="text-xs font-bold font-mono" style={{ color: '#00ff88' }}>
                                            WINNING
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Question title */}
                            <p className="text-xs font-semibold leading-snug pr-5" style={{ color: '#e2e8f0' }}>
                                {q.title}
                            </p>

                            {/* Bid info */}
                            <div className="flex items-center justify-between text-xs font-mono">
                                <span style={{ color: '#475569' }}>Your bid: {item.myLastBid} pts</span>
                                {isOutbid && (
                                    <span style={{ color: '#ff3366' }}>Now: {q.currentPrice} pts</span>
                                )}
                                {isWinning && (
                                    <span style={{ color: '#00ff88' }}>Leading: {q.currentPrice} pts</span>
                                )}
                            </div>

                            {/* Outbid by */}
                            {isOutbid && q.currentWinnerName && (
                                <p className="text-xs" style={{ color: '#475569' }}>
                                    Outbid by <span style={{ color: '#94a3b8' }}>{q.currentWinnerName}</span>
                                </p>
                            )}

                            {/* Re-Bid button */}
                            {isOutbid && isActive && (
                                <button
                                    id={`rebid-btn-${item.questionId}`}
                                    className="btn btn-danger w-full mt-1"
                                    style={{ padding: '6px 10px', fontSize: 12 }}
                                    onClick={() => onReBid(q)}
                                >
                                    ⚡ Re-Bid Now
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
