import React, { useState, useEffect, useRef } from 'react';
import { BuildingVisualizer } from './components/BuildingVisualizer';
import { Dashboard } from './components/Dashboard';
import { 
  LiftState, Passenger, BuildingState, SystemMode, LogEntry, SimulationStats, MachineComponent 
} from './types';
import { 
  FLOORS, LIFT_CAPACITY_KG, LIFT_CAPACITY_PEOPLE, 
  MOCK_NAMES, TICK_RATE, GRAVITY, LIFT_EMPTY_MASS, FLOOR_HEIGHT_METERS, LIFT_MAX_SPEED_MPS, INITIAL_COMPONENTS
} from './constants';
import { Play, Pause, AlertTriangle, UserPlus, FileText, Activity, Settings, ChevronRight, RotateCcw, BarChart3, Zap } from 'lucide-react';
import { generateSystemNarrative, generateScenarioAnalysis } from './services/geminiService';

// --- Types for Setup ---
type SetupStep = 'LIFTS' | 'PASSENGERS' | 'REVIEW' | 'RUNNING';

interface PassengerConfig {
  id: string;
  name: string;
  weight: number;
  startFloor: number;
  destinationFloor: number;
  requestTime: number;
}

const initialLiftState = (id: 'A' | 'B', startFloor: number): LiftState => ({
  id,
  currentFloor: startFloor,
  targetFloor: null,
  status: 'IDLE',
  direction: 'IDLE',
  passengers: [],
  doorOpenProgress: 0,
  totalWeight: 0,
  energyConsumed: 0,
  components: JSON.parse(JSON.stringify(INITIAL_COMPONENTS)), // Deep copy
  totalDistanceTraveled: 0
});

