/**
 * Industrial Telemetry Dashboard
 * 
 * Professional engineering simulator UI with:
 * - Overview Mode (all elevators)
 * - Detail Mode (single elevator deep dive)
 * - Component Mode (motor/brake inspection)
 * 
 * @module components/TelemetryDashboard
 */

import React, { useState } from 'react';
import {
    AdvancedTelemetry,
    MotorState,
    MechanicalState,
    ElectricalState,
} from '../engine/PhysicsEngine';
import { Alert, MaintenanceIndicator } from '../engine/AlertEngine';
import {
    Activity,
    Thermometer,
    Zap,
    AlertTriangle,
    Settings,
    BarChart3,
    Gauge,
    Cable,
    CircleDot,
    TrendingUp,
    TrendingDown,
    Minus,
    ChevronRight,
} from 'lucide-react';

// ============== TYPES ==============

export type DashboardMode = 'OVERVIEW' | 'DETAIL' | 'COMPONENT';

interface TelemetryDashboardProps {
    liftATelemetry: AdvancedTelemetry;
    liftBTelemetry: AdvancedTelemetry;
    alerts: Alert[];
    maintenanceIndicators: MaintenanceIndicator[];
    selectedLift: 'A' | 'B';
    onSelectLift: (lift: 'A' | 'B') => void;
}

// ============== HELPER COMPONENTS ==============

/**
 * Metric card with value, unit, trend, and status
 */
