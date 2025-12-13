
import React from 'react';
import { RotateCcw, Pause, Play, RefreshCw } from 'lucide-react';
import { SystemMode, Scenario } from '../../types/index';

interface Props {
    setStep: (s: any) => void;
    systemMode: SystemMode;
    activeScenario: Scenario | null;
    simTime: number;
    resetSimulation: () => void;
    isRunning: boolean;
    setIsRunning: (b: boolean) => void;
    isAutoSimulating: boolean;
    setIsAutoSimulating: (b: boolean) => void;
}

export const Header: React.FC<Props> = ({ 
    setStep, systemMode, activeScenario, simTime, 
    resetSimulation, isRunning, setIsRunning, isAutoSimulating, setIsAutoSimulating 
}) => {
    return (
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div onClick={() => setStep('LANDING')} className="flex items-center gap-4 cursor-pointer group hover:opacity-90 transition-opacity" title="Return to Dashboard Lobby">
                <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/50 transition-all border border-blue-400/20">
                    <span className="font-mono text-white font-bold text-xl">E</span>
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Smart Elevator System</h1>
                    <p className="text-slate-400 text-xs md:text-sm mt-1 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full animate-pulse ${systemMode === 'NORMAL' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        Mode: {activeScenario?.title || 'System Active'} • <span className="text-yellow-400 font-mono">T: {simTime.toFixed(1)}s</span>
                    </p>
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setIsAutoSimulating(!isAutoSimulating)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold border transition-colors text-sm ${isAutoSimulating ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_10px_rgba(147,51,234,0.5)]' : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-300'}`} title="Auto Generate Random Passengers">
                    <RefreshCw size={16} className={isAutoSimulating ? 'animate-spin' : ''} /> {isAutoSimulating ? 'Auto Sim ON' : 'Auto Sim'}
                </button>
                <button onClick={resetSimulation} className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-colors text-sm">
                    <RotateCcw size={16} /> Reset
                </button>
                <button onClick={() => setIsRunning(!isRunning)} className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold shadow-lg transition-all text-sm ${isRunning ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}>
                    {isRunning ? <><Pause size={16} fill="currentColor" /> Jeda</> : <><Play size={16} fill="currentColor" /> Lanjut</>}
                </button>
            </div>
        </header>
    );
};
