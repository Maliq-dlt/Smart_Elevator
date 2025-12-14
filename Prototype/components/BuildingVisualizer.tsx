
import React, { useState } from 'react';
import { LiftState, BuildingState, Passenger } from '../types/index';
import { FLOORS, FLOOR_PIXELS, LIFT_CAPACITY_KG } from '../constants/index';
import { ArrowUp, ArrowDown, User, Flame, ZapOff, Cross, Waves, Activity, AlertOctagon, Battery, Bug, Box, X } from 'lucide-react';
import { DebugPanel } from './DebugPanel';
import { Elevator3DScene } from './Elevator3DScene';
import { MachineStats } from './MachineStats';

interface Props {
    liftA: LiftState;
    liftB: LiftState;
    building: BuildingState;
    mode: string;
    fireFloor: number | null;
    isDebug?: boolean;
}

const PassengerIcon: React.FC<{ p: Passenger; insideLift: boolean }> = ({ p, insideLift }) => (
    <div
        className="relative group animate-in fade-in zoom-in duration-300"
        title={`${p.name} (${p.weight}kg) -> ${p.destinationFloor}`}
    >
        <User
            size={insideLift ? 16 : 20}
            className={`${insideLift ? 'text-white' : p.destinationFloor > p.startFloor ? 'text-green-400' : 'text-red-400'}`}
        />
        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500" />
    </div>
);

