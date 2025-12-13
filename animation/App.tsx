import React, { useState, useEffect, useRef } from 'react';
import { BuildingVisualizer } from './components/BuildingVisualizer';
import { Dashboard } from './components/Dashboard';
import { LandingPage } from './components/LandingPage';
import {
    LiftState, Passenger, BuildingState, SystemMode, LogEntry, SimulationStats, MachineComponent, Scenario
} from './types';
import {
    FLOORS, LIFT_CAPACITY_KG, LIFT_CAPACITY_PEOPLE,
    MOCK_NAMES, TICK_RATE, GRAVITY, LIFT_EMPTY_MASS, FLOOR_HEIGHT_METERS, LIFT_MAX_SPEED_MPS, INITIAL_COMPONENTS
} from './constants';
import { Play, Pause, AlertTriangle, UserPlus, FileText, Activity, Settings, ChevronRight, RotateCcw, BarChart3, Zap, Layers, Scale, ArrowUpRight, Home, Dice5, Power, Flame, Anchor, BrainCircuit } from 'lucide-react';
import { generateSystemNarrative, generateScenarioAnalysis, generateRandomScenario } from './services/geminiService';

// --- Types for Setup ---
type SetupStep = 'LANDING' | 'LIFTS' | 'PASSENGERS' | 'REVIEW' | 'RUNNING';

interface PassengerConfig {
    id: string;
    name: string;
    weight: number;
    startFloor: number;
    destinationFloor: number;
    requestTime: number;
}

interface NarrativeLog {
    id: string;
    text: string;
    timestamp: string;
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
    totalDistanceTraveled: 0,
    batteryLevel: 100 // Full backup charge
});

