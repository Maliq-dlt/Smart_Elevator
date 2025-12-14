
import React from 'react';
import { LiftState } from '../types/index';
import { Activity, Anchor, Thermometer, ShieldCheck, AlertTriangle } from 'lucide-react';

interface Props {
    liftA: LiftState;
    liftB: LiftState;
}

const SensorRow = ({ label, value, unit = '' }: { label: string; value: string | number; unit?: string }) => (
    <div className="flex justify-between items-center text-[10px] font-mono border-b border-slate-800/50 pb-1 mb-1 last:border-0 last:mb-0">
        <span className="text-slate-500">{label}</span>
        <span className="text-emerald-400">{value}<span className="text-slate-600 ml-0.5">{unit}</span></span>
    </div>
);

const SafetyIndicator = ({ active, label }: { active: boolean; label: string }) => (
    <div className={`flex items-center gap-1.5 ${active ? 'opacity-100' : 'opacity-30 grayscale'}`}>
        <div className={`w-2 h-2 rounded-full ${active ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)]' : 'bg-slate-600'}`} />
        <span className="text-[9px] font-bold text-slate-300">{label}</span>
    </div>
);

const LiftDebugColumn = ({ lift }: { lift: LiftState }) => (
    <div className="flex-1 bg-slate-900/80 p-3 rounded border border-slate-700/50 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-1">
            <h4 className="font-bold text-xs text-white">LIFT {lift.id} MCU</h4>
            <span className={`text-[9px] px-1 rounded ${lift.safety.systemHealthy ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                {lift.safety.systemHealthy ? 'HEALTHY' : 'FAULT'}
            </span>
        </div>

        {/* SENSORS */}
        <div className="mb-3">
            <h5 className="text-[9px] font-bold text-slate-500 mb-1 flex items-center gap-1"><Activity size={10} /> SENSOR INPUTS</h5>
            <SensorRow label="POS ENC" value={lift.sensors.position.toFixed(5)} unit="flr" />
            <SensorRow label="VELOCITY" value={lift.sensors.velocity.toFixed(2)} unit="m/s" />
            <SensorRow label="LOAD CELL" value={lift.sensors.load.toFixed(1)} unit="kg" />
            <SensorRow label="CAB TENS" value={Math.round(lift.sensors.cableTension)} unit="N" />
            <SensorRow label="DOOR SW" value={lift.sensors.doorState} />
            <SensorRow label="TEMP" value={lift.sensors.temperature.toFixed(1)} unit="°C" />
        </div>

        {/* SAFETY CHAIN */}
        <div>
            <h5 className="text-[9px] font-bold text-slate-500 mb-1 flex items-center gap-1"><ShieldCheck size={10} /> SAFETY CHAIN</h5>
            <div className="grid grid-cols-2 gap-1 bg-black/20 p-2 rounded">
                <SafetyIndicator active={lift.safety.doorInterlockClosed} label="DOOR LOCK" />
                <SafetyIndicator active={!lift.safety.overSpeedGovernorTripped} label="GOVERNOR" />
                <SafetyIndicator active={!lift.safety.emergencyBrakeEngaged} label="BRAKE REL" />
                <SafetyIndicator active={!lift.safety.limitSwitchTop} label="LIM TOP" />
                <SafetyIndicator active={!lift.safety.limitSwitchBottom} label="LIM BOT" />
            </div>
            {lift.safety.emergencyBrakeEngaged && (
                <div className="mt-2 bg-red-900/50 border border-red-500 p-1 text-center text-[10px] text-red-200 font-bold animate-pulse">
                    EMERGENCY BRAKE ACTIVE
                </div>
            )}
        </div>
    </div>
);

export const DebugPanel: React.FC<Props> = ({ liftA, liftB }) => {
    return (
        <div className="absolute top-20 left-6 z-40 flex flex-col gap-2 w-[400px] pointer-events-none">
            <div className="flex gap-2">
                <LiftDebugColumn lift={liftA} />
                <LiftDebugColumn lift={liftB} />
            </div>
        </div>
    );
};