const MetricCard: React.FC<{
    label: string;
    value: number;
    unit: string;
    precision?: number;
    trend?: 'up' | 'down' | 'stable';
    status?: 'normal' | 'warning' | 'critical';
    icon?: React.ReactNode;
    compact?: boolean;
}> = ({ label, value, unit, precision = 1, trend, status = 'normal', icon, compact }) => {
    const statusColors = {
        normal: 'text-cyan-400 border-cyan-500/30',
        warning: 'text-amber-400 border-amber-500/30',
        critical: 'text-red-400 border-red-500/30 animate-pulse',
    };

    const trendIcons = {
        up: <TrendingUp className="w-3 h-3 text-green-400" />,
        down: <TrendingDown className="w-3 h-3 text-red-400" />,
        stable: <Minus className="w-3 h-3 text-gray-500" />,
    };

    if (compact) {
        return (
            <div className={`bg-slate-800/50 border ${statusColors[status].split(' ')[1]} rounded px-2 py-1`}>
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400">{label}</span>
                    <span className={`text-sm font-mono font-bold ${statusColors[status].split(' ')[0]}`}>
                        {value.toFixed(precision)}<span className="text-xs ml-0.5 text-slate-500">{unit}</span>
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-slate-800/50 border ${statusColors[status].split(' ')[1]} rounded-lg p-3`}>
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    {icon && <span className="text-slate-500">{icon}</span>}
                    <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
                </div>
                {trend && trendIcons[trend]}
            </div>
            <div className={`text-2xl font-mono font-bold ${statusColors[status].split(' ')[0]}`}>
                {value.toFixed(precision)}
                <span className="text-sm ml-1 text-slate-500">{unit}</span>
            </div>
        </div>
    );
};

/**
 * Progress bar with gradient
 */
const ProgressBar: React.FC<{
    value: number;
    max: number;
    label: string;
    unit?: string;
    warningThreshold?: number;
    criticalThreshold?: number;
}> = ({ value, max, label, unit = '%', warningThreshold = 70, criticalThreshold = 90 }) => {
    const percent = (value / max) * 100;
    const status = percent >= criticalThreshold ? 'critical' : percent >= warningThreshold ? 'warning' : 'normal';

    const colors = {
        normal: 'from-cyan-500 to-cyan-400',
        warning: 'from-amber-500 to-amber-400',
        critical: 'from-red-500 to-red-400',
    };

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="text-slate-400">{label}</span>
                <span className="font-mono text-slate-300">{value.toFixed(1)}{unit}</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                    className={`h-full bg-gradient-to-r ${colors[status]} transition-all duration-300`}
                    style={{ width: `${Math.min(100, percent)}%` }}
                />
            </div>
        </div>
    );
};

/**
 * Alert badge
 */
const AlertBadge: React.FC<{ alert: Alert }> = ({ alert }) => {
    const colors = {
        INFO: 'bg-blue-500/20 border-blue-500 text-blue-400',
        WARNING: 'bg-amber-500/20 border-amber-500 text-amber-400',
        CRITICAL: 'bg-red-500/20 border-red-500 text-red-400 animate-pulse',
    };

    return (
        <div className={`border rounded-lg p-3 ${colors[alert.level]}`}>
            <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm">{alert.title}</div>
                    <div className="text-xs opacity-80 mt-0.5">{alert.message}</div>
                    <div className="text-xs mt-1 text-slate-400">{alert.suggestion}</div>
                </div>
                <span className="text-xs font-mono bg-black/30 px-1.5 py-0.5 rounded">{alert.code}</span>
            </div>
        </div>
    );
};

// ============== SECTION COMPONENTS ==============

/**
 * Motor telemetry section
 */
const MotorSection: React.FC<{ motor: MotorState }> = ({ motor }) => {
    const tempStatus = motor.temperature >= 90 ? 'critical' : motor.temperature >= 75 ? 'warning' : 'normal';
    const vibStatus = motor.vibration >= 7 ? 'critical' : motor.vibration >= 4.5 ? 'warning' : 'normal';

    return (
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Motor System</h3>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <MetricCard label="RPM" value={motor.rpm} unit="rpm" precision={0} icon={<Gauge className="w-4 h-4" />} />
                <MetricCard label="Torque" value={motor.torque} unit="Nm" precision={1} icon={<Activity className="w-4 h-4" />} />
                <MetricCard label="Power" value={motor.power} unit="kW" precision={2} icon={<Zap className="w-4 h-4" />} />
                <MetricCard label="Efficiency" value={motor.efficiency} unit="%" precision={1} status={motor.efficiency < 80 ? 'warning' : 'normal'} />
                <MetricCard label="Temperature" value={motor.temperature} unit="°C" precision={1} status={tempStatus} icon={<Thermometer className="w-4 h-4" />} />
                <MetricCard label="Vibration" value={motor.vibration} unit="mm/s" precision={2} status={vibStatus} icon={<Activity className="w-4 h-4" />} />
            </div>
        </div>
    );
};

/**
 * Mechanical system section
 */
const MechanicalSection: React.FC<{ mechanical: MechanicalState }> = ({ mechanical }) => {
    const brakeStatus = mechanical.brakeWear >= 90 ? 'critical' : mechanical.brakeWear >= 70 ? 'warning' : 'normal';
    const tensionStatus = mechanical.tensionImbalance >= 15 ? 'critical' : mechanical.tensionImbalance >= 8 ? 'warning' : 'normal';

    return (
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
                <Cable className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Mechanical System</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <MetricCard label="Sheave Speed" value={mechanical.sheaveSpeed} unit="RPM" precision={0} />
                <MetricCard label="CW Ratio" value={mechanical.counterweightRatio} unit="" precision={2} />
            </div>

            <div className="space-y-3">
                <ProgressBar
                    label="Brake Wear"
                    value={mechanical.brakeWear}
                    max={100}
                    warningThreshold={70}
                    criticalThreshold={90}
                />
                <ProgressBar
                    label="Brake Temperature"
                    value={mechanical.brakeTemperature}
                    max={200}
                    unit="°C"
                    warningThreshold={50}
                    criticalThreshold={75}
                />
            </div>

            <div className="mt-4">
                <div className="text-xs text-slate-400 mb-2">Cable Tensions (kN)</div>
                <div className="grid grid-cols-6 gap-1">
                    {mechanical.cableTensions.map((tension, i) => (
                        <div key={i} className="bg-slate-800 rounded px-1.5 py-1 text-center">
                            <div className="text-xs text-slate-500">R{i + 1}</div>
                            <div className="text-sm font-mono text-cyan-400">{tension.toFixed(1)}</div>
                        </div>
                    ))}
                </div>
                <MetricCard
                    label="Tension Imbalance"
                    value={mechanical.tensionImbalance}
                    unit="%"
                    status={tensionStatus}
                    compact
                />
            </div>
        </div>
    );
};

/**
 * Electrical system section
 */
const ElectricalSection: React.FC<{ electrical: ElectricalState }> = ({ electrical }) => {
    return (
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Electrical System</h3>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <MetricCard label="Voltage" value={electrical.voltage} unit="V" precision={0} />
                <MetricCard label="Current" value={electrical.current} unit="A" precision={1} />
                <MetricCard label="Power Factor" value={electrical.powerFactor} unit="" precision={2} status={electrical.powerFactor < 0.75 ? 'warning' : 'normal'} />
                <MetricCard label="Active Power" value={electrical.activePower} unit="kW" precision={2} />
                <MetricCard label="Reactive Power" value={electrical.reactivePower} unit="kVAR" precision={1} />
                <MetricCard
                    label="Regeneration"
                    value={electrical.regeneration}
                    unit="kW"
                    precision={2}
                    status={electrical.regeneration > 0 ? 'normal' : 'normal'}
                />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Total Energy</div>
                    <div className="text-xl font-mono font-bold text-cyan-400">
                        {electrical.totalEnergy.toFixed(2)} <span className="text-sm text-slate-500">kWh</span>
                    </div>
                </div>
                <div className="bg-slate-800/50 border border-emerald-600/30 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">Regenerated</div>
                    <div className="text-xl font-mono font-bold text-emerald-400">
                        {electrical.totalRegenerated.toFixed(2)} <span className="text-sm text-slate-500">kWh</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Maintenance indicators panel
 */
const MaintenancePanel: React.FC<{ indicators: MaintenanceIndicator[] }> = ({ indicators }) => {
    const priorityColors = {
        LOW: 'bg-slate-700 text-slate-300',
        MEDIUM: 'bg-blue-900/50 text-blue-400',
        HIGH: 'bg-amber-900/50 text-amber-400',
        URGENT: 'bg-red-900/50 text-red-400 animate-pulse',
    };

    return (
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white">Predictive Maintenance</h3>
            </div>

            <div className="space-y-3">
                {indicators.map((ind, i) => (
                    <div key={i} className="bg-slate-800/50 border border-slate-600 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-white">{ind.component}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[ind.priority]}`}>
                                {ind.priority}
                            </span>
                        </div>
                        <ProgressBar label="Health" value={ind.healthPercent} max={100} />
                        <div className="mt-2 flex justify-between text-xs text-slate-400">
                            <span>Life: {ind.estimatedLifeRemaining}</span>
                            <span>{ind.nextServiceDate}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============== MAIN DASHBOARD ==============

/**
 * Main Telemetry Dashboard Component
 */
export const TelemetryDashboard: React.FC<TelemetryDashboardProps> = ({
    liftATelemetry,
    liftBTelemetry,
    alerts,
    maintenanceIndicators,
    selectedLift,
    onSelectLift,
}) => {
    const [mode, setMode] = useState<DashboardMode>('DETAIL');
    const currentTelemetry = selectedLift === 'A' ? liftATelemetry : liftBTelemetry;

    return (
        <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-slate-800 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                            TELEMETRY
                        </h2>

                        {/* Mode Tabs */}
                        <div className="flex bg-slate-800 rounded-lg p-1">
                            {(['OVERVIEW', 'DETAIL', 'COMPONENT'] as DashboardMode[]).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMode(m)}
                                    className={`px-3 py-1 text-xs font-medium rounded transition-all ${mode === m
                                            ? 'bg-cyan-600 text-white'
                                            : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Lift Selector */}
                    <div className="flex items-center gap-2">
                        {(['A', 'B'] as const).map((lift) => (
                            <button
                                key={lift}
                                onClick={() => onSelectLift(lift)}
                                className={`px-4 py-1.5 rounded-lg font-bold text-sm transition-all ${selectedLift === lift
                                        ? lift === 'A'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-emerald-600 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:text-white'
                                    }`}
                            >
                                LIFT {lift}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {mode === 'DETAIL' && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <MotorSection motor={currentTelemetry.motor} />
                        <MechanicalSection mechanical={currentTelemetry.mechanical} />
                        <ElectricalSection electrical={currentTelemetry.electrical} />
                        <MaintenancePanel indicators={maintenanceIndicators} />
                    </div>
                )}

                {mode === 'OVERVIEW' && (
                    <div className="grid grid-cols-2 gap-4">
                        {/* Lift A Summary */}
                        <div className="bg-slate-900/50 border border-blue-500/30 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <CircleDot className="w-5 h-5 text-blue-400" />
                                <h3 className="text-lg font-bold text-blue-400">LIFT A</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <MetricCard label="RPM" value={liftATelemetry.motor.rpm} unit="" precision={0} compact />
                                <MetricCard label="Power" value={liftATelemetry.motor.power} unit="kW" compact />
                                <MetricCard label="Temp" value={liftATelemetry.motor.temperature} unit="°C" compact />
                            </div>
                        </div>

                        {/* Lift B Summary */}
                        <div className="bg-slate-900/50 border border-emerald-500/30 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <CircleDot className="w-5 h-5 text-emerald-400" />
                                <h3 className="text-lg font-bold text-emerald-400">LIFT B</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <MetricCard label="RPM" value={liftBTelemetry.motor.rpm} unit="" precision={0} compact />
                                <MetricCard label="Power" value={liftBTelemetry.motor.power} unit="kW" compact />
                                <MetricCard label="Temp" value={liftBTelemetry.motor.temperature} unit="°C" compact />
                            </div>
                        </div>
                    </div>
                )}

                {/* Alerts Panel */}
                {alerts.length > 0 && (
                    <div className="mt-4">
                        <h3 className="text-sm font-bold text-slate-400 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            ACTIVE ALERTS ({alerts.length})
                        </h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {alerts.map((alert) => (
                                <AlertBadge key={alert.id} alert={alert} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TelemetryDashboard;
