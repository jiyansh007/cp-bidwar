// src/components/admin/TeamManager.jsx
import { useState } from 'react';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { Plus, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeamManager() {
    const { teams, loading } = useLeaderboard();
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [balance, setBalance] = useState(1000);
    const [saving, setSaving] = useState(false);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!name.trim() || !password.trim()) { toast.error('Name and password required.'); return; }
        if (teams.some(t => t.name.toLowerCase() === name.trim().toLowerCase())) {
            toast.error('A team with that name already exists.');
            return;
        }
        setSaving(true);
        try {
            await addDoc(collection(db, 'teams'), {
                name: name.trim(),
                password: password.trim(),
                balance: Number(balance),
                questionsOwned: 0,
                createdAt: serverTimestamp(),
            });
            toast.success(`Team "${name.trim()}" created!`);
            setName(''); setPassword(''); setBalance(1000);
        } catch (err) {
            toast.error(err.message);
        }
        setSaving(false);
    };

    const handleDelete = async (team) => {
        if (!confirm(`Delete team "${team.name}"? This cannot be undone.`)) return;
        await deleteDoc(doc(db, 'teams', team.id));
        toast.success(`Team "${team.name}" deleted.`);
    };

    return (
        <div className="card p-5">
            <h3 className="text-xs font-mono mb-4 uppercase tracking-widest" style={{ color: '#00f5ff' }}>
                Team Manager
            </h3>

            {/* Create form */}
            <form onSubmit={handleCreate} className="flex gap-3 mb-5 flex-wrap items-end">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-mono" style={{ color: '#475569' }}>TEAM NAME</label>
                    <input id="new-team-name" className="input" style={{ minWidth: 160 }} placeholder="Team Alpha"
                        value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-mono" style={{ color: '#475569' }}>PASSWORD</label>
                    <input id="new-team-password" className="input" style={{ minWidth: 130 }} placeholder="password"
                        value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-mono" style={{ color: '#475569' }}>START BALANCE</label>
                    <input id="new-team-balance" className="input" style={{ minWidth: 100 }} type="number" min={0}
                        value={balance} onChange={e => setBalance(e.target.value)} />
                </div>
                <button id="create-team-btn" type="submit" className="btn btn-primary" disabled={saving}
                    style={{ padding: '10px 16px' }}>
                    <Plus size={14} /> {saving ? 'Creating…' : 'Create Team'}
                </button>
            </form>

            {/* Teams table */}
            <table className="admin-table">
                <thead>
                    <tr>
                        <th><Users size={11} className="inline mr-1" />Team</th>
                        <th>Password</th>
                        <th>Balance</th>
                        <th>Questions Owned</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading && <tr><td colSpan={5} className="text-center py-4">Loading…</td></tr>}
                    {teams.map(t => (
                        <tr key={t.id}>
                            <td style={{ color: '#e2e8f0', fontWeight: 600 }}>{t.name}</td>
                            <td className="font-mono" style={{ color: '#475569' }}>••••••</td>
                            <td className="font-mono" style={{ color: '#ffd700' }}>{t.balance} pts</td>
                            <td className="font-mono" style={{ color: '#00ff88' }}>{t.questionsOwned}</td>
                            <td>
                                <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: 11 }}
                                    onClick={() => handleDelete(t)}>
                                    <Trash2 size={11} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {!loading && teams.length === 0 && (
                        <tr><td colSpan={5} className="text-center py-4" style={{ color: '#475569' }}>No teams yet.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
