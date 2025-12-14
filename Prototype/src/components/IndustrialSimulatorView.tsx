/**
 * Industrial Elevator Simulator View
 * 
 * Main container combining:
 * - 3D elevator scene
 * - Telemetry dashboard
 * - Real-time graphs
 * - Alert panel
 * - Fault simulation
 * - AI suggestions
 * 
 * @module components/IndustrialSimulatorView
 */

import React, { useState, useEffect, useRef } from 'react';
import { Elevator3DScene } from './Elevator3DScene';
import { TelemetryDashboard } from './TelemetryDashboard';
import { TelemetryGraphs, TelemetryDataPoint } from './TelemetryGraphs';
import { FaultSimulationPanel } from './FaultSimulationPanel';
import { AISuggestionsPanel } from './AISuggestionsPanel';
import { LiftState } from '../types/index';
import { AdvancedTelemetry, createInitialTelemetry } from '../engine/PhysicsEngine';
import { processAdvancedTick } from '../engine/AdvancedSimulation';
import { Alert, MaintenanceIndicator, runAlertChecks, generateMaintenanceIndicators } from '../engine/AlertEngine';
import { FaultState, createInitialFaultState, applyFaultEffects } from '../engine/FaultSimulation';
import { DispatchSuggestion, generateDispatchSuggestions } from '../engine/AIDispatcher';
import {
    Layers,
    BarChart3,
    Box,
    AlertTriangle,
    Play,
    Pause,
    RotateCcw,
    Settings,
    Brain,
} from 'lucide-react';

// ============== TYPES ==============

type ViewMode = 'SPLIT' | '3D_FULL' | 'DASH_FULL' | 'COMPONENT';

interface IndustrialSimulatorViewProps {
    liftA: LiftState;
    liftB: LiftState;
    isRunning: boolean;
    timeScale: number;
    simTime: number;
    onToggleRunning: () => void;
    onSetTimeScale: (scale: number) => void;
    onReset: () => void;
}

// ============== MAIN COMPONENT ==============

