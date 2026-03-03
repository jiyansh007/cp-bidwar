// src/components/admin/ManualOverride.jsx
import { useState } from 'react';
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { PlusCircle, MinusCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManualOverride() {
    const { teams } = useLeaderboard();
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState('add'); // 'add' | 'subtract'

    const handleSubmit = async (e) => {
        e.preventDefault();
        const pts = Math.abs(parseInt(amount, 10));
        if (!selectedTeamId) { toast.error('Select a team.'); return; }
        if (!pts || pts <= 0) { toast.error('Enter a valid point amount.'); return; }

        const delta = mode === 'add' ? pts : -pts;
        const team = teams.find(t => t.id === selectedTeamId);

        if (mode === 'subtract' && team && team.balance + delta < 0) {
            toast.error('This would result in a negative balance.');
            return;
        }

        setLoading(true);
        try {
            // Update balance
            await updateDoc(doc(db, 'teams', selectedTeamId), {
                balance: increment(delta),
            });

            // Write to audit log
            await addDoc(collection(db, 'auditLog'), {
                type: 'override',
                actor: 'admin',
                teamId: selectedTeamId,
                teamName: team?.name,
                delta,
                reason: reason.trim() || 'Manual adjustment',
                timestamp: serverTimestamp(),
            });

            toast.success(
                `${mode === 'add' ? '+' : ''}${delta} pts applied to ${team?.name ?? 'team'}.`,
                { duration: 4000 }
            );
            setAmount(''); setReason('');
        } catch (err) {
            toast.error(err.message);
        }
        setLoading(false);
    };

    return (
        <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={14} style={{ color: '#ffd700' }} />
                <h3 className="text-xs font-mono uppercase tracking-widest" style={{ color: '#00f5ff' }}>
                    Manual Point Override
                </h3>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Team selector */}
                <div>
                    <label className="block text-xs font-mono mb-1" style={{ color: '#475569' }}>SELECT TEAM</label>
                    <select
                        id="override-team-select"
                        className="input"
                        value={selectedTeamId}
                        onChange={e => setSelectedTeamId(e.target.value)}
                    >
                        <option value="">— Choose a team —</option>
                        {teams.map(t => (
                            <option key={t.id} value={t.id}>{t.name} (balance: {t.balance})</option>
                        ))}
                    </select>
                </div>

                {/* Add / Subtract toggle */}
                <div className="flex gap-2">
                    <button type="button"
                        className="btn flex-1"
                        style={{
                            padding: '8px',
                            background: mode === 'add' ? 'rgba(0,255,136,0.15)' : 'transparent',
                            border: mode === 'add' ? '1px solid rgba(0,255,136,0.4)' : '1px solid #1e3a5f',
                            color: mode === 'add' ? '#00ff88' : '#475569',
                        }}
                        onClick={() => setMode('add')}>
                        <PlusCircle size={14} /> Add Points
                    </button>
                    <button type="button"
                        className="btn flex-1"
                        style={{
                            padding: '8px',
                            background: mode === 'subtract' ? 'rgba(255,51,102,0.15)' : 'transparent',
                            border: mode === 'subtract' ? '1px solid rgba(255,51,102,0.4)' : '1px solid #1e3a5f',
                            color: mode === 'subtract' ? '#ff3366' : '#475569',
                        }}
                        onClick={() => setMode('subtract')}>
                        <MinusCircle size={14} /> Remove Points
                    </button>
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-xs font-mono mb-1" style={{ color: '#475569' }}>POINT AMOUNT</label>
                    <input
                        id="override-amount-input"
                        className="input"
                        type="number"
                        min={1}
                        placeholder="e.g. 100"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                    />
                </div>

                {/* Reason */}
                <div>
                    <label className="block text-xs font-mono mb-1" style={{ color: '#475569' }}>REASON (for audit log)</label>
                    <input
                        id="override-reason-input"
                        className="input"
                        placeholder="e.g. Dispute resolution, bonus points"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                    />
                </div>

                <button
                    id="apply-override-btn"
                    type="submit"
                    className={`btn w-full ${mode === 'add' ? 'btn-success' : 'btn-danger'}`}
                    style={{ padding: '11px' }}
                    disabled={loading}
                >
                    {loading ? 'Applying…' : `${mode === 'add' ? 'Add' : 'Remove'} ${amount || '0'} Points`}
                </button>
            </form>
        </div>
    );
}
