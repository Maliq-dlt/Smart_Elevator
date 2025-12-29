
import React from 'react';
import { LiftState, SimulationStats, MachineComponent } from '../types/index';
import { Activity, AlertTriangle, Zap, BarChart2, MapPin, Battery } from 'lucide-react';

interface Props {
    liftA: LiftState;
    liftB: LiftState;
    stats: SimulationStats;
    bootSequence?: number;
}

const Gauge: React.FC<{ value: number; label: string; color: string; suffix?: string }> = ({ value, label, color, suffix = '%' }) => {
    const radius = 40;
    const maxLen = Math.PI * radius;
    const currentLen = (Math.max(0, Math.min(100, value)) / 100) * maxLen;

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-slate-800 rounded-lg border border-slate-700 relative">
            <div className="relative w-32 h-16 overflow-hidden">
                <svg viewBox="0 0 100 50" className="w-full h-full">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
                    <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="none"
                        stroke={color}
                        strokeWidth="8"
                        strokeDasharray={`${maxLen} ${maxLen}`}
                        strokeDashoffset={maxLen - currentLen}
                        strokeLinecap="round"
                        className="transition-all duration-300 ease-out"
                    />
                </svg>
            </div>
            <div className="text-2xl font-bold font-mono -mt-4 text-white relative z-10">{Math.round(value)}{suffix}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">{label}</div>
        </div>
    );
};

const ComponentRow: React.FC<{ liftId: string; comp: MachineComponent; bootScale: number }> = ({ liftId, comp, bootScale }) => {
    let statusColor = 'bg-emerald-500';
    if (comp.status === 'WARNING') statusColor = 'bg-amber-500';
    if (comp.status === 'CRITICAL') statusColor = 'bg-rose-500 animate-pulse';
    const displayHealth = comp.health * bootScale;

    return (
        <div className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 px-2 transition-colors">
            <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${statusColor} shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />
                <div>
                    <div className="font-mono text-xs font-bold text-slate-300">{liftId} - {comp.name}</div>
                    <div className="text-[10px] text-slate-500">Cycles: {comp.cycles}</div>
                </div>
            </div>
            <div className="flex items-center gap-4 w-1/3">
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700">
                    <div
                        className={`h-full transition-all duration-500 ${displayHealth > 70 ? 'bg-blue-500' : displayHealth > 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${displayHealth}%` }}
                    />
                </div>
                <span className="text-xs font-mono w-8 text-right text-slate-400">{Math.round(displayHealth)}%</span>
            </div>
        </div>
    );
};

const BatteryStatus: React.FC<{ liftA: number; liftB: number }> = ({ liftA, liftB }) => (
    <div className="flex flex-col gap-2 p-4 bg-slate-800 rounded-lg border border-slate-700">
        <div className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Battery size={12} /> BACKUP POWER</div>
        <div className="flex gap-2">
            <div className="flex-1">
                <div className="flex justify-between text-xs text-slate-300 mb-1"><span>LIFT A</span><span>{Math.round(liftA)}%</span></div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className={`h-full ${liftA < 20 ? 'bg-red-500' : 'bg-green-500'} transition-all duration-500`} style={{ width: `${liftA}%` }} />
                </div>
            </div>
            <div className="flex-1">
                <div className="flex justify-between text-xs text-slate-300 mb-1"><span>LIFT B</span><span>{Math.round(liftB)}%</span></div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className={`h-full ${liftB < 20 ? 'bg-red-500' : 'bg-green-500'} transition-all duration-500`} style={{ width: `${liftB}%` }} />
                </div>
            </div>
        </div>
    </div>
);

