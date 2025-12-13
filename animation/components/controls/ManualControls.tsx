
import React from 'react';
import { Activity, Flame, Droplets, Anchor, Power } from 'lucide-react';
import { SystemMode } from '../../types/index';

interface Props {
    fireFloor: number | null;
    triggerFire: (f: number) => void;
    systemMode: SystemMode;
    triggerFlood: () => void;
    snapTarget: 'A' | 'B' | 'BOTH' | null;
    triggerCableSnap: (t: 'A' | 'B') => void;
    powerScope: 'ALL' | 'A' | 'B' | null;
    triggerPowerOutage: (s: 'ALL' | 'A' | 'B') => void;
}

export const ManualControls: React.FC<Props> = ({ 
    fireFloor, triggerFire, systemMode, triggerFlood, 
    snapTarget, triggerCableSnap, powerScope, triggerPowerOutage 
}) => {
    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 md:p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-slate-400">
                <Activity size={16} /> Manual Override Controls
            </h2>
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-24 text-xs font-bold text-slate-500 flex items-center gap-1"><Flame size={14} /> FIRE</div>
                    <div className="flex gap-2 flex-1">
                        {[1, 2, 3].map(f => (
                            <button key={f} onClick={() => triggerFire(f)} className={`flex-1 py-2 rounded border text-xs font-mono font-bold ${fireFloor === f ? 'bg-red-600 border-red-500 text-white animate-pulse' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}>L{f}</button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-24 text-xs font-bold text-slate-500 flex items-center gap-1"><Droplets size={14} /> FLOOD</div>
                    <div className="flex gap-2 flex-1">
                        <button onClick={triggerFlood} className={`flex-1 py-2 rounded border text-xs font-mono font-bold ${systemMode === 'FLOOD' ? 'bg-blue-600 border-blue-500 text-white animate-pulse' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}>FLOOR 1 FLOOD</button>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-24 text-xs font-bold text-slate-500 flex items-center gap-1"><Anchor size={14} /> SNAP</div>
                    <div className="flex gap-2 flex-1">
                        <button onClick={() => triggerCableSnap('A')} className={`flex-1 py-2 rounded border text-xs font-mono font-bold ${(snapTarget === 'A' || snapTarget === 'BOTH') ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}>Lift A</button>
                        <button onClick={() => triggerCableSnap('B')} className={`flex-1 py-2 rounded border text-xs font-mono font-bold ${(snapTarget === 'B' || snapTarget === 'BOTH') ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}>Lift B</button>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-24 text-xs font-bold text-slate-500 flex items-center gap-1"><Power size={14} /> POWER</div>
                    <div className="flex gap-2 flex-1">
                        <button onClick={() => triggerPowerOutage('ALL')} className={`flex-1 py-2 rounded border text-xs font-mono font-bold ${powerScope === 'ALL' ? 'bg-yellow-600 border-yellow-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}>TOTAL</button>
                        <button onClick={() => triggerPowerOutage('A')} className={`flex-1 py-2 rounded border text-xs font-mono font-bold ${powerScope === 'A' ? 'bg-yellow-600 border-yellow-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}>LIFT A</button>
                        <button onClick={() => triggerPowerOutage('B')} className={`flex-1 py-2 rounded border text-xs font-mono font-bold ${powerScope === 'B' ? 'bg-yellow-600 border-yellow-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}>LIFT B</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
