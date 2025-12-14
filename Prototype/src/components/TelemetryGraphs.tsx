/**
 * Real-Time Telemetry Graphs
 * 
 * Animated charts for:
 * - Speed vs Time
 * - Torque vs Load
 * - Temperature Trend
 * - Power Consumption
 * - Cable Tension
 * 
 * @module components/TelemetryGraphs
 */

import React, { useMemo } from 'react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Legend,
} from 'recharts';
import { Activity, Thermometer, Zap, Cable, TrendingUp } from 'lucide-react';

// ============== TYPES ==============

export interface TelemetryDataPoint {
    timestamp: number;
    time: string;
    speed: number;
    torque: number;
    power: number;
    temperature: number;
    load: number;
    cableTensions: number[];
    regeneration: number;
}

interface TelemetryGraphsProps {
    data: TelemetryDataPoint[];
    maxDataPoints?: number;
}

// ============== GRAPH COMPONENTS ==============

/**
 * Speed vs Time chart
 */
const SpeedTimeChart: React.FC<{ data: TelemetryDataPoint[] }> = ({ data }) => {
    return (
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">Speed vs Time</h4>
            </div>
            <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                        dataKey="time"
                        stroke="#64748b"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        axisLine={{ stroke: '#334155' }}
                    />
                    <YAxis
                        stroke="#64748b"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        axisLine={{ stroke: '#334155' }}
                        domain={[-3, 3]}
                        tickFormatter={(v) => `${v} m/s`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            fontSize: '12px',
                        }}
                        labelStyle={{ color: '#94a3b8' }}
                    />
                    <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                    <Area
                        type="monotone"
                        dataKey="speed"
                        stroke="#00d4ff"
                        fill="url(#speedGradient)"
                        strokeWidth={2}
                        animationDuration={300}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

/**
 * Power consumption chart
 */
const PowerChart: React.FC<{ data: TelemetryDataPoint[] }> = ({ data }) => {
    return (
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-white">Power Consumption</h4>
            </div>
            <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="regenGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                        dataKey="time"
                        stroke="#64748b"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                    />
                    <YAxis
                        stroke="#64748b"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        tickFormatter={(v) => `${v} kW`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            fontSize: '12px',
                        }}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: '10px' }}
                        iconSize={8}
                    />
                    <Area
                        type="monotone"
                        dataKey="power"
                        name="Consumption"
                        stroke="#f59e0b"
                        fill="url(#powerGradient)"
                        strokeWidth={2}
                    />
                    <Area
                        type="monotone"
                        dataKey="regeneration"
                        name="Regeneration"
                        stroke="#10b981"
                        fill="url(#regenGradient)"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

/**
 * Temperature trend chart with warning zones
 */
const TemperatureChart: React.FC<{ data: TelemetryDataPoint[] }> = ({ data }) => {
    return (
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <Thermometer className="w-4 h-4 text-red-400" />
                <h4 className="text-sm font-bold text-white">Motor Temperature</h4>
            </div>
            <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                        dataKey="time"
                        stroke="#64748b"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                    />
                    <YAxis
                        stroke="#64748b"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        domain={[20, 100]}
                        tickFormatter={(v) => `${v}°C`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            fontSize: '12px',
                        }}
                    />
                    {/* Warning zone */}
                    <ReferenceLine y={75} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Warning', fontSize: 9, fill: '#f59e0b' }} />
                    <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Critical', fontSize: 9, fill: '#ef4444' }} />
                    <Area
                        type="monotone"
                        dataKey="temperature"
                        stroke="#ef4444"
                        fill="url(#tempGradient)"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

/**
 * Torque vs Load chart
 */
const TorqueLoadChart: React.FC<{ data: TelemetryDataPoint[] }> = ({ data }) => {
    return (
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-bold text-white">Torque vs Load</h4>
            </div>
            <ResponsiveContainer width="100%" height={150}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                        dataKey="time"
                        stroke="#64748b"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                    />
                    <YAxis
                        yAxisId="torque"
                        orientation="left"
                        stroke="#a855f7"
                        tick={{ fontSize: 10, fill: '#a855f7' }}
                        tickFormatter={(v) => `${v} Nm`}
                    />
                    <YAxis
                        yAxisId="load"
                        orientation="right"
                        stroke="#6366f1"
                        tick={{ fontSize: 10, fill: '#6366f1' }}
                        tickFormatter={(v) => `${v} kg`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            fontSize: '12px',
                        }}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: '10px' }}
                        iconSize={8}
                    />
                    <Line
                        yAxisId="torque"
                        type="monotone"
                        dataKey="torque"
                        name="Torque"
                        stroke="#a855f7"
                        strokeWidth={2}
                        dot={false}
                    />
                    <Line
                        yAxisId="load"
                        type="monotone"
                        dataKey="load"
                        name="Load"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

/**
 * Cable tension chart (multi-line)
 */
const CableTensionChart: React.FC<{ data: TelemetryDataPoint[] }> = ({ data }) => {
    // Transform data for multi-rope display
    const chartData = useMemo(() => {
        return data.map(d => ({
            time: d.time,
            R1: d.cableTensions[0] || 0,
            R2: d.cableTensions[1] || 0,
            R3: d.cableTensions[2] || 0,
            R4: d.cableTensions[3] || 0,
            R5: d.cableTensions[4] || 0,
            R6: d.cableTensions[5] || 0,
        }));
    }, [data]);

    const ropeColors = ['#00d4ff', '#00ff88', '#f59e0b', '#ef4444', '#a855f7', '#6366f1'];

    return (
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <Cable className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Cable Tension (6 Ropes)</h4>
            </div>
            <ResponsiveContainer width="100%" height={150}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                        dataKey="time"
                        stroke="#64748b"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                    />
                    <YAxis
                        stroke="#64748b"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        tickFormatter={(v) => `${v} kN`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            fontSize: '12px',
                        }}
                    />
                    {['R1', 'R2', 'R3', 'R4', 'R5', 'R6'].map((rope, i) => (
                        <Line
                            key={rope}
                            type="monotone"
                            dataKey={rope}
                            stroke={ropeColors[i]}
                            strokeWidth={1.5}
                            dot={false}
                            opacity={0.8}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

// ============== MAIN COMPONENT ==============

/**
 * Main Telemetry Graphs Component
 */
export const TelemetryGraphs: React.FC<TelemetryGraphsProps> = ({ data }) => {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-slate-500">
                <p>Collecting telemetry data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SpeedTimeChart data={data} />
                <PowerChart data={data} />
                <TemperatureChart data={data} />
                <TorqueLoadChart data={data} />
            </div>
            <CableTensionChart data={data} />
        </div>
    );
};

export default TelemetryGraphs;