export const Dashboard: React.FC<Props> = ({ liftA, liftB, stats, bootSequence = 100 }) => {
    const bootScale = bootSequence / 100;
    const availability = 98.5 * bootScale;
    const performance = Math.min(100, (stats.totalPassengersDelivered / (stats.totalPassengersDelivered + 5)) * 100 + 20) * bootScale;
    const oee = ((availability * performance) / 100);
    const voltage = 220 * bootScale;
    const maxFloorVisits = Math.max(...(Object.values(stats.floorVisits) as number[]), 1);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
                <Gauge value={voltage / 2.2} label="Main Voltage" color="#8b5cf6" suffix="V" />
                <Gauge value={availability} label="Availability" color="#10b981" />
                <Gauge value={oee} label="OEE Score" color="#3b82f6" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col h-[400px]">
                    <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                            <Activity size={16} className="text-blue-400" /> COMPONENT HEALTH
                        </h3>
                        <div className="flex gap-2">
                            {bootSequence < 100 ? (
                                <span className="text-[10px] px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded border border-yellow-500/20 animate-pulse font-bold">BOOTING {bootSequence}%</span>
                            ) : (
                                <span className="text-[10px] px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20 font-bold">LIVE</span>
                            )}
                        </div>
                    </div>
                    <div className="overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-600">
                        {liftA.components.map((c, i) => <ComponentRow key={`A-${i}`} liftId="LIFT A" comp={c} bootScale={bootScale} />)}
                        {liftB.components.map((c, i) => <ComponentRow key={`B-${i}`} liftId="LIFT B" comp={c} bootScale={bootScale} />)}
                    </div>
                </div>
                <div className="flex flex-col gap-4 h-[400px]">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex-1 flex flex-col">
                        <div className="text-xs text-slate-400 mb-2 flex justify-between">
                            <span className="flex items-center gap-1"><Zap size={12} /> POWER CONSUMPTION (Real-time)</span>
                            <span className="text-yellow-400 font-mono font-bold">{(stats.totalEnergyJ / 1000).toFixed(1)} kJ</span>
                        </div>
                        <div className="flex-1 relative border-b border-l border-slate-600/50 overflow-hidden bg-slate-900/30">
                            {/* Grid lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                {[0, 1, 2, 3].map(i => (
                                    <div key={i} className="w-full border-t border-slate-700/30" />
                                ))}
                            </div>
                            {/* Animated line chart */}
                            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#facc15" stopOpacity="0.8" />
                                        <stop offset="100%" stopColor="#facc15" stopOpacity="0.1" />
                                    </linearGradient>
                                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#facc15" stopOpacity="0.3" />
                                        <stop offset="100%" stopColor="#facc15" stopOpacity="0.05" />
                                    </linearGradient>
                                </defs>
                                {/* Area fill */}
                                <path
                                    d={(() => {
                                        const data = stats.energyHistory.slice(-60);
                                        const maxVal = 4000;
                                        const points = data.map((val, i) => {
                                            const x = (i / (data.length - 1)) * 100;
                                            const y = 100 - Math.min(100, (val / maxVal) * 100);
                                            return `${x},${y}`;
                                        });
                                        return `M0,100 L${points.join(' L')} L100,100 Z`;
                                    })()}
                                    fill="url(#areaGradient)"
                                    className="transition-all duration-150 ease-out"
                                />
                                {/* Line */}
                                <path
                                    d={(() => {
                                        const data = stats.energyHistory.slice(-60);
                                        const maxVal = 4000;
                                        const points = data.map((val, i) => {
                                            const x = (i / (data.length - 1)) * 100;
                                            const y = 100 - Math.min(100, (val / maxVal) * 100);
                                            return `${x},${y}`;
                                        });
                                        return `M${points.join(' L')}`;
                                    })()}
                                    fill="none"
                                    stroke="#facc15"
                                    strokeWidth="2"
                                    vectorEffect="non-scaling-stroke"
                                    className="transition-all duration-150 ease-out"
                                />
                                {/* Current value dot */}
                                <circle
                                    cx="100"
                                    cy={100 - Math.min(100, (stats.energyHistory[stats.energyHistory.length - 1] / 4000) * 100)}
                                    r="3"
                                    fill="#facc15"
                                    className="transition-all duration-150 ease-out"
                                    style={{ filter: 'drop-shadow(0 0 4px #facc15)' }}
                                />
                            </svg>
                            {/* Current value label */}
                            <div className="absolute top-2 right-2 bg-slate-900/80 px-2 py-1 rounded text-xs font-mono text-yellow-400 border border-yellow-500/30">
                                {stats.energyHistory[stats.energyHistory.length - 1]?.toFixed(0) || 0} W
                            </div>
                        </div>
                        <BatteryStatus liftA={liftA.batteryLevel} liftB={liftB.batteryLevel} />
                    </div>
                    <div className="flex gap-4 flex-1">
                        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 w-1/2 flex flex-col">
                            <div className="text-xs text-slate-400 mb-2 flex items-center gap-1"><MapPin size={12} /> FLOOR TRAFFIC</div>
                            <div className="flex flex-col justify-between flex-1 gap-2">
                                {[3, 2, 1].map(f => (
                                    <div key={f} className="flex items-center gap-2 text-xs">
                                        <span className="w-4 font-mono text-slate-500">{f}</span>
                                        <div className="flex-1 h-4 bg-slate-900 rounded overflow-hidden">
                                            <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${((stats.floorVisits[f] || 0) / maxFloorVisits) * 100}%` }} />
                                        </div>
                                        <span className="w-6 text-right text-slate-300">{stats.floorVisits[f] || 0}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 w-1/2 flex flex-col justify-between">
                            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1"><BarChart2 size={12} /> PASSENGER LOAD</div>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                <div className="bg-slate-900 p-2 rounded border border-slate-700">
                                    <div className="text-[10px] text-slate-500">MAX</div>
                                    <div className="text-lg font-mono font-bold text-white">{stats.peakPassengers}</div>
                                </div>
                                <div className="bg-slate-900 p-2 rounded border border-slate-700">
                                    <div className="text-[10px] text-slate-500">MIN</div>
                                    <div className="text-lg font-mono font-bold text-white">{stats.minPassengers}</div>
                                </div>
                                <div className="bg-slate-900 p-2 rounded border border-slate-700 col-span-2">
                                    <div className="text-[10px] text-slate-500">AVG Wait Time</div>
                                    <div className="text-lg font-mono font-bold text-blue-400">{stats.avgWaitTime.toFixed(1)}s</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {(liftA.components.some(c => c.status === 'CRITICAL') || liftB.components.some(c => c.status === 'CRITICAL')) && (
                <div className="bg-rose-900/20 border border-rose-500/50 p-4 rounded-lg flex items-start gap-3 animate-pulse">
                    <AlertTriangle className="text-rose-500 shrink-0" />
                    <div>
                        <h4 className="font-bold text-rose-400">CRITICAL MAINTENANCE REQUIRED</h4>
                        <p className="text-xs text-rose-300">One or more machine components have reached critical wear levels. Schedule immediate maintenance.</p>
                    </div>
                </div>
            )}
        </div>
    );
};
