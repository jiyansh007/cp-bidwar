// src/components/admin/QuestionManager.jsx
import { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Plus, Pencil, Trash2, Check, X, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGame } from '../../context/GameContext';

const BLANK = {
    title: '', difficulty: 'Medium', tags: '', basePrice: 100,
    currentPrice: 100, problemLink: '', status: 'open',
    currentWinner: null, currentWinnerName: null, previousWinner: null,
};

export default function QuestionManager() {
    const { questions } = useGame();
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(BLANK);
    const [showAdd, setShowAdd] = useState(false);
    const [loading, setLoading] = useState(false);

    const fieldUpdate = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const startEdit = (q) => {
        setEditingId(q.id);
        setForm({ ...q, tags: (q.tags ?? []).join(', ') });
        setShowAdd(false);
    };
    const cancelEdit = () => { setEditingId(null); setForm(BLANK); };

    const parsedForm = () => ({
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        basePrice: Number(form.basePrice),
        currentPrice: editingId ? form.currentPrice : Number(form.basePrice),
    });

    const handleSave = async () => {
        if (!form.title.trim()) { toast.error('Title is required.'); return; }
        if (!form.problemLink.trim()) { toast.error('Problem link is required.'); return; }
        setLoading(true);
        try {
            const data = parsedForm();
            if (editingId) {
                await updateDoc(doc(db, 'questions', editingId), {
                    title: data.title, difficulty: data.difficulty, tags: data.tags,
                    basePrice: data.basePrice, problemLink: data.problemLink,
                });
                toast.success('Question updated.');
                cancelEdit();
            } else {
                await addDoc(collection(db, 'questions'), { ...data, createdAt: serverTimestamp() });
                toast.success('Question added.');
                setForm(BLANK);
                setShowAdd(false);
            }
        } catch (err) {
            toast.error(err.message);
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this question and all its bids?')) return;
        await deleteDoc(doc(db, 'questions', id));
        toast.success('Question deleted.');
    };

    const diffBadge = { Easy: 'badge-easy', Medium: 'badge-medium', Hard: 'badge-hard' };

    const FormInline = () => (
        <tr style={{ background: 'rgba(0,245,255,0.05)' }}>
            <td className="p-2">
                <input className="input" style={{ minWidth: 160 }} placeholder="Title"
                    value={form.title} onChange={e => fieldUpdate('title', e.target.value)} />
            </td>
            <td className="p-2">
                <select className="input" style={{ minWidth: 100 }}
                    value={form.difficulty} onChange={e => fieldUpdate('difficulty', e.target.value)}>
                    <option>Easy</option><option>Medium</option><option>Hard</option>
                </select>
            </td>
            <td className="p-2">
                <input className="input" style={{ minWidth: 130 }} placeholder="DP, Math, Greedy"
                    value={form.tags} onChange={e => fieldUpdate('tags', e.target.value)} />
            </td>
            <td className="p-2">
                <input className="input" style={{ minWidth: 80 }} type="number" placeholder="100"
                    value={form.basePrice} onChange={e => fieldUpdate('basePrice', e.target.value)} />
            </td>
            <td className="p-2">
                <input className="input" style={{ minWidth: 220 }} placeholder="https://codeforces.com/..."
                    value={form.problemLink} onChange={e => fieldUpdate('problemLink', e.target.value)} />
            </td>
            <td className="p-2">
                <div className="flex gap-2">
                    <button className="btn btn-success" style={{ padding: '6px 10px', fontSize: 12 }}
                        onClick={handleSave} disabled={loading}>
                        <Check size={12} /> {loading ? '…' : 'Save'}
                    </button>
                    <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}
                        onClick={() => { setShowAdd(false); cancelEdit(); }}>
                        <X size={12} />
                    </button>
                </div>
            </td>
        </tr>
    );

    return (
        <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-mono uppercase tracking-widest" style={{ color: '#00f5ff' }}>
                    Question Manager ({questions.length} questions)
                </h3>
                <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}
                    onClick={() => { setShowAdd(true); setEditingId(null); setForm(BLANK); }}>
                    <Plus size={13} /> Add Question
                </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Title</th><th>Diff</th><th>Tags</th><th>Base</th>
                            <th>Current</th><th>Winner</th><th>Link</th><th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {showAdd && !editingId && <FormInline />}
                        {questions.map(q => editingId === q.id ? (
                            <FormInline key={q.id} />
                        ) : (
                            <tr key={q.id}>
                                <td style={{ color: '#e2e8f0', fontWeight: 600, maxWidth: 180 }} className="truncate">
                                    {q.title}
                                </td>
                                <td><span className={`badge ${diffBadge[q.difficulty] ?? 'badge-medium'}`}>{q.difficulty}</span></td>
                                <td style={{ maxWidth: 140 }} className="truncate">
                                    {(q.tags ?? []).join(', ')}
                                </td>
                                <td className="font-mono">{q.basePrice}</td>
                                <td className="font-mono" style={{ color: q.currentPrice > q.basePrice ? '#ffd700' : '' }}>
                                    {q.currentPrice}
                                </td>
                                <td style={{ color: q.currentWinner ? '#00ff88' : '#475569' }}>
                                    {q.currentWinnerName ?? 'None'}
                                </td>
                                <td>
                                    {q.problemLink ? (
                                        <a href={q.problemLink} target="_blank" rel="noopener noreferrer"
                                            style={{ color: '#00f5ff' }}>
                                            <ExternalLink size={13} />
                                        </a>
                                    ) : '—'}
                                </td>
                                <td>
                                    <div className="flex gap-2">
                                        <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 11 }}
                                            onClick={() => startEdit(q)}>
                                            <Pencil size={11} />
                                        </button>
                                        <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: 11 }}
                                            onClick={() => handleDelete(q.id)}>
                                            <Trash2 size={11} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
