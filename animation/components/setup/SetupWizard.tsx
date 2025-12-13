
import React from 'react';
import { Settings, ArrowUpRight, UserPlus, ChevronRight, FileText, BrainCircuit, Dice5, Play } from 'lucide-react';
import { FLOORS, MOCK_NAMES } from '../../constants/index';

interface Props {
    step: 'LANDING' | 'LIFTS' | 'PASSENGERS' | 'REVIEW' | 'RUNNING';
    setStep: (s: any) => void;
    configLiftA: number;
    setConfigLiftA: (n: number) => void;
    configLiftB: number;
    setConfigLiftB: (n: number) => void;
    passengerCount: number;
    setPassengerCount: (n: number) => void;
    passengerConfigs: any[];
    setPassengerConfigs: (c: any[]) => void;
    useAI: boolean;
    setUseAI: (b: boolean) => void;
    handleQuickLaunch: () => void;
    startSimulation: () => void;
    loadingScenario: boolean;
}

export const SetupWizard: React.FC<Props> = ({ 
    step, setStep, configLiftA, setConfigLiftA, configLiftB, setConfigLiftB, 
    passengerCount, setPassengerCount, passengerConfigs, setPassengerConfigs, 
    useAI, setUseAI, handleQuickLaunch, startSimulation, loadingScenario 
}) => {
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
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-700">
                            <div><span className="text-xs text-slate-500 uppercase font-bold">Total Penumpang</span><div className="text-xl font-mono text-white">{passengerConfigs.length}</div></div>
                            <div><span className="text-xs text-slate-500 uppercase font-bold">Total Berat</span><div className="text-xl font-mono text-white">{passengerConfigs.reduce((a, b) => a + b.weight, 0)} kg</div></div>
                            <div><span className="text-xs text-slate-500 uppercase font-bold">Posisi Lift A</span><div className="text-xl font-mono text-white">Lantai {configLiftA}</div></div>
                            <div><span className="text-xs text-slate-500 uppercase font-bold">Posisi Lift B</span><div className="text-xl font-mono text-white">Lantai {configLiftB}</div></div>
                        </div>
                    </div>
                    <div className={`p-6 rounded-xl border transition-all ${useAI ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-slate-800/30 border-slate-700'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${useAI ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                    {useAI ? <BrainCircuit size={24} className="animate-pulse" /> : <Dice5 size={24} />}
                                </div>
                                <div>
                                    <h4 className={`font-bold text-lg ${useAI ? 'text-indigo-300' : 'text-slate-400'}`}>{useAI ? 'AI Skenario: AKTIF' : 'AI Skenario: NON-AKTIF'}</h4>
                                    <p className="text-sm text-slate-400 max-w-md">{useAI ? "AI akan membuat skenario acak (Normal/Bencana) dan narasi dinamis selama simulasi." : "Simulasi berjalan dalam mode Manual/Normal. Tidak ada kejadian acak dari AI."}</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} className="sr-only peer" />
                                <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setStep('PASSENGERS')} className="px-6 py-3 border border-slate-600 rounded-xl hover:bg-slate-800 text-slate-300 transition-colors">Ubah Data</button>
                        <button onClick={startSimulation} disabled={loadingScenario} className={`flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-4 rounded-xl font-bold text-white shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all group ${loadingScenario ? 'opacity-50 cursor-wait' : ''}`}>
                            {loadingScenario ? 'MEMUAT SISTEM...' : (<><Play size={20} fill="currentColor" />{useAI ? 'JALANKAN DENGAN AI' : 'JALANKAN MANUAL'}</>)}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
