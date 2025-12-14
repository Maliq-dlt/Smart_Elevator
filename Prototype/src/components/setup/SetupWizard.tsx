import React from 'react';
import { Settings, ArrowUpRight, UserPlus, ChevronRight, FileText, BrainCircuit, Dice5, Play, Trash2, User, RefreshCw, XCircle } from 'lucide-react';
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
    
    const updatePassenger = (index: number, field: string, value: any) => {
        const newConfigs = [...passengerConfigs];
        newConfigs[index] = { ...newConfigs[index], [field]: value };
        setPassengerConfigs(newConfigs);
    };

    const removePassenger = (index: number) => {
        const newConfigs = passengerConfigs.filter((_, i) => i !== index);
        setPassengerConfigs(newConfigs);
        setPassengerCount(newConfigs.length);
    };

    const addPassenger = () => {
        const newPax = {
            id: Math.random().toString(36).substr(2, 9),
            name: `Penumpang ${passengerConfigs.length + 1}`,
            weight: 70,
            startFloor: 1,
            destinationFloor: 3,
            requestTime: 0
        };
        setPassengerConfigs([...passengerConfigs, newPax]);
        setPassengerCount(passengerConfigs.length + 1);
    };

    const clearPassengers = () => {
        setPassengerConfigs([]);
        setPassengerCount(0);
    }

    const randomizeRoutes = () => {
        const newConfigs = passengerConfigs.map(p => {
            const start = Math.floor(Math.random() * 3) + 1;
            let dest = Math.floor(Math.random() * 3) + 1;
            while(dest === start) dest = Math.floor(Math.random() * 3) + 1;
            return { ...p, startFloor: start, destinationFloor: dest };
        });
        setPassengerConfigs(newConfigs);
    }

    return (
        <div className="max-w-4xl mx-auto mt-10 p-6 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl font-sans">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
                <h2 className="text-2xl font-bold text-blue-400 tracking-tight flex items-center gap-2">
                    <Settings className="w-6 h-6" /> Setup Simulasi
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
                                <select value={configLiftA} onChange={e => setConfigLiftA(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-lg focus:ring-2 focus:ring-blue-500 outline-none text-white">
                                    {FLOORS.map(f => <option key={f} value={f}>Lantai {f}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-slate-400 mb-2 text-sm font-medium">Mulai Lift B</label>
                                <select value={configLiftB} onChange={e => setConfigLiftB(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-lg focus:ring-2 focus:ring-blue-500 outline-none text-white">
                                    {FLOORS.map(f => <option key={f} value={f}>Lantai {f}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><UserPlus size={18} className="text-blue-400" /> Estimasi Penumpang Awal</h3>
                        <p className="text-slate-400 text-sm mb-4">Geser slider untuk menentukan jumlah penumpang awal.</p>
                        <div className="flex items-center gap-4">
                            <input type="range" min="0" max="20" value={passengerCount} onChange={e => setPassengerCount(Number(e.target.value))} className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                            <span className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-600 font-mono text-xl font-bold w-16 text-center">{passengerCount}</span>
                        </div>
                    </div>

                    <button onClick={() => setStep('PASSENGERS')} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 text-white">Lanjut Konfigurasi Detail <ChevronRight /></button>
                </div>
            )}

            {step === 'PASSENGERS' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-end border-b border-slate-700 pb-2">
                         <div>
                            <h3 className="text-xl font-bold text-white">Daftar Penumpang</h3>
                            <p className="text-slate-400 text-sm">Tentukan jumlah, lokasi asal, dan tujuan setiap penumpang.</p>
                         </div>
                         <div className="flex gap-2">
                             {passengerConfigs.length > 0 && (
                                <>
                                    <button onClick={clearPassengers} className="bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-400 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors border border-slate-600 hover:border-red-500/50">
                                        <XCircle size={16} /> Hapus Semua
                                    </button>
                                    <button onClick={randomizeRoutes} className="bg-slate-800 hover:bg-indigo-900/50 text-slate-300 hover:text-indigo-400 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors border border-slate-600 hover:border-indigo-500/50">
                                        <RefreshCw size={16} /> Acak Rute
                                    </button>
                                </>
                             )}
                             <button onClick={addPassenger} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors shadow-lg shadow-emerald-900/20">
                                <UserPlus size={16} /> Tambah
                             </button>
                         </div>
                    </div>

                    <div className="max-h-[450px] overflow-y-auto space-y-3 pr-2 custom-scrollbar bg-slate-900/50 rounded-lg">
                        {passengerConfigs.map((p, idx) => (
                            <div key={idx} className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-colors group relative">
                                <button onClick={() => removePassenger(idx)} className="absolute top-4 right-4 text-slate-600 hover:text-red-400 transition-colors bg-slate-900 p-1.5 rounded-full border border-slate-700" title="Hapus Penumpang">
                                    <Trash2 size={14} />
                                </button>
                                
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold border border-slate-600 shadow-inner">
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <input 
                                            type="text" 
                                            value={p.name} 
                                            onChange={e => updatePassenger(idx, 'name', e.target.value)} 
                                            className="bg-transparent border-b border-dashed border-slate-600 focus:border-blue-500 outline-none text-white font-bold w-40 placeholder-slate-600 text-base"
                                            placeholder="Nama Penumpang"
                                        />
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-slate-500 uppercase font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">Rute Perjalanan</span>
                                            <div className="flex items-center gap-1 text-xs font-mono font-bold">
                                                <span className="text-blue-400">L{p.startFloor}</span>
                                                <ArrowUpRight size={12} className="text-slate-500" />
                                                <span className="text-emerald-400">L{p.destinationFloor}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                                    <div className="flex flex-col">
                                        <label className="text-[10px] uppercase text-slate-500 font-bold mb-1">Mulai Dari</label>
                                        <select value={p.startFloor} onChange={e => updatePassenger(idx, 'startFloor', Number(e.target.value))} className="bg-slate-800 border border-slate-600 rounded p-1.5 text-sm outline-none text-white focus:border-blue-500">
                                            {FLOORS.map(f => <option key={f} value={f}>Lantai {f}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-[10px] uppercase text-slate-500 font-bold mb-1">Tujuan Ke</label>
                                        <select value={p.destinationFloor} onChange={e => updatePassenger(idx, 'destinationFloor', Number(e.target.value))} className="bg-slate-800 border border-slate-600 rounded p-1.5 text-sm outline-none text-white focus:border-blue-500">
                                            {FLOORS.map(f => <option key={f} value={f}>Lantai {f}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-[10px] uppercase text-slate-500 font-bold mb-1">Berat (Kg)</label>
                                        <input type="number" value={p.weight} onChange={e => updatePassenger(idx, 'weight', Number(e.target.value))} className="bg-slate-800 border border-slate-600 rounded p-1.5 text-sm outline-none text-white focus:border-blue-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-[10px] uppercase text-slate-500 font-bold mb-1">Waktu (detik)</label>
                                        <input type="number" value={p.requestTime} onChange={e => updatePassenger(idx, 'requestTime', Number(e.target.value))} className="bg-slate-800 border border-slate-600 rounded p-1.5 text-sm outline-none text-white focus:border-blue-500" title="Waktu muncul setelah simulasi mulai" />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {passengerConfigs.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-500 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                                <UserPlus size={48} className="mb-4 opacity-20" />
                                <p className="font-medium">Belum ada penumpang.</p>
                                <p className="text-sm opacity-60">Klik "Tambah" untuk membuat penumpang baru.</p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button onClick={() => setStep('LIFTS')} className="px-6 py-3 border border-slate-600 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 font-medium">Kembali</button>
                        <button onClick={() => setStep('REVIEW')} disabled={passengerConfigs.length === 0} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed py-3 rounded-lg font-bold shadow-lg shadow-blue-900/20 text-white flex justify-center items-center gap-2">
                             Review & Jalankan <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {step === 'REVIEW' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><FileText size={18} className="text-blue-400" /> Ringkasan Skenario</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="bg-slate-800 text-slate-200 uppercase font-mono text-xs">
                                    <tr>
                                        <th className="px-4 py-3">Nama</th>
                                        <th className="px-4 py-3">Berat (kg)</th>
                                        <th className="px-4 py-3">Rute</th>
                                        <th className="px-4 py-3">Waktu Masuk</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {passengerConfigs.map((p, i) => (
                                        <tr key={i} className="hover:bg-slate-700/30">
                                            <td className="px-4 py-2 font-medium text-white">{p.name}</td>
                                            <td className="px-4 py-2">{p.weight}</td>
                                            <td className="px-4 py-2 flex items-center gap-2">
                                                <span className="bg-slate-700 px-1.5 rounded text-xs text-white">L{p.startFloor}</span> 
                                                <ArrowUpRight size={12} className="text-slate-500" />
                                                <span className="bg-blue-600 px-1.5 rounded text-xs text-white">L{p.destinationFloor}</span>
                                            </td>
                                            <td className="px-4 py-2">T+{p.requestTime}s</td>
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
                                    <p className="text-sm text-slate-400 max-w-md">{useAI ? "AI akan membuat skenario acak (Normal/Bencana) dan narasi dinamis." : "Simulasi berjalan Manual/Normal. Analisis menggunakan logika internal."}</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} className="sr-only peer" />
                                <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setStep('PASSENGERS')} className="px-6 py-3 border border-slate-600 rounded-xl hover:bg-slate-800 text-slate-300 transition-colors font-medium">Ubah Data</button>
                        <button onClick={startSimulation} disabled={loadingScenario} className={`flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-4 rounded-xl font-bold text-white shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all group ${loadingScenario ? 'opacity-50 cursor-wait' : ''}`}>
                            {loadingScenario ? 'MEMUAT SISTEM...' : (<><Play size={20} fill="currentColor" />{useAI ? 'MULAI SIMULASI (AI)' : 'MULAI SIMULASI (MANUAL)'}</>)}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};