// src/components/admin/GameControl.jsx
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Play, Snowflake, Square, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GameControl({ gameState }) {
    const [loading, setLoading] = useState(false);

    const setState = async (newState) => {
        setLoading(true);
        try {
            await updateDoc(doc(db, 'config', 'main'), { gameState: newState });
            toast.success(`Game state → ${newState.toUpperCase()}`);
        } catch (err) {
            toast.error('Failed: ' + err.message);
        }
        setLoading(false);
    };

    const stateConfig = {
        idle: { label: 'Idle — Waiting', color: '#475569', icon: <Square size={14} /> },
        active: { label: 'LIVE — Bidding On', color: '#00ff88', icon: <Play size={14} /> },
        frozen: { label: 'FROZEN', color: '#00f5ff', icon: <Snowflake size={14} /> },
    };
    const s = stateConfig[gameState] ?? stateConfig.idle;

    return (
        <div className="card p-5">
            <h3 className="text-xs font-mono mb-4 uppercase tracking-widest" style={{ color: '#00f5ff' }}>
                Game Control
            </h3>

            {/* Current state */}
            <div className="flex items-center gap-3 p-3 rounded-lg mb-5"
                style={{ background: '#080c14', border: `1px solid ${s.color}40` }}>
                <span style={{ color: s.color }}>{s.icon}</span>
                <div>
                    <p className="text-xs font-mono" style={{ color: '#475569' }}>CURRENT STATE</p>
                    <p className="text-sm font-bold" style={{ color: s.color }}>{s.label}</p>
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 flex-wrap">
                <button
                    id="start-bidding-btn"
                    className="btn btn-success flex-1"
                    disabled={loading || gameState === 'active'}
                    onClick={() => setState('active')}
                >
                    <Play size={14} /> Start Bidding
                </button>
                <button
                    id="freeze-bidding-btn"
                    className="btn flex-1"
                    style={{
                        background: 'linear-gradient(135deg, #00bcd4, #0097a7)',
                        color: '#000', fontWeight: 700,
                    }}
                    disabled={loading || gameState === 'frozen'}
                    onClick={() => setState('frozen')}
                >
                    <Snowflake size={14} /> Freeze
                </button>
                <button
                    id="reset-game-btn"
                    className="btn btn-ghost flex-1"
                    disabled={loading || gameState === 'idle'}
                    onClick={() => setState('idle')}
                >
                    <Square size={14} /> Reset to Idle
                </button>
            </div>

            {gameState === 'frozen' && (
                <div className="flex items-center gap-2 mt-4 text-xs" style={{ color: '#ffd700' }}>
                    <AlertTriangle size={12} />
                    Bidding is frozen. Players cannot place new bids.
                </div>
            )}
        </div>
    );
}
