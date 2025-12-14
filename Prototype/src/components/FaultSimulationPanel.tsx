/**
 * Fault Simulation Control Panel
 * 
 * UI for activating and monitoring fault conditions
 * 
 * @module components/FaultSimulationPanel
 */

import React from 'react';
import {
    FaultType,
    FaultState,
    FAULT_DESCRIPTIONS,
    activateFault,
} from '../engine/FaultSimulation';
import {
    AlertTriangle,
    Zap,
    Thermometer,
    Cable,
    Gauge,
    Power,
    Weight,
    Radio,
    ShieldOff,
    ShieldCheck,
} from 'lucide-react';

interface FaultSimulationPanelProps {
    faultState: FaultState;
    onActivateFault: (fault: FaultState) => void;
    onClearFault: () => void;
}

const FAULT_ICONS: Record<FaultType, React.ReactNode> = {
    NONE: <ShieldCheck className="w-4 h-4" />,
    MOTOR_OVERHEAT: <Thermometer className="w-4 h-4" />,
    MOTOR_FAILURE: <Power className="w-4 h-4" />,
    BRAKE_DELAY: <Gauge className="w-4 h-4" />,
    BRAKE_FAILURE: <ShieldOff className="w-4 h-4" />,
    CABLE_TENSION_IMBALANCE: <Cable className="w-4 h-4" />,
    POWER_FLUCTUATION: <Zap className="w-4 h-4" />,
    OVERLOAD: <Weight className="w-4 h-4" />,
    SENSOR_MALFUNCTION: <Radio className="w-4 h-4" />,
};

const SEVERITY_COLORS = {
    LOW: 'bg-slate-600 text-slate-300',
    MEDIUM: 'bg-amber-600/80 text-amber-100',
    HIGH: 'bg-orange-600/80 text-orange-100',
    CRITICAL: 'bg-red-600/80 text-red-100 animate-pulse',
};

export const FaultSimulationPanel: React.FC<FaultSimulationPanelProps> = ({
    faultState,
    onActivateFault,
    onClearFault,
}) => {
    const handleActivate = (type: FaultType, lift: 'A' | 'B' | 'BOTH') => {
        const newFault = activateFault(type, lift, 30000); // 30 second duration
        onActivateFault(newFault);
    };

    const faultTypes: FaultType[] = [
        'MOTOR_OVERHEAT',
        'MOTOR_FAILURE',
        'BRAKE_DELAY',
        'BRAKE_FAILURE',
        'CABLE_TENSION_IMBALANCE',
        'POWER_FLUCTUATION',
        'OVERLOAD',
        'SENSOR_MALFUNCTION',
    ];

    return (
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <h3 className="text-lg font-bold text-white">Fault Simulation</h3>
                </div>

                {faultState.active && (
                    <button
                        onClick={onClearFault}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-bold transition-all"
                    >
                        Clear Fault
                    </button>
                )}
            </div>

            {/* Active Fault Display */}
            {faultState.active && faultState.type !== 'NONE' && (
                <div className={`mb-4 p-3 rounded-lg border-l-4 ${FAULT_DESCRIPTIONS[faultState.type].severity === 'CRITICAL'
                        ? 'bg-red-900/50 border-red-500'
                        : FAULT_DESCRIPTIONS[faultState.type].severity === 'HIGH'
                            ? 'bg-orange-900/50 border-orange-500'
                            : 'bg-amber-900/50 border-amber-500'
                    }`}>
                    <div className="flex items-center gap-2 mb-1">
                        {FAULT_ICONS[faultState.type]}
                        <span className="font-bold text-white">{FAULT_DESCRIPTIONS[faultState.type].title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${SEVERITY_COLORS[FAULT_DESCRIPTIONS[faultState.type].severity]}`}>
                            {FAULT_DESCRIPTIONS[faultState.type].severity}
                        </span>
                    </div>
                    <p className="text-sm text-slate-300">{FAULT_DESCRIPTIONS[faultState.type].description}</p>
                    <div className="mt-2 flex gap-4 text-xs text-slate-400">
                        <span>Lift: {faultState.affectedLift}</span>
                        <span>Severity: {faultState.severity.toFixed(0)}%</span>
                    </div>
                </div>
            )}

            {/* Fault Type Grid */}
            <div className="grid grid-cols-2 gap-2">
                {faultTypes.map((type) => {
                    const info = FAULT_DESCRIPTIONS[type];
                    const isActive = faultState.type === type;

                    return (
                        <div
                            key={type}
                            className={`bg-slate-800/50 border rounded-lg p-2 ${isActive ? 'border-red-500 bg-red-900/20' : 'border-slate-600'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className={isActive ? 'text-red-400' : 'text-slate-400'}>
                                    {FAULT_ICONS[type]}
                                </span>
                                <span className="text-xs font-bold text-white truncate">{info.title}</span>
                            </div>

                            <div className="flex gap-1">
                                {(['A', 'B', 'BOTH'] as const).map((lift) => (
                                    <button
                                        key={lift}
                                        onClick={() => handleActivate(type, lift)}
                                        disabled={isActive}
                                        className={`flex-1 px-2 py-1 text-xs rounded transition-all ${isActive
                                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                                : lift === 'A'
                                                    ? 'bg-blue-600/50 hover:bg-blue-600 text-blue-200'
                                                    : lift === 'B'
                                                        ? 'bg-emerald-600/50 hover:bg-emerald-600 text-emerald-200'
                                                        : 'bg-purple-600/50 hover:bg-purple-600 text-purple-200'
                                            }`}
                                    >
                                        {lift}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FaultSimulationPanel;
