// src/components/BidModal.jsx
import { useState, useEffect, useRef } from 'react';
import { X, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { useBidding } from '../hooks/useBidding';
import { useAuth } from '../context/AuthContext';

export default function BidModal({ question, onClose }) {
    const { currentTeam } = useAuth();
    const { placeBid, loading } = useBidding();
    const [bidAmount, setBidAmount] = useState('');
    const inputRef = useRef(null);

    const minBid = (question?.currentPrice ?? 0) + 1;
    const maxBid = currentTeam?.balance ?? 0;
    const parsedAmount = parseInt(bidAmount, 10);
    const isValid = !isNaN(parsedAmount) && parsedAmount >= minBid && parsedAmount <= maxBid;

    // Focus input on open
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 100);
        // Set default to minBid
        setBidAmount(String(minBid));
    }, [minBid]);

    // Close on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isValid || loading) return;
        const result = await placeBid(question.id, parsedAmount, question.title);
        if (result?.success) onClose();
        // If failed, keep modal open so they can re-bid
    };

    const diffColors = {
        Easy: '#00ff88', Medium: '#ffd700', Hard: '#ff3366',
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ maxWidth: 460 }}>
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                        <p className="text-xs font-mono mb-1" style={{ color: '#00f5ff' }}>PLACE BID</p>
                        <h2 className="text-lg font-bold leading-tight" style={{ color: '#e2e8f0' }}>
                            {question.title}
                        </h2>
                        <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
                            Difficulty:{' '}
                            <span style={{ color: diffColors[question.difficulty] ?? '#ffd700' }}>
                                {question.difficulty}
                            </span>
                        </p>
                    </div>
                    <button className="btn btn-ghost" style={{ padding: '6px', minWidth: 0 }} onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>

                {/* Tags */}
                {question.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-5">
                        {question.tags.map(t => (
                            <span key={t} className="badge badge-tag">{t}</span>
                        ))}
                    </div>
                )}

                {/* Price info */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="p-3 rounded-lg" style={{ background: '#0a1628', border: '1px solid #1e3a5f' }}>
                        <p className="text-xs font-mono" style={{ color: '#475569' }}>CURRENT PRICE</p>
                        <p className="text-xl font-bold font-mono mt-1" style={{ color: '#ffd700' }}>
                            <Zap size={14} className="inline mr-1" style={{ verticalAlign: 'middle' }} />
                            {question.currentPrice} pts
                        </p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ background: '#0a1628', border: '1px solid #1e3a5f' }}>
                        <p className="text-xs font-mono" style={{ color: '#475569' }}>YOUR BALANCE</p>
                        <p className="text-xl font-bold font-mono mt-1" style={{ color: maxBid < minBid ? '#ff3366' : '#00f5ff' }}>
                            {currentTeam?.balance ?? 0} pts
                        </p>
                    </div>
                </div>

                {/* Insufficient balance warning */}
                {maxBid < minBid && (
                    <div className="flex items-center gap-2 p-3 rounded-lg mb-4"
                        style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)' }}>
                        <AlertTriangle size={14} style={{ color: '#ff3366' }} />
                        <p className="text-xs" style={{ color: '#ff3366' }}>
                            Insufficient balance to bid on this question.
                        </p>
                    </div>
                )}

                {/* Bid form */}
                <form onSubmit={handleSubmit}>
                    <label className="block text-xs font-mono mb-2" style={{ color: '#94a3b8' }}>
                        YOUR BID (minimum {minBid} pts)
                    </label>
                    <div className="relative mb-2">
                        <input
                            ref={inputRef}
                            id="bid-amount-input"
                            className="input"
                            style={{ paddingRight: '48px', fontSize: 18, fontWeight: 700 }}
                            type="number"
                            min={minBid}
                            max={maxBid}
                            step={1}
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            disabled={loading || maxBid < minBid}
                            placeholder={`Min: ${minBid}`}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono"
                            style={{ color: '#475569' }}>pts</span>
                    </div>

                    {/* Quick bid buttons */}
                    <div className="flex gap-2 mb-5">
                        {[minBid, minBid + 50, minBid + 100, minBid + 200].filter(v => v <= maxBid).map(v => (
                            <button key={v} type="button"
                                className="btn btn-ghost flex-1"
                                style={{ padding: '5px 4px', fontSize: 11 }}
                                onClick={() => setBidAmount(String(v))}>
                                {v}
                            </button>
                        ))}
                    </div>

                    <button
                        id="submit-bid-btn"
                        type="submit"
                        className="btn btn-primary w-full"
                        style={{ padding: '12px', fontSize: 15 }}
                        disabled={!isValid || loading || maxBid < minBid}
                    >
                        {loading
                            ? <span className="flex items-center gap-2"><span className="spin" />Processing…</span>
                            : <span className="flex items-center gap-2"><TrendingUp size={16} /> Confirm Bid · {parsedAmount || '--'} pts</span>
                        }
                    </button>

                    <p className="text-center text-xs mt-3" style={{ color: '#475569' }}>
                        ⚠ Bids cannot be lowered or withdrawn. You'll be refunded if outbid.
                    </p>
                </form>
            </div>
        </div>
    );
}
