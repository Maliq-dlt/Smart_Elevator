
import React, { useState } from 'react';
import { FileText, UserPlus, Filter } from 'lucide-react';
import { LogEntry, SystemMode } from '../../types/index';

interface NarrativeLog {
    id: string;
    text: string;
    timestamp: string;
}

interface Props {
    narrativeHistory: NarrativeLog[];
    narrativeEndRef: React.RefObject<HTMLDivElement>;
    logs: LogEntry[];
    systemMode: SystemMode;
    useAI: boolean;
    generateReport: () => void;
    analysisReport: string | null;
    customPax: any;
    setCustomPax: (p: any) => void;
    handleInjectPassenger: () => void;
}

type LogFilter = 'ALL' | 'ERROR' | 'WARNING' | 'INFO' | 'SYSTEM';

export const LogConsole: React.FC<Props> = ({
    narrativeHistory, narrativeEndRef, logs, systemMode, useAI,
    generateReport, analysisReport, customPax, setCustomPax, handleInjectPassenger
}) => {
    const [logFilter, setLogFilter] = useState<LogFilter>('ALL');

    const filteredLogs = logFilter === 'ALL'
        ? logs
        : logs.filter(log => log.type === logFilter);

    const filterBtnClass = (filter: LogFilter) =>
        `px-2 py-1 rounded text-[10px] font-bold transition-colors ${logFilter === filter
            ? 'bg-blue-600 text-white'
            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
        }`;

    return (
        <div className="lg:col-span-5 space-y-6 flex flex-col h-full">
            <div className={`border rounded-xl shadow-lg transition-colors duration-500 flex flex-col h-[250px] overflow-hidden ${systemMode === 'NORMAL' ? 'bg-slate-900 border-indigo-500/30 shadow-indigo-900/10' : 'bg-red-950/30 border-red-500/50 shadow-red-900/20'}`}>
                <div className="p-4 border-b border-inherit bg-inherit flex justify-between items-center z-10">
                    <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${systemMode === 'NORMAL' ? 'text-indigo-400' : 'text-red-400 animate-pulse'}`}>
                        <span className={`w-2 h-2 rounded-full animate-ping ${systemMode === 'NORMAL' ? 'bg-indigo-500' : 'bg-red-500'}`} />
                        SKENARIO SYSTEM {useAI ? '(AI ON)' : '(MANUAL)'}
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
                    {narrativeHistory.map((log) => (
                        <div key={log.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <span className="text-[10px] text-slate-500 font-mono block mb-1 opacity-70">{log.timestamp}</span>
                            <div className="font-mono text-sm leading-relaxed text-slate-300 border-l-2 border-slate-700 pl-3">{log.text}</div>
                        </div>
                    ))}
                    <div ref={narrativeEndRef} />
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-xl flex-1 flex flex-col overflow-hidden max-h-[300px]">
                <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center gap-2">
                    <h2 className="font-semibold text-slate-300 flex items-center gap-2">
                        <Filter size={14} /> Log Sistem
                    </h2>
                    <div className="flex gap-1">
                        <button onClick={() => setLogFilter('ALL')} className={filterBtnClass('ALL')}>ALL</button>
                        <button onClick={() => setLogFilter('ERROR')} className={filterBtnClass('ERROR')}>ERROR</button>
                        <button onClick={() => setLogFilter('WARNING')} className={filterBtnClass('WARNING')}>WARN</button>
                        <button onClick={() => setLogFilter('INFO')} className={filterBtnClass('INFO')}>INFO</button>
                        <button onClick={() => setLogFilter('SYSTEM')} className={filterBtnClass('SYSTEM')}>SYS</button>
                    </div>
                    <span className="text-xs text-slate-500">{filteredLogs.length}/{logs.length}</span>
                </div>
                <div className="overflow-y-auto p-4 space-y-2 flex-1 font-mono text-xs">
                    {filteredLogs.map((log) => (
                        <div key={log.id} className={`flex gap-3 pb-2 border-b border-slate-800 last:border-0 ${log.type === 'WARNING' ? 'text-yellow-400' : log.type === 'ERROR' ? 'text-red-400 font-bold' : log.type === 'AI_NARRATIVE' ? 'text-cyan-400 italic' : log.type === 'SYSTEM' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}>
                            <span className="opacity-50 shrink-0">{log.timestamp.toLocaleTimeString()}</span>
                            <span className="text-[10px] px-1 py-0.5 rounded bg-slate-800 shrink-0">{log.type}</span>
                            <span>{log.message}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                <button onClick={generateReport} className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 py-2 rounded transition-colors text-sm">
                    <FileText size={16} /> Generate Analisis
                </button>
                {analysisReport && (
                    <div className="mt-4 p-4 bg-slate-950 rounded border border-slate-800 text-xs font-mono whitespace-pre-wrap max-h-[200px] overflow-y-auto">{analysisReport}</div>
                )}
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2"><UserPlus size={16} className="text-blue-400" /> Injeksi Penumpang Manual</h3>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-[10px] uppercase text-slate-500 block font-bold mb-1">Nama</label><input type="text" value={customPax.name} onChange={e => setCustomPax({ ...customPax, name: e.target.value })} className="w-full bg-slate-800 p-2 border border-slate-600 rounded text-xs outline-none text-white" /></div>
                        <div><label className="text-[10px] uppercase text-slate-500 block font-bold mb-1">Berat (kg)</label><input type="number" value={customPax.weight} onChange={e => setCustomPax({ ...customPax, weight: Number(e.target.value) })} className="w-full bg-slate-800 p-2 border border-slate-600 rounded text-xs outline-none text-white" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div><label className="text-[10px] uppercase text-slate-500 block font-bold mb-1">Asal</label><select value={customPax.start} onChange={e => setCustomPax({ ...customPax, start: Number(e.target.value) })} className="w-full bg-slate-800 p-2 border border-slate-600 rounded text-xs outline-none text-white">{[1, 2, 3].map(f => <option key={f} value={f}>L{f}</option>)}</select></div>
                        <div><label className="text-[10px] uppercase text-slate-500 block font-bold mb-1">Tujuan</label><select value={customPax.dest} onChange={e => setCustomPax({ ...customPax, dest: Number(e.target.value) })} className="w-full bg-slate-800 p-2 border border-slate-600 rounded text-xs outline-none text-white">{[1, 2, 3].map(f => <option key={f} value={f}>L{f}</option>)}</select></div>
                        <div><label className="text-[10px] uppercase text-slate-500 block font-bold mb-1">Delay (s)</label><input type="number" value={customPax.delay} onChange={e => setCustomPax({ ...customPax, delay: Number(e.target.value) })} className="w-full bg-slate-800 p-2 border border-slate-600 rounded text-xs outline-none text-white" /></div>
                    </div>
                    <button onClick={handleInjectPassenger} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded text-xs transition-colors flex items-center justify-center gap-2"><UserPlus size={14} /> Tambah Penumpang</button>
                </div>
            </div>
        </div>
    );
};
