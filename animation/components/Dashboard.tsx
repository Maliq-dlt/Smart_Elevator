import React from 'react';
import { LiftState, SimulationStats, MachineComponent } from '../types';
import { Activity, AlertTriangle, Zap, BarChart2, MapPin } from 'lucide-react';

interface Props {
  liftA: LiftState;
  liftB: LiftState;
  stats: SimulationStats;
}

// Improved Gauge using SVG for smoother rendering
const Gauge: React.FC<{ value: number; label: string; color: string }> = ({ value, label, color }) => {
    // Radius 40, centered at (50, 50). Arc from 10,50 to 90,50.
    const radius = 40;
    const maxLen = Math.PI * radius; // Semi-circle length
    const currentLen = (Math.max(0, Math.min(100, value)) / 100) * maxLen;
    
    return (
        <div className="flex flex-col items-center justify-center p-4 bg-slate-800 rounded-lg border border-slate-700 relative">
            <div className="relative w-32 h-16 overflow-hidden">
                 <svg viewBox="0 0 100 50" className="w-full h-full">
                    {/* Background Arc */}
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
                    {/* Foreground Arc */}
                    <path 
                        d="M 10 50 A 40 40 0 0 1 90 50" 
                        fill="none" 
                        stroke={color} 
                        strokeWidth="8" 
                        strokeDasharray={`${maxLen} ${maxLen}`}
                        strokeDashoffset={maxLen - currentLen}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                 </svg>
            </div>
            <div className="text-2xl font-bold font-mono -mt-4 text-white relative z-10">{Math.round(value)}%</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">{label}</div>
        </div>
    );
};

const ComponentRow: React.FC<{ liftId: string; comp: MachineComponent }> = ({ liftId, comp }) => {
    let statusColor = 'bg-emerald-500';
    if (comp.status === 'WARNING') statusColor = 'bg-amber-500';
    if (comp.status === 'CRITICAL') statusColor = 'bg-rose-500 animate-pulse';

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
                        className={`h-full transition-all duration-500 ${comp.health > 70 ? 'bg-blue-500' : comp.health > 40 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                        style={{ width: `${comp.health}%` }}
                    />
                </div>
                <span className="text-xs font-mono w-8 text-right text-slate-400">{Math.round(comp.health)}%</span>
            </div>
        </div>
    );
};

export const Dashboard: React.FC<Props> = ({ liftA, liftB, stats }) => {
    // Calculate OEE metrics
    const availability = 98.5; // Simulated uptime
    const performance = Math.min(100, (stats.totalPassengersDelivered / (stats.totalPassengersDelivered + 5)) * 100 + 20); 
    const oee = (availability * performance) / 100;

    const maxFloorVisits = Math.max(...(Object.values(stats.floorVisits) as number[]), 1);

    return (
        <div className="space-y-6">
            {/* Top Row: Gauges */}
            <div className="grid grid-cols-3 gap-4">
                <Gauge value={availability} label="Availability" color="#10b981" />
                <Gauge value={performance} label="Performance" color="#f59e0b" />
                <Gauge value={oee} label="OEE Score" color="#3b82f6" />
            </div>

            {/* Middle Row: Machine Status & Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left: Component Health Monitoring */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col h-[400px]">
                    <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                            <Activity size={16} className="text-blue-400" />
                            MACHINE HEALTH STATUS
                        </h3>
                        <div className="flex gap-2">
                            <span className="text-[10px] px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20 animate-pulse">MONITORING</span>
                        </div>
                    </div>
                    <div className="overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-600">
                        {liftA.components.map((c, i) => <ComponentRow key={`A-${i}`} liftId="LIFT A" comp={c} />)}
                        {liftB.components.map((c, i) => <ComponentRow key={`B-${i}`} liftId="LIFT B" comp={c} />)}
                    </div>
                </div>

                {/* Right: Charts & Stats */}
                <div className="flex flex-col gap-4 h-[400px]">
                    
                    {/* Power Consumption Graph */}
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex-1 flex flex-col">
                        <div className="text-xs text-slate-400 mb-2 flex justify-between">
                            <span className="flex items-center gap-1"><Zap size={12} /> POWER CONSUMPTION (Real-time)</span>
                            <span className="text-yellow-400 font-mono font-bold">{(stats.totalEnergyJ / 1000).toFixed(1)} kJ</span>
                        </div>
                        <div className="flex items-end gap-1 h-full pt-4 border-b border-l border-slate-600/50 relative overflow-hidden">
                            {/* Grid lines */}
                            <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none">
                                <div className="w-full h-px bg-white"></div>
                                <div className="w-full h-px bg-white"></div>
                                <div className="w-full h-px bg-white"></div>
                            </div>

                            {stats.energyHistory.slice(-25).map((val: number, idx: number) => {
                                const height = Math.min(100, (val / 4000) * 100); // Scale based on max load
                                return (
                                    <div key={idx} className="flex-1 bg-yellow-500/20 hover:bg-yellow-400/80 transition-all duration-300 relative group rounded-t-sm border-t border-yellow-500/50" style={{ height: `${height}%` }}>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Floor Frequency & Passenger Stats */}
                    <div className="flex gap-4 flex-1">
                        
                        {/* Floor Stats */}
                        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 w-1/2 flex flex-col">
                            <div className="text-xs text-slate-400 mb-2 flex items-center gap-1"><MapPin size={12} /> FLOOR TRAFFIC</div>
                            <div className="flex flex-col justify-between flex-1 gap-2">
                                {[3, 2, 1].map(f => (
                                    <div key={f} className="flex items-center gap-2 text-xs">
                                        <span className="w-4 font-mono text-slate-500">{f}</span>
                                        <div className="flex-1 h-4 bg-slate-900 rounded overflow-hidden">
                                            <div 
                                                className="h-full bg-indigo-500 transition-all duration-500" 
                                                style={{ width: `${((stats.floorVisits[f] || 0) / maxFloorVisits) * 100}%` }}
                                            />
                                        </div>
                                        <span className="w-6 text-right text-slate-300">{stats.floorVisits[f] || 0}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Passenger Stats */}
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

            {/* Bottom Alert Section (Conditional) */}
            {(liftA.components.some(c => c.status === 'CRITICAL') || liftB.components.some(c => c.status === 'CRITICAL')) && (
                <div className="bg-rose-900/20 border border-rose-500/50 p-4 rounded-lg flex items-start gap-3 animate-pulse">
                    <AlertTriangle className="text-rose-500 shrink-0" />
                    <div>
                        <h4 className="font-bold text-rose-400">CRITICAL MAINTENANCE REQUIRED</h4>
                        <p className="text-xs text-rose-300">
                            One or more machine components have reached critical wear levels. Schedule immediate maintenance or generate analysis report for details.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};