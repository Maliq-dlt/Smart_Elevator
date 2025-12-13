
import React, { useState, useEffect, useRef } from 'react';
import { BuildingVisualizer } from './components/BuildingVisualizer';
import { Dashboard } from './components/Dashboard';
import { LandingPage } from './components/LandingPage';
import { Header } from './components/layout/Header';
import { SetupWizard } from './components/setup/SetupWizard';
import { ManualControls } from './components/controls/ManualControls';
import { LogConsole } from './components/panels/LogConsole';
import { LiftState, Passenger, BuildingState, SystemMode, LogEntry, SimulationStats, Scenario, ApprovalRequest } from './types/index';
import { MOCK_NAMES, TICK_RATE } from './constants/index';
import { processLiftTick, initialLiftState } from './engine/liftLogic';
import { generateSystemNarrative, generateScenarioAnalysis, generateRandomScenario } from './services/geminiService';
import { ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

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

export default function App() {
    // --- Setup State ---
    const [step, setStep] = useState<SetupStep>('LANDING');
    const [configLiftA, setConfigLiftA] = useState(1);
    const [configLiftB, setConfigLiftB] = useState(1);
    const [passengerCount, setPassengerCount] = useState(3);
    const [passengerConfigs, setPassengerConfigs] = useState<PassengerConfig[]>([]);
    const [useAI, setUseAI] = useState(true);

    // --- Simulation State ---
    const [simTime, setSimTime] = useState(0);
    const [pendingPassengers, setPendingPassengers] = useState<PassengerConfig[]>([]);
    const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
    const [isAutoSimulating, setIsAutoSimulating] = useState(false);
    const [speedMultiplier, setSpeedMultiplier] = useState(1);

    const [liftA, setLiftA] = useState<LiftState>(initialLiftState('A', 1));
    const [liftB, setLiftB] = useState<LiftState>(initialLiftState('B', 1));
    const [building, setBuilding] = useState<BuildingState>({
        floors: { 1: { waitingPassengers: [] }, 2: { waitingPassengers: [] }, 3: { waitingPassengers: [] } }
    });

    const [stats, setStats] = useState<SimulationStats>({
        totalPassengersDelivered: 0, totalWaitTime: 0, avgWaitTime: 0, totalEnergyJ: 0,
        floorVisits: { 1: 0, 2: 0, 3: 0 }, peakPassengers: 0, minPassengers: 0, energyHistory: Array(25).fill(0)
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

    // --- SNAP TIMER REFERENCES ---
    const snapTimerA = useRef<number>(0);
    const snapTimerB = useRef<number>(0);

    // --- INTERACTIVE APPROVAL STATE ---
    const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);

    // --- MANUAL PASSENGER INJECTION STATE ---
    const [customPax, setCustomPax] = useState({ name: 'Tamu', weight: 70, start: 1, dest: 3, delay: 0 });

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

    useEffect(() => {
        narrativeEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [narrativeHistory]);

    // --- AUTO SIMULATION LOGIC ---
    useEffect(() => {
        if (!isRunning || !isAutoSimulating) return;
        const interval = setInterval(() => {
            // 70% kemungkinan spawn penumpang (sebelumnya hanya 40%)
            if (Math.random() > 0.7) return;

            // Spawn 1-3 penumpang secara acak
            const numPassengers = Math.floor(Math.random() * 3) + 1;
            const newPassengers: PassengerConfig[] = [];

            for (let i = 0; i < numPassengers; i++) {
                const start = Math.floor(Math.random() * 3) + 1;
                let dest = Math.floor(Math.random() * 3) + 1;
                while (dest === start) dest = Math.floor(Math.random() * 3) + 1;

                const newPax: PassengerConfig = {
                    id: `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)],
                    weight: Math.floor(Math.random() * 60) + 40, // 40-100 kg
                    startFloor: start,
                    destinationFloor: dest,
                    requestTime: simTime + (Math.random() * 1.5) // Delay acak 0-1.5 detik
                };
                newPassengers.push(newPax);
            }

            setPendingPassengers(prev => [...prev, ...newPassengers]);
            newPassengers.forEach(pax => {
                addLog(`AUTO SIM: ${pax.name} (${pax.weight}kg) muncul di Lantai ${pax.startFloor} → ${pax.destinationFloor}`, 'INFO');
            });
        }, 2000); // Interval lebih cepat: 2 detik
        return () => clearInterval(interval);
    }, [isRunning, isAutoSimulating, simTime]);

    const generateRandomPassengerConfig = () => {
        const count = Math.floor(Math.random() * 6) + 3;
        const configs: PassengerConfig[] = [];
        for (let i = 0; i < count; i++) {
            const start = Math.floor(Math.random() * 3) + 1;
            let dest = Math.floor(Math.random() * 3) + 1;
            while (dest === start) dest = Math.floor(Math.random() * 3) + 1;
            configs.push({
                id: Math.random().toString(36).substr(2, 9),
                name: MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)],
                weight: Math.floor(Math.random() * 40) + 50,
                startFloor: start, destinationFloor: dest, requestTime: Math.floor(Math.random() * 10)
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
            scenario = { title: "Operasi Manual / Normal", description: "Mode AI dinonaktifkan.", type: "NORMAL", severity: 1 };
        }
        setActiveScenario(scenario);
        setSystemMode(scenario.type);
        setNarrativeHistory([{
            id: Date.now().toString(), text: `MEMUAT SKENARIO: ${scenario.title.toUpperCase()}... ${scenario.description}`, timestamp: new Date().toLocaleTimeString()
        }]);
        setLiftA(initialLiftState('A', configLiftA));
        setLiftB(initialLiftState('B', configLiftB));
        setBuilding({ floors: { 1: { waitingPassengers: [] }, 2: { waitingPassengers: [] }, 3: { waitingPassengers: [] } } });
        setPendingPassengers([...configs]);
        setStats({
            totalPassengersDelivered: 0, totalWaitTime: 0, avgWaitTime: 0, totalEnergyJ: 0,
            floorVisits: { 1: 0, 2: 0, 3: 0 }, peakPassengers: 0, minPassengers: 0, energyHistory: Array(25).fill(0)
        });
        setLogs([]);
        setSimTime(0);
        setBootSequence(100);
        setFireFloor(null);
        setSnapTarget(null);
        setPowerScope(null);
        setApprovalRequests([]);
        setIsAutoSimulating(false);
        snapTimerA.current = 0;
        snapTimerB.current = 0;
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
        setApprovalRequests([]);
        setIsAutoSimulating(false);
    };

    const addLog = (message: string, type: LogEntry['type'] = 'INFO') => {
        const entry: LogEntry = { id: Math.random().toString(), timestamp: new Date(), type, message };
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

    const triggerFlood = () => {
        if (systemMode === 'FLOOD') {
            setSystemMode('NORMAL');
            addLog('Water levels receding. Flood alert cancelled.', 'SYSTEM');
        } else {
            setSystemMode('FLOOD');
            addLog('WARNING: FLOOD DETECTED! Water entering ground floor. Lifts avoiding L1.', 'WARNING');
        }
    };

    const triggerCableSnap = (clicked: 'A' | 'B') => {
        let newTarget: 'A' | 'B' | 'BOTH' | null = null;
        if (snapTarget === null) newTarget = clicked;
        else if (snapTarget === clicked) newTarget = null;
        else if (snapTarget === 'BOTH') newTarget = clicked === 'A' ? 'B' : 'A';
        else newTarget = 'BOTH';

        setSnapTarget(newTarget);
        const wasA = snapTarget === 'A' || snapTarget === 'BOTH';
        const isA = newTarget === 'A' || newTarget === 'BOTH';
        if (wasA && !isA) {
            setLiftA(prev => ({ ...prev, status: 'IDLE', doorOpenProgress: 0, targetFloor: null }));
            addLog("MAINTENANCE: Lift A kabel diperbaiki. Kembali beroperasi normal.", "SYSTEM");
        }
        const wasB = snapTarget === 'B' || snapTarget === 'BOTH';
        const isB = newTarget === 'B' || newTarget === 'BOTH';
        if (wasB && !isB) {
            setLiftB(prev => ({ ...prev, status: 'IDLE', doorOpenProgress: 0, targetFloor: null }));
            addLog("MAINTENANCE: Lift B kabel diperbaiki. Kembali beroperasi normal.", "SYSTEM");
        }
        if (newTarget) {
            setSystemMode('CABLE_SNAP');
            addLog(`CRITICAL: CABLE SNAP TRIGGERED FOR ${newTarget === 'BOTH' ? 'ALL LIFTS' : 'LIFT ' + newTarget}!`, 'ERROR');
        } else if (!newTarget) {
            setSystemMode('NORMAL');
            addLog(`All Cable Snap alerts cleared.`, 'SYSTEM');
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

    const handleApprove = (liftId: 'A' | 'B') => {
        const setter = liftId === 'A' ? setLiftA : setLiftB;
        setter(prev => ({ ...prev, status: 'MOVING' }));
        setApprovalRequests(prev => prev.filter(req => req.liftId !== liftId));
        addLog(`USER OVERRIDE: Lift ${liftId} authorized to enter HAZARD ZONE.`, 'WARNING');
    };

    const handleReject = (liftId: 'A' | 'B') => {
        const setter = liftId === 'A' ? setLiftA : setLiftB;
        setLiftA(prevA => (liftId === 'A' ? { ...prevA, status: 'DOOR_OPENING', targetFloor: null } : prevA));
        setLiftB(prevB => (liftId === 'B' ? { ...prevB, status: 'DOOR_OPENING', targetFloor: null } : prevB));
        setApprovalRequests(prev => prev.filter(req => req.liftId !== liftId));
        addLog(`SAFETY PROTOCOL: Lift ${liftId} destination rejected. Disembarking passengers.`, 'INFO');
    };

    const handleInjectPassenger = () => {
        const { name, weight, start, dest, delay } = customPax;
        if (start === dest) {
            addLog(`Gagal Injeksi: ${name} tidak bisa pergi ke lantai yang sama.`, 'ERROR');
            return;
        }
        const newPax: PassengerConfig = {
            id: `manual-${Date.now()}`, name: name || 'Tamu', weight: Number(weight), startFloor: Number(start), destinationFloor: Number(dest), requestTime: simTime + Number(delay)
        };
        setPendingPassengers(prev => [...prev, newPax]);
        addLog(`INJEKSI MANUAL: ${newPax.name} di L${newPax.startFloor} dalam ${delay}s.`, 'SYSTEM');
        setCustomPax(prev => ({ ...prev, name: MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)] }));
    };

    const generateReport = async () => {
        const history = logs.map(l => `[${l.timestamp.toLocaleTimeString()}] ${l.message}`);
        setAnalysisReport("Sedang menganalisis performa sistem...");
        const report = await generateScenarioAnalysis(history);
        setAnalysisReport(report);
    };

    // --- Core Simulation Loop ---
    useEffect(() => {
        if (!isRunning || step !== 'RUNNING') return;
        const effectiveTickRate = TICK_RATE / speedMultiplier;
        const interval = setInterval(() => {
            setSimTime(prev => prev + (TICK_RATE / 1000));
            updateSystem();
        }, effectiveTickRate);
        return () => clearInterval(interval);
    }, [isRunning, step, systemMode, liftA, liftB, building, pendingPassengers, simTime, activeScenario, bootSequence, fireFloor, snapTarget, powerScope, approvalRequests, isAutoSimulating, speedMultiplier]);

    // --- Narrative Loop ---
    useEffect(() => {
        if (step !== 'RUNNING' || !isRunning || !useAI) return;
        const narrativeInterval = setInterval(async () => {
            const eventsSnapshot = [...eventBuffer.current];
            eventBuffer.current = [];
            const text = await generateSystemNarrative(eventsSnapshot, liftA, liftB, systemMode, activeScenario);
            if (text) setNarrativeHistory(prev => [...prev, { id: Date.now().toString(), text: text, timestamp: new Date().toLocaleTimeString() }]);
        }, 7000);
        return () => clearInterval(narrativeInterval);
    }, [liftA, liftB, systemMode, step, isRunning, activeScenario, useAI]);

    const updateSystem = () => {
        const currentSimTime = simTime;
        if (systemMode === 'NORMAL' && bootSequence < 100) setBootSequence(prev => Math.min(100, prev + 1));

        const nextBuilding = {
            floors: Object.fromEntries(Object.keys(building.floors).map(k => {
                const key = Number(k);
                return [key, { waitingPassengers: [...building.floors[key].waitingPassengers] }];
            }))
        };
        let nextStats = { ...stats };

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

        const toSpawn = pendingPassengers.filter(p => p.requestTime <= currentSimTime);
        if (toSpawn.length > 0) {
            setPendingPassengers(prev => prev.filter(p => p.requestTime > currentSimTime));
            toSpawn.forEach(p => {
                nextBuilding.floors[p.startFloor].waitingPassengers.push(p);
                addLog(`Permintaan Baru: ${p.name} di Lantai ${p.startFloor} -> ${p.destinationFloor}`);
            });
        }

        const chargeBattery = (lift: LiftState, hasPower: boolean) => {
            let newLevel = lift.batteryLevel;
            if (hasPower && newLevel < 100) newLevel += 0.2;
            return Math.min(100, newLevel);
        };

        const liftAHasPower = systemMode !== 'POWER_OUTAGE' || (powerScope !== 'ALL' && powerScope !== 'A');
        const liftBHasPower = systemMode !== 'POWER_OUTAGE' || (powerScope !== 'ALL' && powerScope !== 'B');
        const globalSpeedMult = Math.max(0.2, bootSequence / 100);

        const resultA = processLiftTick(
            { ...liftA, batteryLevel: chargeBattery(liftA, liftAHasPower) },
            liftB, nextBuilding, nextStats, systemMode, fireFloor,
            liftAHasPower ? globalSpeedMult : 0, liftAHasPower,
            snapTarget === 'A' || snapTarget === 'BOTH', snapTimerA, approvalRequests, simTime
        );

        const resultB = processLiftTick(
            { ...liftB, batteryLevel: chargeBattery(liftB, liftBHasPower) },
            resultA.lift, resultA.building, resultA.stats, systemMode, fireFloor,
            liftBHasPower ? globalSpeedMult : 0, liftBHasPower,
            snapTarget === 'B' || snapTarget === 'BOTH', snapTimerB, approvalRequests, simTime
        );

        if (resultA.logs) resultA.logs.forEach(l => addLog(l, l.includes('DARURAT') ? 'ERROR' : 'INFO'));
        if (resultB.logs) resultB.logs.forEach(l => addLog(l, l.includes('DARURAT') ? 'ERROR' : 'INFO'));

        if (resultA.approvalRequest) setApprovalRequests(prev => [...prev, resultA.approvalRequest!]);
        if (resultB.approvalRequest) setApprovalRequests(prev => [...prev, resultB.approvalRequest!]);

        setLiftA(resultA.lift);
        setLiftB(resultB.lift);
        setBuilding(resultB.building);
        setStats(resultB.stats);
    };

    if (step === 'LANDING') return <LandingPage onStart={() => setStep('LIFTS')} />;

    if (step !== 'RUNNING') {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
                <header className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Smart Elevator Simulator</h1>
                </header>
                <SetupWizard
                    step={step} setStep={setStep} configLiftA={configLiftA} setConfigLiftA={setConfigLiftA}
                    configLiftB={configLiftB} setConfigLiftB={setConfigLiftB} passengerCount={passengerCount}
                    setPassengerCount={setPassengerCount} passengerConfigs={passengerConfigs} setPassengerConfigs={setPassengerConfigs}
                    useAI={useAI} setUseAI={setUseAI} handleQuickLaunch={handleQuickLaunch} startSimulation={startSimulation} loadingScenario={loadingScenario}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans relative">
            {approvalRequests.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 pointer-events-none">
                    <div className="space-y-4 pointer-events-auto">
                        {approvalRequests.map((req, i) => (
                            <div key={i} className="bg-red-900/90 backdrop-blur-md border-l-4 border-red-500 text-white p-6 rounded-r-lg shadow-2xl animate-in slide-in-from-top-4 max-w-md">
                                <div className="flex items-start gap-4">
                                    <div className="bg-red-500 p-2 rounded-full"><ShieldAlert size={24} className="text-white" /></div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-1">PERINGATAN KEAMANAN</h3>
                                        <p className="text-sm text-red-100 mb-4">Lift {req.liftId} ingin menuju <strong className="text-white bg-red-800 px-1">Lantai {req.targetFloor}</strong> ({req.reason}).</p>
                                        <div className="flex gap-3">
                                            <button onClick={() => handleReject(req.liftId)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded text-sm font-bold border border-slate-600"><XCircle size={16} /> TIDAK</button>
                                            <button onClick={() => handleApprove(req.liftId)} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-sm font-bold shadow-lg shadow-red-900/50"><CheckCircle size={16} /> YA</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Header
                setStep={setStep} systemMode={systemMode} activeScenario={activeScenario} simTime={simTime}
                resetSimulation={resetSimulation} isRunning={isRunning} setIsRunning={setIsRunning}
                isAutoSimulating={isAutoSimulating} setIsAutoSimulating={setIsAutoSimulating}
                speedMultiplier={speedMultiplier} setSpeedMultiplier={setSpeedMultiplier}
            />

            <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-6">
                    <BuildingVisualizer liftA={liftA} liftB={liftB} building={building} mode={systemMode} fireFloor={fireFloor} />
                    <Dashboard liftA={liftA} liftB={liftB} stats={stats} bootSequence={bootSequence} />
                    <ManualControls
                        fireFloor={fireFloor} triggerFire={triggerFire} systemMode={systemMode} triggerFlood={triggerFlood}
                        snapTarget={snapTarget} triggerCableSnap={triggerCableSnap} powerScope={powerScope} triggerPowerOutage={triggerPowerOutage}
                    />
                </div>
                <LogConsole
                    narrativeHistory={narrativeHistory} narrativeEndRef={narrativeEndRef} logs={logs} systemMode={systemMode}
                    useAI={useAI} generateReport={generateReport} analysisReport={analysisReport} customPax={customPax}
                    setCustomPax={setCustomPax} handleInjectPassenger={handleInjectPassenger}
                />
            </main>
        </div>
    );
}