export const IndustrialSimulatorView: React.FC<IndustrialSimulatorViewProps> = ({
    liftA,
    liftB,
    isRunning,
    timeScale,
    simTime,
    onToggleRunning,
    onSetTimeScale,
    onReset,
}) => {
    // View state
    const [viewMode, setViewMode] = useState<ViewMode>('SPLIT');
    const [selectedLift, setSelectedLift] = useState<'A' | 'B'>('A');
    const [showAlerts, setShowAlerts] = useState(true);

    // Telemetry state
    const [telemetryA, setTelemetryA] = useState<AdvancedTelemetry>(() => createInitialTelemetry(0));
    const [telemetryB, setTelemetryB] = useState<AdvancedTelemetry>(() => createInitialTelemetry(0));
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [maintenanceIndicators, setMaintenanceIndicators] = useState<MaintenanceIndicator[]>([]);

    // Fault simulation state
    const [faultState, setFaultState] = useState<FaultState>(createInitialFaultState);

    // AI suggestions state
    const [aiSuggestions, setAiSuggestions] = useState<DispatchSuggestion[]>([]);

    // Graph data (rolling window) - Initialize with some data immediately
    const [graphData, setGraphData] = useState<TelemetryDataPoint[]>(() => {
        const initialData: TelemetryDataPoint[] = [];
        const now = Date.now();
        for (let i = 0; i < 10; i++) {
            const time = new Date(now - (10 - i) * 300);
            const timeStr = time.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            initialData.push({
                timestamp: time.getTime(),
                time: timeStr,
                speed: 0,
                torque: 100 + Math.random() * 20,
                power: 0.5 + Math.random() * 0.2,
                temperature: 35 + Math.random(),
                load: 0,
                cableTensions: Array(6).fill(8).map(v => v + (Math.random() - 0.5) * 0.3),
                regeneration: 0,
            });
        }
        return initialData;
    });
    const lastTickRef = useRef<number>(Date.now());

    // Update telemetry on each simulation tick
    useEffect(() => {
        if (!isRunning) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const deltaTime = ((now - lastTickRef.current) / 1000) * timeScale;
            lastTickRef.current = now;

            // Process advanced physics
            setTelemetryA(prev => {
                let updated = processAdvancedTick(prev, liftA, deltaTime);
                updated = applyFaultEffects(updated, faultState, 'A');
                return updated;
            });
            setTelemetryB(prev => {
                let updated = processAdvancedTick(prev, liftB, deltaTime);
                updated = applyFaultEffects(updated, faultState, 'B');
                return updated;
            });
        }, 100); // 10 Hz update rate

        return () => clearInterval(interval);
    }, [isRunning, liftA, liftB, timeScale, faultState]);

    // Update alerts, AI suggestions, and graphs
    useEffect(() => {
        const currentTelemetry = selectedLift === 'A' ? telemetryA : telemetryB;

        // Run alert checks
        const newAlerts = runAlertChecks(currentTelemetry);
        setAlerts(newAlerts);

        // Generate maintenance indicators
        const indicators = generateMaintenanceIndicators(currentTelemetry);
        setMaintenanceIndicators(indicators);

        // Generate AI suggestions
        const suggestions = generateDispatchSuggestions(liftA, liftB, telemetryA, telemetryB);
        setAiSuggestions(suggestions);
    }, [telemetryA, telemetryB, selectedLift, liftA, liftB]);

    // Continuous graph data collection - runs when simulation is active
    useEffect(() => {
        if (!isRunning) return;

        const graphInterval = setInterval(() => {
            const currentLift = selectedLift === 'A' ? liftA : liftB;
            const isMoving = currentLift.status === 'MOVING';

            const timeStr = new Date().toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            setGraphData(prev => {
                // Generate realistic simulated values with some variation
                const baseSpeed = isMoving ? (currentLift.direction === 'UP' ? 1.5 : -1.5) : 0;
                const basePower = isMoving ? (8 + Math.random() * 5) : (0.5 + Math.random() * 0.3);
                const lastTemp = prev.length > 0 ? prev[prev.length - 1].temperature : 35;
                const baseTemp = isMoving ? Math.min(75, lastTemp + 0.1) : Math.max(35, lastTemp - 0.05);
                const baseTorque = isMoving ? (2000 + Math.random() * 1500) : (100 + Math.random() * 50);
                const baseLoad = currentLift.sensors.load * 80;

                // Generate cable tensions with realistic variation
                const baseTension = 8 + Math.random();
                const cableTensions = Array.from({ length: 6 }, () => baseTension + (Math.random() - 0.5) * 0.5);

                const newPoint: TelemetryDataPoint = {
                    timestamp: Date.now(),
                    time: timeStr,
                    speed: baseSpeed + (Math.random() - 0.5) * 0.3,
                    torque: baseTorque,
                    power: basePower,
                    temperature: Math.min(75, Math.max(30, baseTemp + Math.random() * 0.5)),
                    load: baseLoad,
                    cableTensions: cableTensions,
                    regeneration: isMoving && currentLift.direction === 'DOWN' ? basePower * 0.5 : 0,
                };
                const updated = [...prev, newPoint].slice(-50);
                return updated;
            });
        }, 300); // Update every 300ms for smooth lines

        return () => clearInterval(graphInterval);
    }, [isRunning, selectedLift, liftA, liftB]);

    // Clear fault
    const handleClearFault = () => {
        setFaultState(createInitialFaultState());
    };

    return (
        <div className="h-full flex flex-col bg-slate-950">
            {/* Top Control Bar */}
            <div className="flex-shrink-0 h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
                {/* Left: Title & View Modes */}
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                        INDUSTRIAL ELEVATOR SIMULATOR
                    </h1>

                    <div className="flex bg-slate-800 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('SPLIT')}
                            className={`p-1.5 rounded transition-all ${viewMode === 'SPLIT' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            title="Split View"
                        >
                            <Layers className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('3D_FULL')}
                            className={`p-1.5 rounded transition-all ${viewMode === '3D_FULL' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            title="3D Full"
                        >
                            <Box className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('DASH_FULL')}
                            className={`p-1.5 rounded transition-all ${viewMode === 'DASH_FULL' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            title="Dashboard Full"
                        >
                            <BarChart3 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('COMPONENT')}
                            className={`p-1.5 rounded transition-all ${viewMode === 'COMPONENT' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            title="Component Mode (Fault Sim + AI)"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Center: Playback Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onReset}
                        className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                        title="Reset"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                        onClick={onToggleRunning}
                        className={`p-2 rounded-lg transition-all ${isRunning
                            ? 'bg-amber-600 text-white hover:bg-amber-500'
                            : 'bg-emerald-600 text-white hover:bg-emerald-500'
                            }`}
                    >
                        {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>

                    <div className="flex bg-slate-800 rounded-lg p-1">
                        {[0.5, 1, 2, 5].map((scale) => (
                            <button
                                key={scale}
                                onClick={() => onSetTimeScale(scale)}
                                className={`px-2 py-1 text-xs font-mono rounded transition-all ${timeScale === scale
                                    ? 'bg-cyan-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                {scale}x
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Alerts, AI, & Time */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-900/50 rounded-lg border border-purple-500/30">
                        <Brain className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-bold text-purple-300">{aiSuggestions.length} AI</span>
                    </div>

                    <button
                        onClick={() => setShowAlerts(!showAlerts)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${alerts.length > 0
                            ? 'bg-red-900/50 text-red-400 border border-red-500/50'
                            : 'bg-slate-800 text-slate-400'
                            }`}
                    >
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-bold">{alerts.length}</span>
                    </button>

                    <div className="text-right">
                        <div className="text-xs text-slate-500">SIM TIME</div>
                        <div className="text-sm font-mono text-cyan-400">{simTime.toFixed(1)}s</div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                {viewMode === 'SPLIT' && (
                    <div className="h-full grid grid-cols-2">
                        {/* Left: 3D Scene */}
                        <div className="border-r border-slate-800">
                            <Elevator3DScene liftA={liftA} liftB={liftB} />
                        </div>

                        {/* Right: Dashboard + Graphs */}
                        <div className="flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto">
                                <TelemetryDashboard
                                    liftATelemetry={telemetryA}
                                    liftBTelemetry={telemetryB}
                                    alerts={alerts}
                                    maintenanceIndicators={maintenanceIndicators}
                                    selectedLift={selectedLift}
                                    onSelectLift={setSelectedLift}
                                />
                            </div>
                            <div className="h-80 border-t border-slate-800 overflow-y-auto bg-slate-950">
                                <TelemetryGraphs data={graphData} />
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === '3D_FULL' && (
                    <Elevator3DScene liftA={liftA} liftB={liftB} />
                )}

                {viewMode === 'DASH_FULL' && (
                    <div className="h-full flex flex-col">
                        <div className="flex-1 overflow-y-auto">
                            <TelemetryDashboard
                                liftATelemetry={telemetryA}
                                liftBTelemetry={telemetryB}
                                alerts={alerts}
                                maintenanceIndicators={maintenanceIndicators}
                                selectedLift={selectedLift}
                                onSelectLift={setSelectedLift}
                            />
                        </div>
                        <div className="h-96 border-t border-slate-800">
                            <TelemetryGraphs data={graphData} />
                        </div>
                    </div>
                )}

                {viewMode === 'COMPONENT' && (
                    <div className="h-full grid grid-cols-2 gap-4 p-4 overflow-y-auto">
                        {/* Left: Fault Simulation + Status */}
                        <div className="space-y-4 overflow-y-auto">
                            <FaultSimulationPanel
                                faultState={faultState}
                                onActivateFault={setFaultState}
                                onClearFault={handleClearFault}
                            />
                            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                                <h3 className="text-sm font-bold text-slate-400 mb-2">Active Fault Status</h3>
                                <div className={`p-3 rounded-lg ${faultState.active ? 'bg-red-900/30 border border-red-500/50' : 'bg-emerald-900/30 border border-emerald-500/50'}`}>
                                    <div className="font-mono text-lg">
                                        {faultState.active ? `⚠️ ${faultState.type.replace(/_/g, ' ')}` : '✅ No Active Faults'}
                                    </div>
                                    {faultState.active && (
                                        <div className="text-xs text-slate-400 mt-1">
                                            Affecting: Lift {faultState.affectedLift} | Severity: {faultState.severity.toFixed(0)}%
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Graphs in component mode */}
                            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-2">
                                <TelemetryGraphs data={graphData} />
                            </div>
                        </div>

                        {/* Right: AI Suggestions */}
                        <div className="overflow-y-auto">
                            <AISuggestionsPanel suggestions={aiSuggestions} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IndustrialSimulatorView;