const LiftShaft: React.FC<{ lift: LiftState; name: string; mode: string; isDebug?: boolean }> = ({ lift, name, mode, isDebug }) => {
    const bottomPos = (lift.currentFloor - 1) * FLOOR_PIXELS;
    const isOverloaded = lift.status === 'OVERLOAD';
    const isEmergency = lift.status === 'EMERGENCY_HALT';
    const isMaintenance = lift.status === 'MAINTENANCE';
    const isBattery = lift.status === 'BATTERY_MODE';
    const loadPercentage = Math.min(100, (lift.totalWeight / LIFT_CAPACITY_KG) * 100);

    let loadColor = 'bg-green-500';
    if (loadPercentage > 60) loadColor = 'bg-yellow-500';
    if (loadPercentage > 90) loadColor = 'bg-red-500';

    return (
        <div className="relative w-40 h-[480px] bg-slate-800/80 border-x border-slate-700/50 flex flex-col justify-end backdrop-blur-sm shadow-inner overflow-hidden">
            {/* Shaft Background Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                {[1, 2, 3].map(f => <div key={f} className="h-px bg-white w-full" style={{ bottom: (f - 1) * FLOOR_PIXELS }} />)}
            </div>

            {/* Rails */}
            <div className="absolute left-2 top-0 bottom-0 w-1 bg-slate-900 border-x border-slate-700" />
            <div className="absolute right-2 top-0 bottom-0 w-1 bg-slate-900 border-x border-slate-700" />

            {/* The Cabin */}
            <div
                className={`absolute left-3 right-3 h-[140px] rounded-lg shadow-xl flex flex-col overflow-hidden transition-all duration-100 ease-linear
          ${mode === 'POWER_OUTAGE' && !isBattery ? 'bg-slate-900 border border-slate-700 grayscale' : 'bg-slate-200 border-2 border-slate-400'}
          ${mode === 'FIRE_ALARM' ? 'ring-4 ring-red-500/50 animate-pulse' : ''}
          ${isOverloaded ? 'ring-4 ring-red-600 animate-bounce' : ''}
          ${isEmergency ? 'ring-4 ring-red-600 rotate-2 grayscale' : ''} 
          ${isMaintenance ? 'bg-slate-400 grayscale opacity-50' : ''}
          ${isDebug ? 'ring-1 ring-green-500' : ''}
        `}
                style={{ bottom: `${bottomPos + 10}px` }}
            >
                {/* Maintenance Overlay */}
                {isMaintenance && (
                    <div className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center text-center">
                        <AlertOctagon size={32} className="text-red-500 mb-2" />
                        <span className="text-red-500 font-bold font-mono text-xs border-2 border-red-500 px-2 py-1 rotate-[-10deg]">OUT OF<br />SERVICE</span>
                    </div>
                )}

                {/* LED Header Display */}
                <div className={`px-2 py-1 flex justify-between items-center border-b-2 border-slate-800 h-[28px] ${isEmergency ? 'bg-red-950' : 'bg-slate-900'}`}>
                    <span className="text-[10px] text-slate-500 font-mono tracking-tighter">{name}</span>
                    <div className="flex items-center gap-2">
                        {isBattery && <Battery size={10} className="text-yellow-400 animate-pulse" />}

                        {isEmergency ? (
                            <span className="text-red-500 font-bold text-[10px]">ERR</span>
                        ) : (
                            <>
                                <span className="font-mono text-[10px] text-green-400">{lift.panel.cabinDisplay}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Interior */}
                <div className="flex-1 bg-gradient-to-b from-slate-300 to-slate-400 relative p-2 flex flex-wrap content-end gap-1 overflow-hidden z-0">
                    <div className="absolute inset-x-4 top-2 bottom-8 bg-slate-200/30 rounded border border-white/20" />
                    {lift.passengers.map((p) => (
                        <PassengerIcon key={p.id} p={p} insideLift={true} />
                    ))}
                </div>

                {/* Doors */}
                <div className="absolute inset-0 top-[28px] bottom-[6px] flex pointer-events-none z-20">
                    <div
                        className="h-full bg-slate-400 border-r border-slate-500 shadow-lg transition-all duration-100 ease-linear"
                        style={{ width: `${(1 - lift.doorOpenProgress) * 50}%` }}
                    >
                        <div className="w-4 h-12 bg-slate-800/50 mx-auto mt-4 rounded-sm border border-slate-600/50" />
                    </div>
                    <div
                        className="h-full bg-slate-400 border-l border-slate-500 shadow-lg transition-all duration-100 ease-linear ml-auto"
                        style={{ width: `${(1 - lift.doorOpenProgress) * 50}%` }}
                    >
                        <div className="w-4 h-12 bg-slate-800/50 mx-auto mt-4 rounded-sm border border-slate-600/50" />
                    </div>
                </div>

                <div className="h-[6px] bg-slate-800 w-full relative">
                    <div className={`h-full transition-all duration-300 ${loadColor}`} style={{ width: `${loadPercentage}%` }} />
                </div>
            </div>
        </div>
    );
};

export const BuildingVisualizer: React.FC<Props> = ({ liftA, liftB, building, mode, fireFloor, isDebug }) => {
    const [show3D, setShow3D] = useState(false);

    return (
        <div className={`bg-slate-950 p-6 rounded-xl border border-slate-700 shadow-2xl relative overflow-hidden transition-transform duration-100 ${mode === 'EARTHQUAKE' ? 'animate-[shake_0.5s_ease-in-out_infinite]' : ''}`}>

            {/* DEBUG HUD LAYER */}
            {isDebug && <DebugPanel liftA={liftA} liftB={liftB} />}

            {/* 3D MACHINE OVERLAY */}
            {show3D && (
                <div className="fixed inset-0 z-50 flex animate-in fade-in duration-300 bg-black/80 backdrop-blur-sm">
                    <div className="flex-1 relative">
                        <button
                            onClick={() => setShow3D(false)}
                            className="absolute top-6 left-6 z-50 bg-slate-900 text-white p-2 rounded-full border border-slate-700 hover:bg-slate-800 transition-colors"
                        >
                            <X size={24} />
                        </button>
                        <Elevator3DScene liftA={liftA} liftB={liftB} />
                    </div>
                    <div className="w-80 border-l border-slate-700 h-full overflow-y-auto">
                        <MachineStats lift={liftA} />
                        <div className="border-t border-slate-700" />
                        <MachineStats lift={liftB} />
                    </div>
                </div>
            )}

            {/* Background Effects */}
            {mode === 'FIRE_ALARM' && fireFloor === null && (
                <div className="absolute inset-0 z-0 bg-red-900/20 animate-pulse pointer-events-none flex items-center justify-center">
                    <Flame className="w-96 h-96 text-red-600/20 blur-xl" />
                </div>
            )}
            {mode === 'POWER_OUTAGE' && (
                <div className="absolute inset-0 z-0 bg-black/80 pointer-events-none flex items-center justify-center">
                    <ZapOff className="w-96 h-96 text-yellow-600/20 blur-xl" />
                </div>
            )}
            {mode === 'FLOOD' && (
                <div className="absolute inset-x-0 bottom-0 h-1/3 z-10 bg-blue-500/30 animate-pulse pointer-events-none flex items-end justify-center overflow-hidden">
                    <div className="w-full h-full absolute bottom-0 bg-blue-600/20 animate-[wave_3s_linear_infinite]" />
                    <Waves className="w-full h-32 text-blue-400/20 mb-4" />
                </div>
            )}
            {mode === 'CABLE_SNAP' && (
                <div className="absolute inset-0 z-0 bg-rose-950/20 animate-pulse pointer-events-none border-4 border-rose-600/50" />
            )}

            <div className="flex justify-center gap-12 relative z-10">

                {/* Floor Labels & Waiting Area */}
                <div className="flex flex-col-reverse justify-between h-[480px] py-[70px] absolute left-6 z-0 w-full pointer-events-none">
                    {[1, 2, 3].map(f => (
                        <div key={`line-${f}`} className="border-t border-slate-800/50 w-full absolute left-0 right-0" style={{ bottom: 70 + (f - 1) * FLOOR_PIXELS }}>
                            {/* Specific Floor Fire Effect */}
                            {mode === 'FIRE_ALARM' && fireFloor === f && (
                                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-red-600/40 to-transparent flex items-end justify-center animate-pulse">
                                    <Flame className="text-red-500 w-16 h-16 animate-bounce" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex flex-col-reverse justify-between h-[480px] py-[70px] mr-auto relative z-10 w-48">
                    {FLOORS.map(f => {
                        const isTargetA = liftA.targetFloor === f;
                        const isTargetB = liftB.targetFloor === f;
                        const waitingCount = building.floors[f].waitingPassengers.length;
                        const isFire = mode === 'FIRE_ALARM' && fireFloor === f;

                        return (
                            <div key={`L-${f}`} className="h-[20px] flex items-center gap-4 group">
                                <div className="text-right w-full pr-4 border-r border-slate-700 relative">
                                    {(isTargetA || isTargetB) && !isFire && (
                                        <div className="absolute -right-[5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-blue-500 rotate-45 animate-ping" />
                                    )}

                                    <div className={`text-3xl font-bold transition-colors duration-300 ${isFire ? 'text-red-500 animate-pulse' : waitingCount > 0 ? 'text-white' : 'text-slate-600'}`}>
                                        {isFire ? 'FIRE!' : `L${f}`}
                                    </div>

                                    <div className="flex flex-wrap justify-end gap-1 mt-1 min-h-[24px]">
                                        {building.floors[f].waitingPassengers.map(p => (
                                            <PassengerIcon key={p.id} p={p} insideLift={false} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <LiftShaft lift={liftA} name="LIFT A" mode={mode} isDebug={isDebug} />
                <div className="w-12 bg-slate-900 border-x border-slate-800 h-[480px] opacity-50" />
                <LiftShaft lift={liftB} name="LIFT B" mode={mode} isDebug={isDebug} />

            </div>

            <div className="mt-6 flex justify-between items-center text-xs font-mono border-t border-slate-800 pt-4 relative z-20 bg-slate-950">
                <div className="flex gap-4">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full" /> Normal</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 bg-yellow-500 rounded-full" /> High Load</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full" /> Critical</div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShow3D(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded shadow-lg shadow-indigo-900/30 transition-all font-bold"
                    >
                        <Box size={14} /> Lihat Mesin 3D
                    </button>
                    {isDebug && <span className="text-green-500 font-bold flex items-center gap-1"><Bug size={12} /> DEBUG MODE ACTIVE</span>}
                    <div>Active Scenario: <span className={`font-bold uppercase ${mode === 'NORMAL' ? 'text-green-400' : 'text-red-400'}`}>{mode.replace('_', ' ')}</span></div>
                </div>
            </div>

            <style>{`
        @keyframes shake {
            0% { transform: translate(1px, 1px) rotate(0deg); }
            10% { transform: translate(-1px, -2px) rotate(-1deg); }
            20% { transform: translate(-3px, 0px) rotate(1deg); }
            30% { transform: translate(3px, 2px) rotate(0deg); }
            40% { transform: translate(1px, -1px) rotate(1deg); }
            50% { transform: translate(-1px, 2px) rotate(-1deg); }
            60% { transform: translate(-3px, 1px) rotate(0deg); }
            70% { transform: translate(3px, 1px) rotate(-1deg); }
            80% { transform: translate(-1px, -1px) rotate(1deg); }
            90% { transform: translate(1px, 2px) rotate(0deg); }
            100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        @keyframes wave {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }
      `}</style>
        </div>
    );
};