export default function App() {
    // --- Setup State ---
    const [step, setStep] = useState<SetupStep>('LANDING');
    const [configLiftA, setConfigLiftA] = useState(1);
    const [configLiftB, setConfigLiftB] = useState(1);
    const [passengerCount, setPassengerCount] = useState(3);
    const [passengerConfigs, setPassengerConfigs] = useState<PassengerConfig[]>([]);
    const [useAI, setUseAI] = useState(true); // Toggle for AI Scenarios

    // --- Simulation State ---
    const [simTime, setSimTime] = useState(0);
    const [pendingPassengers, setPendingPassengers] = useState<PassengerConfig[]>([]);
    const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);

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
        energyHistory: Array(25).fill(0)
    });

    const [systemMode, setSystemMode] = useState<SystemMode>('NORMAL');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [loadingScenario, setLoadingScenario] = useState(false);
    const [bootSequence, setBootSequence] = useState(100);

    // --- SPECIFIC EVENT CONFIGS ---
    const [fireFloor, setFireFloor] = useState<number | null>(null);
    const [snapTarget, setSnapTarget] = useState<'A' | 'B' | 'BOTH' | null>(null);
    const [powerScope, setPowerScope] = useState<'ALL' | 'A' | 'B' | null>(null);

    const eventBuffer = useRef<string[]>([]);
    const [narrativeHistory, setNarrativeHistory] = useState<NarrativeLog[]>([{
        id: 'init', text: "Sistem diinisialisasi...", timestamp: new Date().toLocaleTimeString()
    }]);
    const narrativeEndRef = useRef<HTMLDivElement>(null);

    const [analysisReport, setAnalysisReport] = useState<string | null>(null);

    // --- Initialization Logic ---
    useEffect(() => {
        if (step === 'PASSENGERS') {
            const newConfigs = Array.from({ length: passengerCount }).map((_, i) => ({
                id: Math.random().toString(36).substr(2, 9),
                name: MOCK_NAMES[i % MOCK_NAMES.length] || `Penumpang${i + 1}`,
                weight: 70,
                startFloor: (i % 3) + 1,
                destinationFloor: ((i + 1) % 3) + 1,
                requestTime: 0
            }));
            setPassengerConfigs(newConfigs);
        }
    }, [passengerCount, step]);

    // Scroll to bottom of narrative
    useEffect(() => {
        narrativeEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [narrativeHistory]);

    const generateRandomPassengerConfig = () => {
        const count = Math.floor(Math.random() * 6) + 3; // 3 to 8 passengers
        const configs: PassengerConfig[] = [];
        for (let i = 0; i < count; i++) {
            const start = Math.floor(Math.random() * 3) + 1;
            let dest = Math.floor(Math.random() * 3) + 1;
            while (dest === start) dest = Math.floor(Math.random() * 3) + 1;

            configs.push({
                id: Math.random().toString(36).substr(2, 9),
                name: MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)],
                weight: Math.floor(Math.random() * 40) + 50, // 50-90kg
                startFloor: start,
                destinationFloor: dest,
                requestTime: Math.floor(Math.random() * 10) // 0-10s delay
            });
        }
        return configs;
    };

    const handleQuickLaunch = () => {
        const randomConfigs = generateRandomPassengerConfig();
        setPassengerConfigs(randomConfigs);
        setPassengerCount(randomConfigs.length);
        startSimulationInternal(randomConfigs, useAI);
    };

    const startSimulation = async () => {
        await startSimulationInternal(passengerConfigs, useAI);
    };

    const startSimulationInternal = async (configs: PassengerConfig[], enableAI: boolean) => {
        setLoadingScenario(true);
        let scenario: Scenario;

        if (enableAI) {
            scenario = await generateRandomScenario();
        } else {
            // Manual / Normal Mode
            scenario = {
                title: "Operasi Manual / Normal",
                description: "Mode AI dinonaktifkan. Sistem berjalan pada parameter standar.",
                type: "NORMAL",
                severity: 1
            };
        }

        setActiveScenario(scenario);
        setSystemMode(scenario.type);
        setNarrativeHistory([{
            id: Date.now().toString(),
            text: `MEMUAT SKENARIO: ${scenario.title.toUpperCase()}... ${scenario.description}`,
            timestamp: new Date().toLocaleTimeString()
        }]);

        setLiftA(initialLiftState('A', configLiftA));
        setLiftB(initialLiftState('B', configLiftB));
        setBuilding({
            floors: { 1: { waitingPassengers: [] }, 2: { waitingPassengers: [] }, 3: { waitingPassengers: [] } }
        });
        setPendingPassengers([...configs]);
        setStats({
            totalPassengersDelivered: 0, totalWaitTime: 0, avgWaitTime: 0, totalEnergyJ: 0,
            floorVisits: { 1: 0, 2: 0, 3: 0 }, peakPassengers: 0, minPassengers: 0,
            energyHistory: Array(25).fill(0)
        });
        setLogs([]);
        setSimTime(0);
        setBootSequence(100);
        setFireFloor(null);
        setSnapTarget(null);
        setPowerScope(null);

        addLog(`SCENARIO ACTIVATED: ${scenario.title}`, 'SYSTEM');
        setIsRunning(true);
        setStep('RUNNING');
        setLoadingScenario(false);
    };

    const resetSimulation = () => {
        setIsRunning(false);
        setStep('LIFTS');
        setNarrativeHistory([]);
        setSystemMode('NORMAL');
        setActiveScenario(null);
        setFireFloor(null);
        setSnapTarget(null);
        setPowerScope(null);
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

    // --- Manual Override Handlers ---
    const triggerFire = (floor: number) => {
        if (fireFloor === floor) {
            setFireFloor(null);
            if (systemMode === 'FIRE_ALARM') setSystemMode('NORMAL');
            addLog(`Fire Alarm at Floor ${floor} CANCELLED.`, 'SYSTEM');
        } else {
            setFireFloor(floor);
            setSystemMode('FIRE_ALARM');
            addLog(`MANUAL ALARM: FIRE DETECTED AT FLOOR ${floor}!`, 'ERROR');
        }
    };

    const triggerCableSnap = (target: 'A' | 'B') => {
        let newTarget: 'A' | 'B' | 'BOTH' | null = target;
        if (snapTarget === target) newTarget = null;
        else if (snapTarget && snapTarget !== target) newTarget = 'BOTH';

        setSnapTarget(newTarget);
        if (newTarget) {
            setSystemMode('CABLE_SNAP');
            addLog(`CRITICAL: CABLE SNAP EVENT ON LIFT ${target}!`, 'ERROR');
        } else {
            setSystemMode('NORMAL');
            addLog(`Repair crew dispatched. Cables fixed.`, 'SYSTEM');
        }
    };

    const triggerPowerOutage = (scope: 'ALL' | 'A' | 'B') => {
        if (powerScope === scope) {
            setPowerScope(null);
            setSystemMode('NORMAL');
            setBootSequence(0);
            addLog(`Power Restored to ${scope}. Boot sequence initiated.`, 'SYSTEM');
        } else {
            setPowerScope(scope);
            setSystemMode('POWER_OUTAGE');
            addLog(`POWER OUTAGE INITIATED: SCOPE ${scope}`, 'WARNING');
        }
    };

    // --- Core Simulation Loop ---
    useEffect(() => {
        if (!isRunning || step !== 'RUNNING') return;
        const interval = setInterval(() => {
            setSimTime(prev => prev + (TICK_RATE / 1000));
            updateSystem();
        }, TICK_RATE);
        return () => clearInterval(interval);
    }, [isRunning, step, systemMode, liftA, liftB, building, pendingPassengers, simTime, activeScenario, bootSequence, fireFloor, snapTarget, powerScope]);

    // --- Narrative Loop ---
    useEffect(() => {
        if (step !== 'RUNNING' || !isRunning || !useAI) return; // Only run if AI is enabled
        const narrativeInterval = setInterval(async () => {
            const eventsSnapshot = [...eventBuffer.current];
            eventBuffer.current = [];
            const text = await generateSystemNarrative(eventsSnapshot, liftA, liftB, systemMode, activeScenario);
            if (text) {
                setNarrativeHistory(prev => [...prev, {
                    id: Date.now().toString(), text: text, timestamp: new Date().toLocaleTimeString()
                }]);
            }
        }, 7000);
        return () => clearInterval(narrativeInterval);
    }, [liftA, liftB, systemMode, step, isRunning, activeScenario, useAI]);

    // --- Main Logic Orchestrator ---
    const updateSystem = () => {
        const currentSimTime = simTime;

        if (systemMode === 'NORMAL' && bootSequence < 100) {
            setBootSequence(prev => Math.min(100, prev + 1));
        }

        // 0. Clone State
        const nextBuilding = {
            floors: Object.fromEntries(Object.keys(building.floors).map(k => {
                const key = Number(k);
                return [key, { waitingPassengers: [...building.floors[key].waitingPassengers] }];
            }))
        };
        let nextStats = { ...stats };

        // Update Stats
        if (Math.floor(simTime * 10) % 10 === 0) {
            let instantaneousJ = 0;
            const powerFactor = bootSequence / 100;
            if (liftA.status === 'MOVING') instantaneousJ += (2500 + Math.random() * 500) * powerFactor;
            if (liftB.status === 'MOVING') instantaneousJ += (2500 + Math.random() * 500) * powerFactor;
            if (liftA.status.includes('DOOR')) instantaneousJ += 300 * powerFactor;
            if (liftB.status.includes('DOOR')) instantaneousJ += 300 * powerFactor;
            instantaneousJ += (200 * powerFactor);
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

        const chargeBattery = (lift: LiftState, hasPower: boolean) => {
            let newLevel = lift.batteryLevel;
            if (hasPower) {
                if (newLevel < 100) newLevel += 0.2;
            }
            return Math.min(100, newLevel);
        };

        const liftAHasPower = systemMode !== 'POWER_OUTAGE' || (powerScope !== 'ALL' && powerScope !== 'A');
        const liftBHasPower = systemMode !== 'POWER_OUTAGE' || (powerScope !== 'ALL' && powerScope !== 'B');

        // Calculate Speed Multiplier. Always ensure a minimum speed of 0.2 so elevator never fully freezes
        const globalSpeedMult = Math.max(0.2, bootSequence / 100);

        const resultA = processLiftTick(
            { ...liftA, batteryLevel: chargeBattery(liftA, liftAHasPower) },
            liftB, nextBuilding, nextStats,
            liftAHasPower ? globalSpeedMult : 0,
            liftAHasPower,
            snapTarget === 'A' || snapTarget === 'BOTH'
        );

        const resultB = processLiftTick(
            { ...liftB, batteryLevel: chargeBattery(liftB, liftBHasPower) },
            resultA.lift, resultA.building, resultA.stats,
            liftBHasPower ? globalSpeedMult : 0,
            liftBHasPower,
            snapTarget === 'B' || snapTarget === 'BOTH'
        );

        setLiftA(resultA.lift);
        setLiftB(resultB.lift);
        setBuilding(resultB.building);
        setStats(resultB.stats);
    };

    // --- Pure Logic Processor ---
    const processLiftTick = (
        lift: LiftState,
        otherLift: LiftState,
        buildingState: BuildingState,
        currentStats: SimulationStats,
        mainsSpeedMultiplier: number,
        hasMainsPower: boolean,
        isCableSnapped: boolean
    ) => {
        let nextLift = { ...lift };
        const nextBuilding = buildingState;
        let nextStats = { ...currentStats };

        // --- 1. CABLE SNAP LOGIC ---
        if (isCableSnapped) {
            if (nextLift.status === 'MAINTENANCE') {
                return { lift: nextLift, building: nextBuilding, stats: nextStats };
            }
            const nearestFloor = Math.round(nextLift.currentFloor);
            const distance = Math.abs(nextLift.currentFloor - nearestFloor);

            if (distance < 0.05) {
                nextLift.currentFloor = nearestFloor;
                nextLift.status = 'MAINTENANCE';
                nextLift.doorOpenProgress = 1;
                nextLift.passengers = [];
                addLog(`LIFT ${nextLift.id} EMERGENCY STOP AT FLOOR ${nearestFloor}. OUT OF ORDER.`, 'ERROR');
            } else {
                nextLift.status = 'EMERGENCY_HALT';
                const direction = nearestFloor > nextLift.currentFloor ? 1 : -1;
                nextLift.currentFloor += direction * 0.02;
            }
            return { lift: nextLift, building: nextBuilding, stats: nextStats };
        }

        // --- 2. POWER OUTAGE / BATTERY LOGIC ---
        if (!hasMainsPower) {
            if (nextLift.batteryLevel > 0) {
                if (Math.abs(nextLift.currentFloor - 1) < 0.05) {
                    nextLift.currentFloor = 1;
                    nextLift.status = 'DOOR_OPEN';
                    nextLift.doorOpenProgress = 1;
                    if (nextLift.passengers.length > 0) {
                        addLog(`LIFT ${nextLift.id} (Battery): Evacuated ${nextLift.passengers.length} pax at Floor 1.`);
                        nextStats.totalPassengersDelivered += nextLift.passengers.length;
                        nextLift.passengers = [];
                    }
                } else {
                    nextLift.status = 'BATTERY_MODE';
                    nextLift.currentFloor -= 0.03;
                    nextLift.batteryLevel -= 0.1;
                    if (nextLift.currentFloor < 1) nextLift.currentFloor = 1;
                }
            } else {
                nextLift.status = 'IDLE';
            }
            return { lift: nextLift, building: nextBuilding, stats: nextStats };
        }

        // --- 3. MAINS POWER LOGIC (Normal + Earthquake + Fire) ---
        // Note: Removed early return - even at low speed, elevator should still process door operations

        // EARTHQUAKE LOGIC
        if (systemMode === 'EARTHQUAKE') {
            // Fix for "Stuck" bug: If safe at floor 1, allow doors to operate or stay open, don't lock completely
            if (Math.abs(nextLift.currentFloor - 1) < 0.05) {
                nextLift.currentFloor = 1;
                if (nextLift.status === 'MOVING') {
                    nextLift.status = 'DOOR_OPENING';
                } else if (nextLift.status === 'DOOR_OPEN' && nextLift.passengers.length === 0) {
                    // Stay open or Close and IDLE? Let's stay IDLE.
                    nextLift.status = 'IDLE';
                    nextLift.doorOpenProgress = 1; // Keep open for evacuation
                }
            } else {
                nextLift.targetFloor = 1; // Force go to 1
            }
        }

        // FIRE LOGIC
        if (systemMode === 'FIRE_ALARM' && fireFloor) {
            if (nextLift.targetFloor === fireFloor) {
                nextLift.targetFloor = fireFloor === 1 ? 2 : 1;
            }
            if (Math.round(nextLift.currentFloor) === fireFloor && nextLift.status === 'DOOR_OPEN') {
                nextLift.status = 'DOOR_CLOSING';
            }
        }

        // --- 4. STANDARD OPERATIONS ---

        // Door Operations
        if (nextLift.status === 'DOOR_OPEN') {
            if (systemMode === 'EARTHQUAKE' && nextLift.currentFloor === 1) {
                // Keep doors open in EQ at safe floor
            } else {
                nextLift.status = 'DOOR_CLOSING';
            }
            return { lift: nextLift, building: nextBuilding, stats: nextStats };
        }
        if (nextLift.status === 'DOOR_OPENING') {
            nextLift.doorOpenProgress += 0.05 * Math.max(0.5, mainsSpeedMultiplier); // Doors always open at reasonable speed
            if (nextLift.doorOpenProgress >= 1) {
                nextLift.doorOpenProgress = 1;
                nextLift.status = 'DOOR_OPEN';

                // BOARDING
                const currentFloor = Math.round(nextLift.currentFloor);
                const isFireHere = systemMode === 'FIRE_ALARM' && currentFloor === fireFloor;

                if (!isFireHere) {
                    const liftPassengers = [...nextLift.passengers];
                    const leaving = liftPassengers.filter(p => p.destinationFloor === currentFloor);
                    const staying = liftPassengers.filter(p => p.destinationFloor !== currentFloor);

                    if (leaving.length > 0) {
                        nextStats.totalPassengersDelivered += leaving.length;
                        addLog(`${leaving.length} turun di L${currentFloor}`);
                    }

                    const waiting = nextBuilding.floors[currentFloor].waitingPassengers;
                    const liftDir = nextLift.direction;
                    const boarding = [];
                    const leftBehind = [];

                    // In Earthquake, nobody boards unless it's to escape? (Simpler: standard boarding)
                    for (const p of waiting) {
                        const pDir = p.destinationFloor > p.startFloor ? 'UP' : 'DOWN';
                        const canBoard = (liftDir === 'IDLE') || (liftDir === pDir) || (staying.length === 0);
                        if (canBoard) boarding.push(p);
                        else leftBehind.push(p);
                    }

                    nextLift.passengers = [...staying, ...boarding];
                    nextBuilding.floors[currentFloor].waitingPassengers = leftBehind;
                    nextLift.totalWeight = nextLift.passengers.reduce((sum, p) => sum + p.weight, 0);
                } else {
                    addLog(`FIRE ALARM: Doors opened at L${currentFloor} but boarding restricted!`, 'WARNING');
                }
            }
            return { lift: nextLift, building: nextBuilding, stats: nextStats };
        }
        if (nextLift.status === 'DOOR_CLOSING') {
            nextLift.doorOpenProgress -= 0.05 * Math.max(0.5, mainsSpeedMultiplier); // Doors always close at reasonable speed
            if (nextLift.doorOpenProgress <= 0) {
                nextLift.doorOpenProgress = 0;
                nextLift.status = 'IDLE';
            }
            return { lift: nextLift, building: nextBuilding, stats: nextStats };
        }

        // Movement
        if (nextLift.status === 'MOVING' && nextLift.targetFloor !== null) {
            const dist = Math.abs(nextLift.targetFloor - nextLift.currentFloor);
            const dir = Math.sign(nextLift.targetFloor - nextLift.currentFloor);
            let speed = LIFT_MAX_SPEED_MPS * Math.max(0.2, mainsSpeedMultiplier); // Ensure minimum speed
            if (dist < 0.8) speed = Math.max(0.5, speed * dist); // Minimum speed to prevent getting stuck

            const step = (speed * (TICK_RATE / 1000)) / FLOOR_HEIGHT_METERS;

            if (dist < step) {
                nextLift.currentFloor = nextLift.targetFloor;
                nextLift.status = 'DOOR_OPENING';
            } else {
                nextLift.currentFloor += dir * step;
                nextLift.direction = dir > 0 ? 'UP' : 'DOWN';
            }
            return { lift: nextLift, building: nextBuilding, stats: nextStats };
        }

        // Idle / Decision (SCAN)
        if (nextLift.status === 'IDLE') {
            if (systemMode === 'EARTHQUAKE' && Math.abs(nextLift.currentFloor - 1) > 0.05) {
                nextLift.targetFloor = 1;
                nextLift.status = 'MOVING';
                return { lift: nextLift, building: nextBuilding, stats: nextStats };
            }

            const otherLiftBusy = otherLift.status !== 'IDLE';
            const otherLiftTarget = otherLift.targetFloor;

            const floorCalls = Object.keys(nextBuilding.floors).map(Number).filter(f => {
                if (systemMode === 'FIRE_ALARM' && f === fireFloor) return false;
                const hasPax = nextBuilding.floors[f].waitingPassengers.length > 0;
                if (!hasPax) return false;
                if (otherLiftBusy && otherLiftTarget === f) return false;
                if (systemMode === 'FLOOD' && f === 1) return false;
                return true;
            });

            const cabinDestinations = nextLift.passengers
                .map(p => p.destinationFloor)
                .filter(f => !(systemMode === 'FIRE_ALARM' && f === fireFloor));

            const allTargets = new Set([...floorCalls, ...cabinDestinations]);

            if (allTargets.size === 0) {
                nextLift.direction = 'IDLE';
            } else {
                const closest = Array.from(allTargets).reduce((prev, curr) =>
                    Math.abs(curr - nextLift.currentFloor) < Math.abs(prev - nextLift.currentFloor) ? curr : prev
                );
                if (Math.abs(closest - nextLift.currentFloor) < 0.1) {
                    nextLift.status = 'DOOR_OPENING';
                } else {
                    nextLift.targetFloor = closest;
                    nextLift.status = 'MOVING';
                    nextLift.direction = closest > nextLift.currentFloor ? 'UP' : 'DOWN';
                }
            }
        }

        return { lift: nextLift, building: nextBuilding, stats: nextStats };
    };

    const generateReport = async () => {
        const history = logs.map(l => `[${l.timestamp.toLocaleTimeString()}] ${l.message}`);
        setAnalysisReport("Sedang menganalisis performa sistem...");
        const report = await generateScenarioAnalysis(history);
        setAnalysisReport(report);
    };

    if (step === 'LANDING') {
        return <LandingPage onStart={() => setStep('LIFTS')} />;
    }

    // --- RENDER ---
    const renderSetupWizard = () => {
        return (
            <div className="max-w-4xl mx-auto mt-10 p-6 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl font-sans">
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
                    <h2 className="text-2xl font-bold text-blue-400 tracking-tight flex items-center gap-2">
                        <Settings className="w-6 h-6" /> Konfigurasi Sistem
                    </h2>
                    <div onClick={handleQuickLaunch} className="cursor-pointer hover:bg-slate-800 p-2 rounded-lg transition-colors group flex items-center gap-2 border border-transparent hover:border-slate-700" title="Random Quick Launch">
                        <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded flex items-center justify-center shadow-lg group-hover:shadow-blue-500/30">
                            <span className="font-mono text-white font-bold">E</span>
                        </div>
                        <span className="text-xs text-slate-500 group-hover:text-blue-400 font-bold uppercase tracking-wide">Quick Launch</span>
                    </div>
                </div>
                {step === 'LIFTS' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><ArrowUpRight size={18} className="text-blue-400" /> Posisi Awal Lift</h3>
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-slate-400 mb-2 text-sm font-medium">Mulai Lift A</label>
                                    <select value={configLiftA} onChange={e => setConfigLiftA(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-lg focus:ring-2 focus:ring-blue-500 outline-none">
                                        {FLOORS.map(f => <option key={f} value={f}>Lantai {f}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-2 text-sm font-medium">Mulai Lift B</label>
                                    <select value={configLiftB} onChange={e => setConfigLiftB(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-lg focus:ring-2 focus:ring-blue-500 outline-none">
                                        {FLOORS.map(f => <option key={f} value={f}>Lantai {f}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><UserPlus size={18} className="text-blue-400" /> Jumlah Penumpang</h3>
                            <input type="number" min="1" max="20" value={passengerCount} onChange={e => setPassengerCount(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <button onClick={() => setStep('PASSENGERS')} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20">Lanjut <ChevronRight /></button>
                    </div>
                )}
                {step === 'PASSENGERS' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <h3 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-2">Detail Penumpang ({passengerCount})</h3>
                        <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                            {passengerConfigs.map((p, idx) => (
                                <div key={idx} className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors">
                                    <div className="flex justify-between items-center mb-2"><span className="text-blue-400 font-bold flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs">{idx + 1}</div>Penumpang {idx + 1}</span></div>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        <div className="md:col-span-1"><label className="text-[10px] uppercase text-slate-500 block font-bold mb-1">Nama</label><input type="text" value={p.name} onChange={e => { const newC = [...passengerConfigs]; newC[idx].name = e.target.value; setPassengerConfigs(newC); }} className="w-full bg-slate-900 p-2 border border-slate-600 rounded text-sm outline-none" /></div>
                                        <div><label className="text-[10px] uppercase text-slate-500 block font-bold mb-1">Berat</label><input type="number" value={p.weight} onChange={e => { const newC = [...passengerConfigs]; newC[idx].weight = Number(e.target.value); setPassengerConfigs(newC); }} className="w-full bg-slate-900 p-2 border border-slate-600 rounded text-sm outline-none" /></div>
                                        <div><label className="text-[10px] uppercase text-slate-500 block font-bold mb-1">Asal</label><select value={p.startFloor} onChange={e => { const newC = [...passengerConfigs]; newC[idx].startFloor = Number(e.target.value); setPassengerConfigs(newC); }} className="w-full bg-slate-900 p-2 border border-slate-600 rounded text-sm outline-none">{FLOORS.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                                        <div><label className="text-[10px] uppercase text-slate-500 block font-bold mb-1">Tujuan</label><select value={p.destinationFloor} onChange={e => { const newC = [...passengerConfigs]; newC[idx].destinationFloor = Number(e.target.value); setPassengerConfigs(newC); }} className="w-full bg-slate-900 p-2 border border-slate-600 rounded text-sm outline-none">{FLOORS.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                                        <div><label className="text-[10px] uppercase text-slate-500 block font-bold mb-1">Waktu</label><input type="number" value={p.requestTime} onChange={e => { const newC = [...passengerConfigs]; newC[idx].requestTime = Number(e.target.value); setPassengerConfigs(newC); }} className="w-full bg-slate-900 p-2 border border-slate-600 rounded text-sm outline-none" /></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-4 pt-4"><button onClick={() => setStep('LIFTS')} className="px-6 py-3 border border-slate-600 rounded-lg hover:bg-slate-800 transition-colors">Kembali</button><button onClick={() => setStep('REVIEW')} className="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold shadow-lg shadow-blue-900/20">Review Skenario</button></div>
                    </div>
                )}
                {step === 'REVIEW' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">

                        {/* Passenger Detail Table */}
                        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><FileText size={18} className="text-blue-400" /> Ringkasan Penumpang</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-400">
                                    <thead className="bg-slate-800 text-slate-200 uppercase font-mono text-xs">
                                        <tr>
                                            <th className="px-4 py-3">Nama</th>
                                            <th className="px-4 py-3">Berat (kg)</th>
                                            <th className="px-4 py-3">Asal</th>
                                            <th className="px-4 py-3">Tujuan</th>
                                            <th className="px-4 py-3">Waktu</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700">
                                        {passengerConfigs.map((p, i) => (
                                            <tr key={i} className="hover:bg-slate-700/30">
                                                <td className="px-4 py-2 font-medium text-white">{p.name}</td>
                                                <td className="px-4 py-2">{p.weight}</td>
                                                <td className="px-4 py-2">L{p.startFloor}</td>
                                                <td className="px-4 py-2">L{p.destinationFloor}</td>
                                                <td className="px-4 py-2">{p.requestTime}s</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary Stats */}
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-700">
                                <div>
                                    <span className="text-xs text-slate-500 uppercase font-bold">Total Penumpang</span>
                                    <div className="text-xl font-mono text-white">{passengerConfigs.length}</div>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 uppercase font-bold">Total Berat</span>
                                    <div className="text-xl font-mono text-white">{passengerConfigs.reduce((a, b) => a + b.weight, 0)} kg</div>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 uppercase font-bold">Posisi Lift A</span>
                                    <div className="text-xl font-mono text-white">Lantai {configLiftA}</div>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 uppercase font-bold">Posisi Lift B</span>
                                    <div className="text-xl font-mono text-white">Lantai {configLiftB}</div>
                                </div>
                            </div>
                        </div>

                        {/* AI Toggle Section */}
                        <div className={`p-6 rounded-xl border transition-all ${useAI ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-slate-800/30 border-slate-700'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${useAI ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                        {useAI ? <BrainCircuit size={24} className="animate-pulse" /> : <Dice5 size={24} />}
                                    </div>
                                    <div>
                                        <h4 className={`font-bold text-lg ${useAI ? 'text-indigo-300' : 'text-slate-400'}`}>
                                            {useAI ? 'AI Skenario: AKTIF' : 'AI Skenario: NON-AKTIF'}
                                        </h4>
                                        <p className="text-sm text-slate-400 max-w-md">
                                            {useAI
                                                ? "AI akan membuat skenario acak (Normal/Bencana) dan narasi dinamis selama simulasi."
                                                : "Simulasi berjalan dalam mode Manual/Normal. Tidak ada kejadian acak dari AI."}
                                        </p>
                                    </div>
                                </div>

                                {/* Toggle Switch */}
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} className="sr-only peer" />
                                    <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setStep('PASSENGERS')} className="px-6 py-3 border border-slate-600 rounded-xl hover:bg-slate-800 text-slate-300 transition-colors">Ubah Data</button>
                            <button
                                onClick={startSimulation}
                                disabled={loadingScenario}
                                className={`flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-4 rounded-xl font-bold text-white shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all group ${loadingScenario ? 'opacity-50 cursor-wait' : ''}`}
                            >
                                {loadingScenario ? 'MEMUAT SISTEM...' : (
                                    <>
                                        <Play size={20} fill="currentColor" />
                                        {useAI ? 'JALANKAN DENGAN AI' : 'JALANKAN MANUAL'}
                                    </>
                                )}
                            </button>
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
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Smart Elevator Simulator</h1>
                </header>
                {renderSetupWizard()}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* Clickable Header Logo/Title to Return to Lobby */}
                <div
                    onClick={() => setStep('LANDING')}
                    className="flex items-center gap-4 cursor-pointer group hover:opacity-90 transition-opacity"
                    title="Return to Dashboard Lobby"
                >
                    <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/50 transition-all border border-blue-400/20">
                        <span className="font-mono text-white font-bold text-xl">E</span>
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                            Smart Elevator System
                        </h1>
                        <p className="text-slate-400 text-xs md:text-sm mt-1 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full animate-pulse ${systemMode === 'NORMAL' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            Mode: {activeScenario?.title || 'System Active'} • <span className="text-yellow-400 font-mono">T: {simTime.toFixed(1)}s</span>
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={resetSimulation}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-colors text-sm"
                    >
                        <RotateCcw size={16} /> Reset
                    </button>
                    <button
                        onClick={() => setIsRunning(!isRunning)}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold shadow-lg transition-all text-sm ${isRunning ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                    >
                        {isRunning ? <><Pause size={16} fill="currentColor" /> Jeda</> : <><Play size={16} fill="currentColor" /> Lanjut</>}
                    </button>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LEFT COLUMN: VISUALIZER & CONTROLS */}
                <div className="lg:col-span-7 space-y-6">

                    <BuildingVisualizer liftA={liftA} liftB={liftB} building={building} mode={systemMode} fireFloor={fireFloor} />

                    <Dashboard liftA={liftA} liftB={liftB} stats={stats} bootSequence={bootSequence} />

                    {/* MANUAL OVERRIDE CONTROL PANEL - UPDATED */}
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 md:p-6">
                        <h2 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-slate-400">
                            <Activity size={16} /> Manual Override Controls
                        </h2>
                        <div className="space-y-4">

                            {/* Fire Control */}
                            <div className="flex items-center gap-3">
                                <div className="w-24 text-xs font-bold text-slate-500 flex items-center gap-1"><Flame size={14} /> FIRE</div>
                                <div className="flex gap-2 flex-1">
                                    {[1, 2, 3].map(f => (
                                        <button key={f} onClick={() => triggerFire(f)} className={`flex-1 py-2 rounded border text-xs font-mono font-bold ${fireFloor === f ? 'bg-red-600 border-red-500 text-white animate-pulse' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}>
                                            L{f}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Cable Snap Control */}
                            <div className="flex items-center gap-3">
                                <div className="w-24 text-xs font-bold text-slate-500 flex items-center gap-1"><Anchor size={14} /> SNAP</div>
                                <div className="flex gap-2 flex-1">
                                    <button onClick={() => triggerCableSnap('A')} className={`flex-1 py-2 rounded border text-xs font-mono font-bold ${(snapTarget === 'A' || snapTarget === 'BOTH') ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}>Lift A</button>
                                    <button onClick={() => triggerCableSnap('B')} className={`flex-1 py-2 rounded border text-xs font-mono font-bold ${(snapTarget === 'B' || snapTarget === 'BOTH') ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}>Lift B</button>
                                </div>
                            </div>

                            {/* Power Outage Control */}
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
                </div>

                {/* RIGHT COLUMN: NARRATIVE & LOGS */}
                <div className="lg:col-span-5 space-y-6 flex flex-col h-full">

                    {/* AI Narrative Box - Scrollable */}
                    <div className={`border rounded-xl shadow-lg transition-colors duration-500 flex flex-col h-[250px] overflow-hidden ${systemMode === 'NORMAL' ? 'bg-slate-900 border-indigo-500/30 shadow-indigo-900/10' : 'bg-red-950/30 border-red-500/50 shadow-red-900/20'
                        }`}>
                        <div className="p-4 border-b border-inherit bg-inherit flex justify-between items-center z-10">
                            <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${systemMode === 'NORMAL' ? 'text-indigo-400' : 'text-red-400 animate-pulse'
                                }`}>
                                <span className={`w-2 h-2 rounded-full animate-ping ${systemMode === 'NORMAL' ? 'bg-indigo-500' : 'bg-red-500'}`} />
                                SKENARIO SYSTEM {useAI ? '(AI ON)' : '(MANUAL)'}
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
                            {narrativeHistory.map((log) => (
                                <div key={log.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <span className="text-[10px] text-slate-500 font-mono block mb-1 opacity-70">{log.timestamp}</span>
                                    <div className="font-mono text-sm leading-relaxed text-slate-300 border-l-2 border-slate-700 pl-3">
                                        {log.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={narrativeEndRef} />
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
                                <div key={log.id} className={`flex gap-3 pb-2 border-b border-slate-800 last:border-0 ${log.type === 'WARNING' ? 'text-yellow-400' :
                                        log.type === 'ERROR' ? 'text-red-400 font-bold' :
                                            log.type === 'AI_NARRATIVE' ? 'text-cyan-400 italic' :
                                                log.type === 'SYSTEM' ? 'text-indigo-400 font-bold' : 'text-slate-400'
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