export default function App() {
  // --- Setup State ---
  const [step, setStep] = useState<SetupStep>('LIFTS');
  const [configLiftA, setConfigLiftA] = useState(1);
  const [configLiftB, setConfigLiftB] = useState(1);
  const [passengerCount, setPassengerCount] = useState(3);
  const [passengerConfigs, setPassengerConfigs] = useState<PassengerConfig[]>([]);

  // --- Simulation State ---
  const [simTime, setSimTime] = useState(0); 
  const [pendingPassengers, setPendingPassengers] = useState<PassengerConfig[]>([]);

  const [liftA, setLiftA] = useState<LiftState>(initialLiftState('A', 1));
  const [liftB, setLiftB] = useState<LiftState>(initialLiftState('B', 1));
  const [building, setBuilding] = useState<BuildingState>({
    floors: { 1: { waitingPassengers: [] }, 2: { waitingPassengers: [] }, 3: { waitingPassengers: [] } }
  });
  
  const [stats, setStats] = useState<SimulationStats>({
      totalPassengersDelivered: 0,
      totalWaitTime: 0,
      avgWaitTime: 0,
      totalEnergyJ: 0,
      floorVisits: { 1: 0, 2: 0, 3: 0 },
      peakPassengers: 0,
      minPassengers: 0,
      energyHistory: Array(20).fill(0)
  });

  const [systemMode, setSystemMode] = useState<SystemMode>('NORMAL');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  // Real-time manual input
  const [manualInputWeight, setManualInputWeight] = useState(70);
  const [manualInputStart, setManualInputStart] = useState(1);
  const [manualInputDest, setManualInputDest] = useState(3);

  const eventBuffer = useRef<string[]>([]);
  const [narrative, setNarrative] = useState<string>("Sistem diinisialisasi. Menunggu skenario dimulai.");
  const [analysisReport, setAnalysisReport] = useState<string | null>(null);

  // --- Initialization Logic ---
  useEffect(() => {
    if (step === 'PASSENGERS') {
      const newConfigs = Array.from({ length: passengerCount }).map((_, i) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: MOCK_NAMES[i % MOCK_NAMES.length] || `Penumpang${i+1}`,
        weight: 70,
        startFloor: (i % 3) + 1,
        destinationFloor: ((i + 1) % 3) + 1,
        requestTime: 0
      }));
      setPassengerConfigs(newConfigs);
    }
  }, [passengerCount, step]);

  const startSimulation = () => {
    setLiftA(initialLiftState('A', configLiftA));
    setLiftB(initialLiftState('B', configLiftB));
    setBuilding({
      floors: { 1: { waitingPassengers: [] }, 2: { waitingPassengers: [] }, 3: { waitingPassengers: [] } }
    });
    setPendingPassengers([...passengerConfigs]);
    setStats({ 
        totalPassengersDelivered: 0, 
        totalWaitTime: 0, 
        avgWaitTime: 0, 
        totalEnergyJ: 0,
        floorVisits: { 1: 0, 2: 0, 3: 0 },
        peakPassengers: 0,
        minPassengers: 0,
        energyHistory: Array(20).fill(0)
    });
    setLogs([]);
    setSimTime(0);
    setIsRunning(true);
    setStep('RUNNING');
    addLog(`SIMULASI DIMULAI. Konfigurasi SCAN Algorithm aktif.`);
  };

  const resetSimulation = () => {
    setIsRunning(false);
    setStep('LIFTS');
    setNarrative("Sistem Direset.");
  };

  const addLog = (message: string, type: LogEntry['type'] = 'INFO') => {
    const entry: LogEntry = {
      id: Math.random().toString(),
      timestamp: new Date(),
      type,
      message
    };
    setLogs(prev => [entry, ...prev].slice(0, 50));
    eventBuffer.current.push(`[${new Date().toLocaleTimeString()}] ${message}`);
  };

  // --- Core Simulation Loop ---
  useEffect(() => {
    if (!isRunning || step !== 'RUNNING') return;

    const interval = setInterval(() => {
      setSimTime(prev => prev + (TICK_RATE / 1000));
      updateSystem();
    }, TICK_RATE);

    return () => clearInterval(interval);
  }, [isRunning, step, systemMode, liftA, liftB, building, pendingPassengers, simTime]);

  // --- Narrative Loop ---
  useEffect(() => {
    if (step !== 'RUNNING') return;
    const narrativeInterval = setInterval(async () => {
      if (eventBuffer.current.length > 0) {
        const eventsSnapshot = [...eventBuffer.current];
        eventBuffer.current = []; 
        const text = await generateSystemNarrative(eventsSnapshot, liftA, liftB, systemMode);
        if (text) setNarrative(text);
      }
    }, 8000); 

    return () => clearInterval(narrativeInterval);
  }, [liftA, liftB, systemMode, step]);

  // --- Main Logic Orchestrator ---
  const updateSystem = () => {
    const currentSimTime = simTime;
    
    // 0. Clone State
    const nextBuilding = {
        floors: Object.fromEntries(Object.keys(building.floors).map(k => {
            const key = Number(k);
            return [key, { waitingPassengers: [...building.floors[key].waitingPassengers] }];
        }))
    };
    let nextStats = { ...stats };
    
    // Update Energy History Graph (Sample every 1 second roughly)
    if (Math.floor(simTime * 10) % 20 === 0) {
        // Calculate instantaneous energy usage from both lifts (approximated for visual)
        // If moving, usage is high. If idle, low.
        let instantaneousJ = 0;
        if (liftA.status === 'MOVING') instantaneousJ += 3000;
        if (liftB.status === 'MOVING') instantaneousJ += 3000;
        if (liftA.status !== 'IDLE') instantaneousJ += 500;
        if (liftB.status !== 'IDLE') instantaneousJ += 500;
        
        nextStats.energyHistory = [...nextStats.energyHistory.slice(1), instantaneousJ];
    }
    
    // 1. Spawn Passengers
    const toSpawn = pendingPassengers.filter(p => p.requestTime <= currentSimTime);
    if (toSpawn.length > 0) {
        setPendingPassengers(prev => prev.filter(p => p.requestTime > currentSimTime));
        toSpawn.forEach(p => {
            nextBuilding.floors[p.startFloor].waitingPassengers.push(p);
            addLog(`Permintaan Baru: ${p.name} di Lantai ${p.startFloor} -> ${p.destinationFloor} (Menunggu...)`);
        });
    }

    // 2. Emergency Check
    if (systemMode === 'FIRE_ALARM') {
       setLiftA(l => handleEmergencyMove(l, 1));
       setLiftB(l => handleEmergencyMove(l, 1));
       setBuilding(nextBuilding); 
       return;
    }
    if (systemMode === 'POWER_OUTAGE') {
        return;
    }

    // 3. Process Lift A
    const resultA = processLiftTick(liftA, liftB, nextBuilding, nextStats);
    const nextLiftA = resultA.lift;
    
    // 4. Process Lift B
    const resultB = processLiftTick(liftB, nextLiftA, resultA.building, resultA.stats);
    const nextLiftB = resultB.lift;

    // 5. Commit Updates
    setLiftA(nextLiftA);
    setLiftB(nextLiftB);
    setBuilding(resultB.building);
    setStats(resultB.stats);
  };

  const updateComponentHealth = (lift: LiftState) => {
      // Simulate wear and tear
      const comps = [...lift.components];
      
      // Motor wear when moving
      if (lift.status === 'MOVING') {
          comps[0].health -= 0.02; // Motor
          comps[0].cycles += 1;
          comps[4].health -= 0.01; // Cables
          comps[4].cycles += 1;
      }
      
      // Door wear
      if (lift.status === 'DOOR_OPENING' || lift.status === 'DOOR_CLOSING') {
          comps[1].health -= 0.05; // Door
          comps[1].cycles += 1;
      }

      // Brake wear on stop
      if (lift.status === 'IDLE' && lift.totalWeight > 0) {
          comps[2].health -= 0.001;
      }

      // Check Status
      comps.forEach(c => {
          if (c.health < 30) c.status = 'CRITICAL';
          else if (c.health < 70) c.status = 'WARNING';
          else c.status = 'OK';
          
          if (c.health <= 0) c.health = 0;
      });

      return comps;
  };

  // --- Pure Logic Processor ---
  const processLiftTick = (
      lift: LiftState, 
      otherLift: LiftState,
      buildingState: BuildingState, 
      currentStats: SimulationStats
  ) => {
      const nextLift = { ...lift };
      const nextBuilding = buildingState; 
      let nextStats = { ...currentStats };

      // Update components
      nextLift.components = updateComponentHealth(nextLift);
      if (nextLift.components.some(c => c.status === 'CRITICAL' && c.health < 10)) {
          // Failure simulation logic could go here (e.g., force halt)
          if (Math.random() > 0.99) addLog(`PERINGATAN KRITIS: Komponen pada Lift ${nextLift.id} perlu perbaikan segera!`, 'ERROR');
      }

      // A. Overload Check
      if (nextLift.status === 'OVERLOAD') {
          if (nextLift.passengers.length > 0) {
              const removed = nextLift.passengers[nextLift.passengers.length - 1];
              nextLift.passengers = nextLift.passengers.slice(0, -1);
              nextLift.totalWeight -= removed.weight;
              addLog(`KELEBIHAN MUATAN: ${removed.name} harus turun dari Lift ${nextLift.id}.`, 'WARNING');
          }
          if (nextLift.totalWeight <= LIFT_CAPACITY_KG) {
              nextLift.status = 'DOOR_OPEN';
              addLog(`Lift ${nextLift.id} muatan aman. Melanjutkan operasi.`, 'INFO');
          }
          return { lift: nextLift, building: nextBuilding, stats: nextStats };
      }

      // B. Door Operations
      if (nextLift.status === 'DOOR_OPEN') {
          nextLift.status = 'DOOR_CLOSING';
          return { lift: nextLift, building: nextBuilding, stats: nextStats };
      }
      if (nextLift.status === 'DOOR_OPENING') {
          nextLift.doorOpenProgress += 0.05;
          if (nextLift.doorOpenProgress >= 1) {
              nextLift.doorOpenProgress = 1;
              nextLift.status = 'DOOR_OPEN';
              
              // --- BOARDING LOGIC ---
              const currentFloor = Math.round(nextLift.currentFloor);
              
              // Track floor visits
              if (!nextStats.floorVisits[currentFloor]) nextStats.floorVisits[currentFloor] = 0;
              nextStats.floorVisits[currentFloor]++;

              const liftPassengers = [...nextLift.passengers];

              // 1. Offload
              const leaving = liftPassengers.filter(p => p.destinationFloor === currentFloor);
              const staying = liftPassengers.filter(p => p.destinationFloor !== currentFloor);
              
              if (leaving.length > 0) {
                  addLog(`${leaving.length} orang turun dari Lift ${nextLift.id}.`);
                  nextStats.totalPassengersDelivered += leaving.length;
              }

              // 2. Board
              const waiting = nextBuilding.floors[currentFloor].waitingPassengers;
              const liftDir = nextLift.direction;
              
              const boarding = [];
              const leftBehind = [];
              
              for (const p of waiting) {
                  const pDir = p.destinationFloor > p.startFloor ? 'UP' : 'DOWN';
                  const canBoard = (liftDir === 'IDLE') || (liftDir === pDir) || (staying.length === 0);
                  
                  if (canBoard) {
                      boarding.push(p);
                  } else {
                      leftBehind.push(p);
                  }
              }

              if (boarding.length > 0) {
                  const now = simTime;
                  let totalWait = 0;
                  boarding.forEach(p => totalWait += (now - p.requestTime));
                  
                  nextStats.totalWaitTime += totalWait;
                  nextStats.avgWaitTime = (nextStats.totalWaitTime) / (nextStats.totalPassengersDelivered + boarding.length + 1 || 1);
                  
                  // Update Peak/Min stats (Weekly/Daily simulated by session)
                  const currentLoad = staying.length + boarding.length;
                  if (currentLoad > nextStats.peakPassengers) nextStats.peakPassengers = currentLoad;
                  if (nextStats.minPassengers === 0 || currentLoad < nextStats.minPassengers) nextStats.minPassengers = currentLoad;

                  nextBuilding.floors[currentFloor].waitingPassengers = leftBehind;
                  addLog(`${boarding.length} orang masuk ke Lift ${nextLift.id}.`);
              }

              const newPassengers = [...staying, ...boarding];
              const totalWeight = newPassengers.reduce((sum, p) => sum + p.weight, 0);

              if (totalWeight > LIFT_CAPACITY_KG) {
                  addLog(`PERINGATAN: Lift ${nextLift.id} Overload (${totalWeight}kg)!`, 'ERROR');
                  nextLift.status = 'OVERLOAD';
              }
              
              if (boarding.length > 0 && nextLift.direction === 'IDLE') {
                  const p = boarding[0];
                  nextLift.direction = p.destinationFloor > p.startFloor ? 'UP' : 'DOWN';
              }

              nextLift.passengers = newPassengers;
              nextLift.totalWeight = totalWeight;
          }
          return { lift: nextLift, building: nextBuilding, stats: nextStats };
      }
      if (nextLift.status === 'DOOR_CLOSING') {
          nextLift.doorOpenProgress -= 0.05;
          if (nextLift.doorOpenProgress <= 0) {
              nextLift.doorOpenProgress = 0;
              nextLift.status = 'IDLE';
          }
          return { lift: nextLift, building: nextBuilding, stats: nextStats };
      }

      // C. Physics Movement
      if (nextLift.status === 'MOVING') {
          if (nextLift.targetFloor !== null) {
              const distanceToTarget = Math.abs(nextLift.targetFloor - nextLift.currentFloor);
              const direction = Math.sign(nextLift.targetFloor - nextLift.currentFloor);
              
              let currentSpeedMPS = LIFT_MAX_SPEED_MPS;
              if (distanceToTarget < 0.8) {
                  currentSpeedMPS = Math.max(0.3, LIFT_MAX_SPEED_MPS * distanceToTarget);
              }

              const step = (currentSpeedMPS * (TICK_RATE/1000)) / FLOOR_HEIGHT_METERS;
              
              if (direction > 0) {
                  const massTotal = LIFT_EMPTY_MASS + nextLift.totalWeight;
                  const heightDelta = step * FLOOR_HEIGHT_METERS;
                  nextLift.energyConsumed += massTotal * GRAVITY * heightDelta;
                  nextStats.totalEnergyJ += massTotal * GRAVITY * heightDelta;
              }

              if (distanceToTarget < step) {
                  nextLift.currentFloor = nextLift.targetFloor;
                  nextLift.status = 'DOOR_OPENING';
                  addLog(`Lift ${nextLift.id} tiba di Lantai ${nextLift.targetFloor}.`);
              } else {
                  nextLift.currentFloor += direction * step;
                  nextLift.direction = direction > 0 ? 'UP' : 'DOWN';
                  nextLift.totalDistanceTraveled += step * FLOOR_HEIGHT_METERS;
              }
          }
          return { lift: nextLift, building: nextBuilding, stats: nextStats };
      }

      // D. SCAN Logic Decision
      if (nextLift.status === 'IDLE') {
          const otherLiftBusy = otherLift.status !== 'IDLE';
          const otherLiftTarget = otherLift.targetFloor;

          const floorCalls = Object.keys(nextBuilding.floors).map(Number).filter(f => {
              const hasPax = nextBuilding.floors[f].waitingPassengers.length > 0;
              if (!hasPax) return false;
              if (otherLiftBusy && otherLiftTarget === f) {
                  return false;
              }
              return true;
          });

          const cabinDestinations = nextLift.passengers.map(p => p.destinationFloor);
          const allTargets = new Set([...floorCalls, ...cabinDestinations]);
          
          if (allTargets.size === 0) {
              nextLift.direction = 'IDLE';
              return { lift: nextLift, building: nextBuilding, stats: nextStats };
          }

          let bestTarget: number | null = null;
          
          // Standard SCAN Logic
          if (nextLift.direction === 'UP') {
              const targetsAbove = Array.from(allTargets).filter(f => f > nextLift.currentFloor).sort((a,b) => a-b);
              if (targetsAbove.length > 0) bestTarget = targetsAbove[0];
              else {
                   const targetsBelow = Array.from(allTargets).filter(f => f < nextLift.currentFloor).sort((a,b) => b-a);
                   if (targetsBelow.length > 0) {
                       nextLift.direction = 'DOWN';
                       bestTarget = targetsBelow[0];
                   }
              }
          } 
          else if (nextLift.direction === 'DOWN') {
              const targetsBelow = Array.from(allTargets).filter(f => f < nextLift.currentFloor).sort((a,b) => b-a);
              if (targetsBelow.length > 0) bestTarget = targetsBelow[0];
              else {
                  const targetsAbove = Array.from(allTargets).filter(f => f > nextLift.currentFloor).sort((a,b) => a-b);
                  if (targetsAbove.length > 0) {
                      nextLift.direction = 'UP';
                      bestTarget = targetsAbove[0];
                  }
              }
          }
          else {
              const closest = Array.from(allTargets).reduce((prev, curr) => 
                  Math.abs(curr - nextLift.currentFloor) < Math.abs(prev - nextLift.currentFloor) ? curr : prev
              );
              bestTarget = closest;
              nextLift.direction = closest > nextLift.currentFloor ? 'UP' : 'DOWN';
          }

          if (bestTarget !== null) {
              if (Math.abs(bestTarget - nextLift.currentFloor) < 0.1) {
                  nextLift.status = 'DOOR_OPENING';
              } else {
                  nextLift.targetFloor = bestTarget;
                  nextLift.status = 'MOVING';
              }
          }
      }

      return { lift: nextLift, building: nextBuilding, stats: nextStats };
  };

  const handleEmergencyMove = (lift: LiftState, safeFloor: number): LiftState => {
      if (lift.currentFloor === safeFloor && lift.doorOpenProgress === 1) return lift; 
      let next: LiftState = { ...lift, status: 'MOVING', targetFloor: safeFloor };
      const diff = safeFloor - lift.currentFloor;
      const step = 0.1; 
      if (Math.abs(diff) < step) {
          next.currentFloor = safeFloor;
          next.status = 'DOOR_OPENING';
      } else {
          next.currentFloor += Math.sign(diff) * step;
      }
      return next;
  };

  const handleAddManualPassenger = () => {
    if (manualInputStart === manualInputDest) return;
    const p: Passenger = {
        id: Math.random().toString(),
        name: `ManualUser`,
        weight: manualInputWeight,
        startFloor: manualInputStart,
        destinationFloor: manualInputDest,
        requestTime: simTime 
    };
    setBuilding(prev => ({
        ...prev,
        floors: {
            ...prev.floors,
            [manualInputStart]: { waitingPassengers: [...prev.floors[manualInputStart].waitingPassengers, p] }
        }
    }));
    addLog(`Manual: 1 Orang di L${manualInputStart} -> L${manualInputDest}`);
  };

  const generateReport = async () => {
      const history = logs.map(l => `[${l.timestamp.toLocaleTimeString()}] ${l.message}`);
      setAnalysisReport("Sedang menganalisis performa sistem...");
      const report = await generateScenarioAnalysis(history);
      setAnalysisReport(report);
  };

  // --- RENDER ---
  const renderSetupWizard = () => {
    return (
      <div className="max-w-3xl mx-auto mt-10 p-6 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl font-mono">
        <h2 className="text-2xl font-bold text-center text-blue-400 mb-8 tracking-widest uppercase">
          Konfigurasi Sistem
        </h2>

        {step === 'LIFTS' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-slate-800 p-6 rounded border border-slate-600">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Settings size={18}/> Posisi Awal Lift</h3>
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <label className="block text-slate-400 mb-2">Mulai Lift A</label>
                        <select value={configLiftA} onChange={e => setConfigLiftA(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-lg">
                            {FLOORS.map(f => <option key={f} value={f}>Lantai {f}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-slate-400 mb-2">Mulai Lift B</label>
                        <select value={configLiftB} onChange={e => setConfigLiftB(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-lg">
                            {FLOORS.map(f => <option key={f} value={f}>Lantai {f}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-slate-800 p-6 rounded border border-slate-600">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><UserPlus size={18}/> Jumlah Penumpang</h3>
                <label className="block text-slate-400 mb-2">Berapa banyak penumpang dalam simulasi?</label>
                <input 
                    type="number" 
                    min="1" 
                    max="20" 
                    value={passengerCount} 
                    onChange={e => setPassengerCount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-lg"
                />
            </div>

            <button onClick={() => setStep('PASSENGERS')} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded text-lg font-bold flex items-center justify-center gap-2">
                Lanjut: Atur Penumpang <ChevronRight />
            </button>
          </div>
        )}

        {step === 'PASSENGERS' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                 <h3 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-2">Detail Penumpang ({passengerCount})</h3>
                 <div className="max-h-[500px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {passengerConfigs.map((p, idx) => (
                        <div key={idx} className="bg-slate-800 p-4 rounded border border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-blue-400 font-bold">Penumpang {idx + 1}</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <div className="md:col-span-1">
                                    <label className="text-[10px] uppercase text-slate-500 block">Nama</label>
                                    <input type="text" value={p.name} onChange={e => {
                                        const newC = [...passengerConfigs]; newC[idx].name = e.target.value; setPassengerConfigs(newC);
                                    }} className="w-full bg-slate-900 p-1 border border-slate-600 rounded text-sm"/>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-slate-500 block">Berat (kg)</label>
                                    <input type="number" value={p.weight} onChange={e => {
                                        const newC = [...passengerConfigs]; newC[idx].weight = Number(e.target.value); setPassengerConfigs(newC);
                                    }} className="w-full bg-slate-900 p-1 border border-slate-600 rounded text-sm"/>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-slate-500 block">Asal</label>
                                    <select value={p.startFloor} onChange={e => {
                                        const newC = [...passengerConfigs]; newC[idx].startFloor = Number(e.target.value); setPassengerConfigs(newC);
                                    }} className="w-full bg-slate-900 p-1 border border-slate-600 rounded text-sm">
                                        {FLOORS.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-slate-500 block">Tujuan</label>
                                    <select value={p.destinationFloor} onChange={e => {
                                        const newC = [...passengerConfigs]; newC[idx].destinationFloor = Number(e.target.value); setPassengerConfigs(newC);
                                    }} className="w-full bg-slate-900 p-1 border border-slate-600 rounded text-sm">
                                        {FLOORS.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-slate-500 block">Waktu (detik)</label>
                                    <input type="number" min="0" value={p.requestTime} onChange={e => {
                                        const newC = [...passengerConfigs]; newC[idx].requestTime = Number(e.target.value); setPassengerConfigs(newC);
                                    }} className="w-full bg-slate-900 p-1 border border-slate-600 rounded text-sm"/>
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setStep('LIFTS')} className="px-6 py-3 border border-slate-600 rounded hover:bg-slate-800">Kembali</button>
                    <button onClick={() => setStep('REVIEW')} className="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded font-bold">Review Skenario</button>
                 </div>
            </div>
        )}

        {step === 'REVIEW' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 font-mono text-sm">
                <div className="border border-slate-600 p-6 rounded bg-black/50 space-y-6">
                    <div className="text-center text-yellow-400 mb-6">
                        ╔══════════════════════════════════════════════════════╗<br/>
                        ║                 RINGKASAN SKENARIO                   ║<br/>
                        ╚══════════════════════════════════════════════════════╝
                    </div>
                    {/* Simplified review UI for brevity in this update */}
                    <div className="flex gap-4 mt-8">
                        <button onClick={startSimulation} className="w-full bg-green-600 hover:bg-green-500 py-3 rounded font-bold text-lg animate-pulse">
                            MULAI SIMULASI
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  };

  if (step !== 'RUNNING') {
      return (
          <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
              <header className="text-center mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Smart Elevator Simulator
                </h1>
                <p className="text-slate-500">Konfigurasi Sistem</p>
              </header>
              {renderSetupWizard()}
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Smart Elevator System
            </h1>
            <p className="text-slate-400 text-sm mt-1">
                Finite State Automata Simulation • <span className="text-yellow-400 font-mono">Waktu: {simTime.toFixed(1)}s</span>
            </p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={resetSimulation}
                className="flex items-center gap-2 px-4 py-2 rounded font-bold bg-slate-700 hover:bg-slate-600 border border-slate-500"
            >
                <RotateCcw size={18} /> Reset
            </button>
            <button 
                onClick={() => setIsRunning(!isRunning)}
                className={`flex items-center gap-2 px-4 py-2 rounded font-bold ${isRunning ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-green-600 hover:bg-green-500'}`}
            >
                {isRunning ? <><Pause size={18} /> Jeda</> : <><Play size={18} /> Lanjut</>}
            </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: VISUALIZER & CONTROLS */}
        <div className="lg:col-span-7 space-y-6">
          
          <BuildingVisualizer liftA={liftA} liftB={liftB} building={building} mode={systemMode} />

          {/* New Industrial Dashboard (Replaces old metrics) */}
          <Dashboard liftA={liftA} liftB={liftB} stats={stats} />

          {/* Emergency Panel */}
           <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-400">
                <AlertTriangle size={20} /> Skenario Darurat
            </h2>
            <div className="flex gap-4">
                <button 
                    onClick={() => setSystemMode(systemMode === 'FIRE_ALARM' ? 'NORMAL' : 'FIRE_ALARM')}
                    className={`flex-1 py-3 px-4 rounded font-bold border-2 transition-all flex flex-col items-center gap-1
                        ${systemMode === 'FIRE_ALARM' 
                            ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' 
                            : 'bg-slate-800 border-slate-600 hover:border-red-500 hover:text-red-400'
                        }`}
                >
                    <Activity />
                    {systemMode === 'FIRE_ALARM' ? 'MATIKAN ALARM' : 'ALARM KEBAKARAN'}
                </button>
                <button 
                    onClick={() => setSystemMode(systemMode === 'POWER_OUTAGE' ? 'NORMAL' : 'POWER_OUTAGE')}
                    className={`flex-1 py-3 px-4 rounded font-bold border-2 transition-all flex flex-col items-center gap-1
                        ${systemMode === 'POWER_OUTAGE' 
                            ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' 
                            : 'bg-slate-800 border-slate-600 hover:border-yellow-500 hover:text-yellow-400'
                        }`}
                >
                    <AlertTriangle />
                    {systemMode === 'POWER_OUTAGE' ? 'NYALAKAN LISTRIK' : 'MATIKAN LISTRIK'}
                </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: NARRATIVE & LOGS */}
        <div className="lg:col-span-5 space-y-6 flex flex-col h-full">
            
            {/* AI Narrative Box */}
            <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-6 shadow-lg shadow-indigo-900/10">
                <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                    Analisis Engineering AI
                </h2>
                <div className="font-mono text-sm leading-relaxed text-slate-300 min-h-[100px]">
                    "{narrative}"
                </div>
            </div>

            {/* System Logs */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl flex-1 flex flex-col overflow-hidden max-h-[400px]">
                <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
                    <h2 className="font-semibold text-slate-300">Log Sistem Real-time</h2>
                    <span className="text-xs text-slate-500">{logs.length} events</span>
                </div>
                <div className="overflow-y-auto p-4 space-y-2 flex-1 font-mono text-xs">
                    {logs.map((log) => (
                        <div key={log.id} className={`flex gap-3 pb-2 border-b border-slate-800 last:border-0 ${
                            log.type === 'WARNING' ? 'text-yellow-400' : 
                            log.type === 'ERROR' ? 'text-red-400' : 
                            log.type === 'SYSTEM' ? 'text-indigo-400 italic' : 'text-slate-400'
                        }`}>
                            <span className="opacity-50 shrink-0">{log.timestamp.toLocaleTimeString()}</span>
                            <span>{log.message}</span>
                        </div>
                    ))}
                </div>
            </div>

             {/* Report Generator */}
             <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                <button 
                    onClick={generateReport}
                    className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 py-2 rounded transition-colors"
                >
                    <FileText size={16} /> Generate Analisis
                </button>
                {analysisReport && (
                    <div className="mt-4 p-4 bg-slate-950 rounded border border-slate-800 text-xs font-mono whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                        {analysisReport}
                    </div>
                )}
             </div>

        </div>

      </main>
    </div>
  );
}