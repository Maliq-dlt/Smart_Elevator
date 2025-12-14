
import React from 'react';
import { LiftState } from '../types/index';
import { Activity, Zap, Thermometer, Anchor, Settings } from 'lucide-react';

interface Props {
  lift: LiftState;
}

const StatRow = ({ label, value, unit, icon: Icon, color = "text-slate-200" }: any) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
    <div className="flex items-center gap-3 text-slate-400">
      <div className="p-1.5 bg-slate-800 rounded">
        <Icon size={14} />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    </div>
    <div className={`font-mono text-sm font-bold ${color}`}>
      {value} <span className="text-slate-500 text-xs ml-1">{unit}</span>
    </div>
  </div>
);

export const MachineStats: React.FC<Props> = ({ lift }) => {
  // Physics Derivations for Visualization
  const velocity = Math.abs(lift.sensors.velocity);
  const sheaveRadius = 0.4; // meters
  const rpm = (velocity / (2 * Math.PI * sheaveRadius)) * 60;
  
  // Power estimation P = F * v
  const force = lift.sensors.cableTension; // Newtons
  const powerKw = (force * velocity) / 1000;
  
  const motorTemp = lift.sensors.temperature;
  const health = lift.components.find(c => c.name === 'Motor Unit')?.health || 100;

  return (
    <div className="w-80 bg-slate-900/90 backdrop-blur-md border-l border-slate-700 p-6 flex flex-col h-full shadow-2xl">
      <div className="mb-6 pb-4 border-b border-slate-700">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Settings className="text-blue-500 animate-[spin_10s_linear_infinite]" />
          Motor Room Telemetry
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-1">LIFT {lift.id} TRACTION MACHINE</p>
      </div>

      <div className="space-y-1 flex-1">
        <StatRow 
          label="Sheave Speed" 
          value={rpm.toFixed(0)} 
          unit="RPM" 
          icon={Activity} 
          color={rpm > 100 ? "text-yellow-400" : "text-emerald-400"}
        />
        <StatRow 
          label="Power Output" 
          value={powerKw.toFixed(2)} 
          unit="kW" 
          icon={Zap} 
          color="text-blue-400"
        />
        <StatRow 
          label="Cable Tension" 
          value={(lift.sensors.cableTension / 1000).toFixed(2)} 
          unit="kN" 
          icon={Anchor} 
          color={lift.sensors.cableTension > 15000 ? "text-red-400" : "text-slate-200"}
        />
        <StatRow 
          label="Motor Temp" 
          value={motorTemp.toFixed(1)} 
          unit="°C" 
          icon={Thermometer} 
          color={motorTemp > 60 ? "text-red-500" : "text-slate-200"}
        />
      </div>

      <div className="mt-auto pt-6 border-t border-slate-700">
        <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-400 font-bold">MOTOR HEALTH</span>
            <span className={`text-xs font-bold ${health < 50 ? 'text-red-500' : 'text-green-500'}`}>{health.toFixed(1)}%</span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
             <div 
                className={`h-full transition-all duration-500 ${health < 50 ? 'bg-red-600' : 'bg-green-500'}`} 
                style={{ width: `${health}%` }} 
             />
        </div>
      </div>
    </div>
  );
};
