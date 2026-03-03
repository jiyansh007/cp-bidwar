// src/components/QuestionCard.jsx
import { useState } from 'react';
import { ExternalLink, Crown, Tag, Zap, TrendingUp, Lock } from 'lucide-react';

const DIFFICULTY_MAP = {
    Easy: { cls: 'badge-easy', label: 'Easy' },
    Medium: { cls: 'badge-medium', label: 'Med' },
    Hard: { cls: 'badge-hard', label: 'Hard' },
};

export default function QuestionCard({
    question,
    myTeamId,
    onBid,
    isGameActive,
    isFrozen,
    index,
}) {
    const [hovered, setHovered] = useState(false);

    const diff = DIFFICULTY_MAP[question.difficulty] ?? DIFFICULTY_MAP.Medium;
    const iAmWinning = question.currentWinner === myTeamId;
    const someoneWins = !!question.currentWinner;

    // ── STATE 1: GAME FROZEN + I AM THE WINNER → Final "SOLVED" card ──────
    if (isFrozen && iAmWinning) {
        return (
            <div
                className="card relative overflow-hidden scanlines flex flex-col gap-2 p-4 cursor-default"
                style={{
                    background: 'linear-gradient(135deg, rgba(0,255,136,0.14) 0%, rgba(0,80,50,0.08) 100%)',
                    borderColor: 'rgba(0,255,136,0.7)',
                    boxShadow: '0 0 24px rgba(0,255,136,0.25), inset 0 0 30px rgba(0,255,136,0.04)',
                }}
            >
                <IndexBadge index={index} color="rgba(0,255,136,0.4)" />

                <div className="flex items-start gap-2">
                    <Crown size={13} style={{ color: '#00ff88', flexShrink: 0, marginTop: 2 }} />
                    <p className="text-sm font-semibold leading-tight" style={{ color: '#e2e8f0' }}>
                        {question.title}
                    </p>
                </div>

                <div className="flex flex-wrap gap-1">
                    <span className={`badge ${diff.cls}`}>{diff.label}</span>
                    {(question.tags ?? []).slice(0, 2).map(t => (
                        <span key={t} className="badge badge-tag">{t}</span>
                    ))}
                </div>

                <div className="text-xs font-mono mt-1" style={{ color: '#00ff88' }}>
                    Won · {question.currentPrice} pts
                </div>

                <div className="mt-auto pt-2">
                    <a
                        href={question.problemLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-success w-full"
                        style={{ padding: '7px 12px', fontSize: 12 }}
                    >
                        SOLVE NOW <ExternalLink size={12} />
                    </a>
                </div>
            </div>
        );
    }

    // ── STATE 2: GAME FROZEN + SOMEONE ELSE WON → Locked-out card ─────────
    if (isFrozen && someoneWins && !iAmWinning) {
        return (
            <div
                className="card relative flex flex-col gap-2 p-4 cursor-default opacity-55"
                style={{ background: '#0d1117', borderColor: '#1a2535' }}
            >
                <IndexBadge index={index} color="#1e3a5f" />
                <div className="flex items-start gap-2">
                    <Lock size={12} style={{ color: '#334155', flexShrink: 0, marginTop: 2 }} />
                    <p className="text-sm font-semibold leading-tight text-slate-500 line-through">
                        {question.title}
                    </p>
                </div>
                <div className="flex flex-wrap gap-1">
                    <span className={`badge ${diff.cls}`} style={{ opacity: 0.4 }}>{diff.label}</span>
                </div>
                <div className="mt-auto pt-2 text-xs font-mono" style={{ color: '#334155' }}>
                    Closed · Won by {question.currentWinnerName ?? 'another team'}
                </div>
            </div>
        );
    }

    // ── STATE 3: I AM THE CURRENT HIGHEST BIDDER (game still open) ────────
    if (iAmWinning) {
        return (
            <div
                className="card relative flex flex-col gap-2 p-4 cursor-default"
                style={{
                    borderColor: 'rgba(0,255,136,0.5)',
                    boxShadow: '0 0 16px rgba(0,255,136,0.15), inset 0 0 20px rgba(0,255,136,0.03)',
                }}
            >
                <IndexBadge index={index} color="rgba(0,255,136,0.35)" />

                {/* "Winning" pill */}
                <div className="absolute top-2 left-3">
                    <span className="badge text-xs"
                        style={{
                            background: 'rgba(0,255,136,0.15)', color: '#00ff88',
                            borderColor: 'rgba(0,255,136,0.4)', fontSize: 9, padding: '2px 6px',
                        }}>
                        ● WINNING
                    </span>
                </div>

                <p className="text-sm font-semibold leading-tight mt-5 pr-8" style={{ color: '#e2e8f0' }}>
                    {question.title}
                </p>

                <div className="flex flex-wrap gap-1">
                    <span className={`badge ${diff.cls}`}>{diff.label}</span>
                    {(question.tags ?? []).slice(0, 2).map(t => (
                        <span key={t} className="badge badge-tag">{t}</span>
                    ))}
                </div>

                <div className="flex items-center gap-1 mt-1">
                    <Crown size={11} style={{ color: '#00ff88' }} />
                    <span className="text-xs font-mono" style={{ color: '#00ff88' }}>
                        Your bid: {question.currentPrice} pts
                    </span>
                </div>

                <div className="mt-auto pt-2">
                    <button
                        className="btn w-full"
                        style={{
                            padding: '7px 12px', fontSize: 12,
                            background: 'rgba(0,255,136,0.08)',
                            color: '#329962', border: '1px solid rgba(0,255,136,0.2)',
                            cursor: 'default',
                        }}
                        disabled
                    >
                        You hold the highest bid
                    </button>
                </div>
            </div>
        );
    }

    // ── STATE 4: OPEN — someone else is winning (can outbid) ──────────────
    if (someoneWins) {
        return (
            <div
                className="card relative flex flex-col gap-2 p-4 cursor-pointer"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    borderColor: hovered ? 'rgba(255,215,0,0.5)' : 'rgba(255,215,0,0.15)',
                    boxShadow: hovered ? '0 0 20px rgba(255,215,0,0.12)' : undefined,
                    transform: hovered ? 'translateY(-2px)' : undefined,
                    transition: 'all 0.2s ease',
                }}
            >
                <IndexBadge index={index} color="rgba(255,215,0,0.25)" />

                {/* "Contested" pill */}
                <div className="absolute top-2 left-3">
                    <span className="badge text-xs"
                        style={{
                            background: 'rgba(255,215,0,0.12)', color: '#ffd700',
                            borderColor: 'rgba(255,215,0,0.3)', fontSize: 9, padding: '2px 6px',
                        }}>
                        ⚡ LIVE BID
                    </span>
                </div>

                <p className="text-sm font-semibold leading-tight mt-5 pr-8" style={{ color: '#e2e8f0' }}>
                    {question.title}
                </p>

                <div className="flex flex-wrap gap-1">
                    <span className={`badge ${diff.cls}`}>{diff.label}</span>
                    {(question.tags ?? []).slice(0, 2).map(t => (
                        <span key={t} className="badge badge-tag">{t}</span>
                    ))}
                </div>

                {/* Current leader */}
                <div className="rounded-lg px-2 py-1.5 mt-1"
                    style={{ background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.15)' }}>
                    <p className="text-xs font-mono" style={{ color: '#94a3b8' }}>Current leader</p>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{ color: '#ffd700' }}>
                            {question.currentWinnerName}
                        </span>
                        <span className="text-xs font-mono font-bold" style={{ color: '#ffd700' }}>
                            {question.currentPrice} pts
                        </span>
                    </div>
                </div>

                <div className="mt-auto pt-1">
                    <button
                        id={`bid-btn-${question.id}`}
                        className="btn btn-primary w-full"
                        style={{ padding: '7px 12px', fontSize: 12 }}
                        onClick={() => onBid(question)}
                        disabled={!isGameActive}
                    >
                        {isGameActive
                            ? <><TrendingUp size={12} /> Outbid ({question.currentPrice + 1}+ pts)</>
                            : 'Bidding Paused'}
                    </button>
                </div>
            </div>
        );
    }

    // ── STATE 5: OPEN — no bids yet ────────────────────────────────────────
    return (
        <div
            className="card relative flex flex-col gap-2 p-4 cursor-pointer"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                borderColor: hovered ? 'rgba(0,245,255,0.4)' : undefined,
                boxShadow: hovered ? '0 0 20px rgba(0,245,255,0.1)' : undefined,
                transform: hovered ? 'translateY(-2px)' : undefined,
                transition: 'all 0.2s ease',
            }}
        >
            <IndexBadge index={index} color="rgba(0,245,255,0.25)" />

            <p className="text-sm font-semibold leading-tight pr-8" style={{ color: '#e2e8f0' }}>
                {question.title}
            </p>

            <div className="flex flex-wrap gap-1">
                <span className={`badge ${diff.cls}`}>{diff.label}</span>
                {(question.tags ?? []).slice(0, 3).map(t => (
                    <span key={t} className="badge badge-tag">{t}</span>
                ))}
            </div>

            <div className="flex items-center gap-1 mt-1">
                <Zap size={11} style={{ color: '#ffd700' }} />
                <span className="text-xs font-mono" style={{ color: '#ffd700' }}>
                    Base: {question.basePrice} pts
                </span>
            </div>

            <div className="mt-auto pt-2">
                <button
                    id={`bid-btn-${question.id}`}
                    className="btn btn-primary w-full"
                    style={{ padding: '7px 12px', fontSize: 12 }}
                    onClick={() => onBid(question)}
                    disabled={!isGameActive}
                >
                    {isGameActive ? 'Place First Bid' : 'Bidding Paused'}
                </button>
            </div>
        </div>
    );
}

// ── shared sub-component ────────────────────────────────────────────────────
function IndexBadge({ index, color }) {
    return (
        <div className="absolute top-2 right-3 text-xs font-mono" style={{ color }}>
            #{String(index + 1).padStart(2, '0')}
        </div>
    );
}
