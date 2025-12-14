
import React from 'react';
import { RotateCcw, Pause, Play, RefreshCw, Zap, Clock, Bug } from 'lucide-react';
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
    timeScale: number;
    setTimeScale: (n: number) => void;
    isDebug: boolean;
    setIsDebug: (b: boolean) => void;
}

export const Header: React.FC<Props> = ({ 
    setStep, systemMode, activeScenario, simTime, 
    resetSimulation, isRunning, setIsRunning, isAutoSimulating, setIsAutoSimulating,
    timeScale, setTimeScale, isDebug, setIsDebug
}) => {
    return (
        <header className="mb-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
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
            
            <div className="flex flex-wrap gap-2 items-center bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                
                {/* Debug Toggle */}
                 <button onClick={() => setIsDebug(!isDebug)} className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold border transition-colors text-xs md:text-sm ${isDebug ? 'bg-green-600/20 border-green-500 text-green-400' : 'bg-slate-800 border-slate-600 text-slate-500 hover:text-slate-300'}`} title="Toggle Visual Debug Overlay">
                    <Bug size={14} />
                </button>

                <div className="w-px h-6 bg-slate-700 mx-1"></div>

                {/* Auto Sim Control */}
                <button onClick={() => setIsAutoSimulating(!isAutoSimulating)} className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold border transition-colors text-xs md:text-sm ${isAutoSimulating ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_10px_rgba(147,51,234,0.5)]' : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-300'}`} title="Auto Generate Random Passengers">
                    <RefreshCw size={14} className={isAutoSimulating ? 'animate-spin' : ''} /> {isAutoSimulating ? 'Auto Sim' : 'Auto Off'}
                </button>

                <div className="w-px h-6 bg-slate-700 mx-1"></div>

                {/* Time Scale Controls */}
                <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
                    <Clock size={14} className="text-slate-400 mx-2" />
                    {[0.5, 1, 2, 3].map((scale) => (
                        <button
                            key={scale}
                            onClick={() => setTimeScale(scale)}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${timeScale === scale ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        >
                            x{scale}
                        </button>
                    ))}
                </div>

                <div className="w-px h-6 bg-slate-700 mx-1"></div>

                {/* Playback Controls */}
                <button onClick={resetSimulation} className="flex items-center gap-2 px-3 py-2 rounded-lg font-bold bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-colors text-xs md:text-sm text-slate-300">
                    <RotateCcw size={14} /> Restart Simulasi
                </button>
                <button onClick={() => setIsRunning(!isRunning)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold shadow-lg transition-all text-xs md:text-sm ${isRunning ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}>
                    {isRunning ? <><Pause size={14} fill="currentColor" /> Pause</> : <><Play size={14} fill="currentColor" /> Play</>}
                </button>
            </div>
        </header>
    );
};
