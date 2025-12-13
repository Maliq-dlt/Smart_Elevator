import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Activity, Zap, X, BookOpen, GitBranch, Cpu, Users, Wifi } from 'lucide-react';

interface Props {
    onStart: () => void;
}

type Section = 'DOCS' | 'LOGIC' | 'STATUS' | null;

interface Point {
    x: number;
    y: number;
    age: number;
    size: number;
    id: number;
}

export const LandingPage: React.FC<Props> = ({ onStart }) => {
    const [activeSection, setActiveSection] = useState<Section>(null);
    const [trail, setTrail] = useState<Point[]>([]);

    // Refs for physics loop
    const mouse = useRef({ x: 0, y: 0 });
    const smoothedMouse = useRef({ x: 0, y: 0 });
    const pointsRef = useRef<Point[]>([]);
    const frameRef = useRef<number>(0);
    const lastPointTime = useRef<number>(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        mouse.current = { x: e.pageX, y: e.pageY };
    };

    useEffect(() => {
        // Initialize
        mouse.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        smoothedMouse.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        const loop = () => {
            // 1. Smooth Physics (LERP) - Increased speed (0.25) to reduce drag feeling
            smoothedMouse.current.x += (mouse.current.x - smoothedMouse.current.x) * 0.25;
            smoothedMouse.current.y += (mouse.current.y - smoothedMouse.current.y) * 0.25;

            const x = smoothedMouse.current.x;
            const y = smoothedMouse.current.y;
            const now = Date.now();

            // 2. Add new points to trail
            const dx = x - (pointsRef.current[pointsRef.current.length - 1]?.x || 0);
            const dy = y - (pointsRef.current[pointsRef.current.length - 1]?.y || 0);
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Spawn thresholds
            if (dist > 4 || (now - lastPointTime.current > 40 && dist > 1)) {
                pointsRef.current.push({
                    x,
                    y,
                    age: 0,
                    size: Math.random() * 15 + 45, // Slightly smaller base size
                    id: Math.random()
                });
                lastPointTime.current = now;
            }

            // 3. Update existing points
            pointsRef.current = pointsRef.current
                .map(p => ({ ...p, age: p.age + 1 }))
                .filter(p => p.age < 25); // Shorter lifespan for snappier feel

            setTrail([...pointsRef.current]);
            frameRef.current = requestAnimationFrame(loop);
        };

        frameRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameRef.current);
    }, []);

    const renderOverlayContent = () => {
        if (!activeSection) return null;

        const content = {
            DOCS: {
                title: "System Documentation",
                icon: <BookOpen className="text-blue-400" />,
                text: (
                    <div className="space-y-4 text-slate-300">
                        <p>The <strong>Smart Elevator Simulator</strong> allows users to model complex vertical transportation scenarios using real-world physics and constraints.</p>
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                            <li><strong className="text-white">Input:</strong> Configure passenger loads, arrival times, and lift starting positions.</li>
                            <li><strong className="text-white">Process:</strong> The system uses a simulation loop (Tick Rate: 50ms) to update lift physics, door states, and passenger queues.</li>
                            <li><strong className="text-white">Output:</strong> Real-time visualization, energy consumption logs, and AI-generated efficiency reports.</li>
                        </ul>
                    </div>
                )
            },
            LOGIC: {
                title: "FSA & SCAN Algorithm",
                icon: <GitBranch className="text-indigo-400" />,
                text: (
                    <div className="space-y-4 text-slate-300">
                        <p>The elevators operate on a <strong>Finite State Automaton (FSA)</strong> combined with a modified <strong>SCAN (Elevator) Algorithm</strong>.</p>
                        <div className="bg-slate-900/50 p-3 rounded border border-slate-700 font-mono text-xs">
                            {"State: IDLE -> MOVING -> DOOR_OPENING -> OPEN -> CLOSING"}
                        </div>
                        <p className="text-sm">
                            <strong>Decision Logic:</strong>
                            <br />1. Check current direction preference.
                            <br />2. Service requests in current direction.
                            <br />3. If no requests ahead, reverse direction.
                            <br />4. Idle if no requests exist globally.
                        </p>
                    </div>
                )
            },
            STATUS: {
                title: "System Status Check",
                icon: <Cpu className="text-green-400" />,
                text: (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-800 rounded border border-slate-700">
                            <span className="text-slate-400">Server Status</span>
                            <span className="text-green-400 font-bold flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> ONLINE
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-800 rounded border border-slate-700">
                            <span className="text-slate-400">Gemini AI API</span>
                            <span className="text-blue-400 font-bold">CONNECTED</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-800 rounded border border-slate-700">
                            <span className="text-slate-400">Simulation Engine</span>
                            <span className="text-white font-mono">v2.1.0-stable</span>
                        </div>
                    </div>
                )
            }
        }[activeSection];

        return (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100">
                    <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            {content.icon}
                            {content.title}
                        </h3>
                        <button
                            onClick={() => setActiveSection(null)}
                            className="p-1 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-6 bg-slate-900/90">
                        {content.text}
                    </div>
                    <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
                        <button
                            onClick={() => setActiveSection(null)}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-medium rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div
            className="min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30 overflow-hidden relative flex flex-col"
            onMouseMove={handleMouseMove}
        >

            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-blue-400/10 rounded-full blur-[80px]" />
                <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px]" />
            </div>

            {/* Fluid Water Stream Layer */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
                {trail.map((p, i) => {
                    // Calculate opacity and scale based on age
                    const life = 1 - (p.age / 25); // 1.0 to 0.0
                    const scale = 1 + (p.age * 0.03);

                    return (
                        <div
                            key={p.id}
                            className="absolute rounded-full"
                            style={{
                                left: p.x,
                                top: p.y,
                                width: `${p.size}px`,
                                height: `${p.size}px`,
                                transform: `translate(-50%, -50%) scale(${scale})`,
                                opacity: life * 0.5, // Reduced opacity
                                // Pure distortion effect, no solid color
                                backdropFilter: 'blur(5px)',
                                background: 'rgba(255, 255, 255, 0.02)', // Nearly invisible fill
                                boxShadow: 'inset 0 0 10px rgba(255,255,255,0.1)', // Subtle edge
                                zIndex: 1000 + i
                            }}
                        />
                    );
                })}
            </div>

            {/* Cursor Head - Instant follow (Raw Mouse Position) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
                <div
                    className="absolute rounded-full"
                    style={{
                        left: mouse.current.x, // DIRECT MOUSE MAPPING (No Delay)
                        top: mouse.current.y,
                        width: '40px',
                        height: '40px',
                        transform: 'translate(-50%, -50%)',
                        backdropFilter: 'blur(3px) brightness(1.2)', // Brightens the area slightly
                        background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
                        boxShadow: '0 0 15px rgba(255,255,255,0.05)',
                    }}
                />
            </div>

            {/* Navbar */}
            <nav className="relative z-20 flex items-center justify-between px-6 md:px-8 py-6 max-w-7xl mx-auto w-full">
                <div className="text-xl font-bold tracking-tighter flex items-center gap-2 cursor-pointer" onClick={() => setActiveSection(null)}>
                    <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <span className="font-mono text-white">E</span>
                    </div>
                    <span>Elevate<span className="text-slate-500">Sim</span></span>
                </div>
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                    <button
                        onClick={() => setActiveSection('DOCS')}
                        className={`transition-colors ${activeSection === 'DOCS' ? 'text-white font-bold' : 'hover:text-white'}`}
                    >
                        Documentation
                    </button>
                    <button
                        onClick={() => setActiveSection('LOGIC')}
                        className={`transition-colors ${activeSection === 'LOGIC' ? 'text-white font-bold' : 'hover:text-white'}`}
                    >
                        FSA Logic
                    </button>
                    <button
                        onClick={() => setActiveSection('STATUS')}
                        className={`transition-colors ${activeSection === 'STATUS' ? 'text-white font-bold' : 'hover:text-white'}`}
                    >
                        System Status
                    </button>
                </div>
                <button
                    onClick={onStart}
                    className="hidden md:block px-5 py-2 rounded-full border border-slate-700 hover:bg-slate-800 transition-all text-sm font-medium cursor-pointer"
                >
                    Launch Console
                </button>
            </nav>

            {/* Content Overlay */}
            {renderOverlayContent()}

            {/* Hero Section */}
            <main className={`relative z-10 flex flex-col items-center justify-center text-center mt-8 md:mt-16 px-4 flex-grow transition-opacity duration-300 ${activeSection ? 'opacity-30 blur-sm pointer-events-none' : 'opacity-100'}`}>

                {/* Main Title */}
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-5xl leading-tight">
                    Smart Elevator <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-white">
                        Simulation System
                    </span>
                </h1>

                <p className="text-slate-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
                    The Smart Elevator Simulation System provides an intelligent, algorithm-driven simulation to optimize efficiency, comfort, and decision-making in modern vertical transportation.
                </p>

                {/* CTA Button */}
                <button
                    onClick={onStart}
                    className="group relative px-8 py-4 bg-white text-slate-950 rounded-full font-bold text-lg hover:bg-slate-200 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] flex items-center gap-2 cursor-pointer"
                >
                    Initialize Simulation
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Central Animation Area */}
                <div className="relative w-full max-w-5xl h-[400px] md:h-[600px] mt-8 flex items-center justify-center">

                    {/* Main Animated Blob Container */}
                    <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">

                        {/* Water Ripples - Expanding Waves (Decoration) */}
                        <div className="absolute inset-0 border border-blue-400/30 rounded-full animate-morph animate-water-ripple" style={{ animationDelay: '0s' }}></div>
                        <div className="absolute inset-0 border border-cyan-400/20 rounded-full animate-morph animate-water-ripple" style={{ animationDelay: '1.5s' }}></div>

                        {/* Main Water Bubble */}
                        <div className="absolute inset-0 animate-morph bg-gradient-to-b from-blue-500/10 to-indigo-600/30 backdrop-blur-sm border border-white/20 shadow-[inset_0_0_40px_rgba(255,255,255,0.1),0_0_40px_rgba(59,130,246,0.3)] overflow-hidden z-10">
                            <div className="absolute top-[20%] left-[20%] w-[20%] h-[10%] bg-white/40 blur-md rounded-full transform -rotate-45" />
                            <div className="absolute bottom-[20%] right-[20%] w-[10%] h-[10%] bg-blue-400/20 blur-md rounded-full" />
                        </div>
                    </div>

                    {/* Floating Cards - 4 Cards Distributed */}

                    {/* Top Left: System Health */}
                    <div className="absolute top-0 left-4 md:left-20 animate-[float_6s_ease-in-out_infinite] z-20">
                        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 p-4 rounded-2xl shadow-xl flex items-center gap-4 w-56 md:w-60 hover:bg-slate-800/60 transition-colors">
                            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-400">
                                <Activity size={20} />
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">System Health</div>
                                <div className="text-xl font-bold font-mono">100% OK</div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Right: Efficiency */}
                    <div className="absolute bottom-0 right-4 md:right-20 animate-[float_7s_ease-in-out_infinite_reverse] delay-75 z-20">
                        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 p-4 rounded-2xl shadow-xl flex items-center gap-4 w-56 md:w-60 hover:bg-slate-800/60 transition-colors">
                            <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400">
                                <Zap size={20} />
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Efficiency</div>
                                <div className="text-xl font-bold font-mono">98.5%</div>
                            </div>
                        </div>
                    </div>

                    {/* Top Right: Active Users */}
                    <div className="absolute top-10 right-4 md:right-32 animate-[float_8s_ease-in-out_infinite] delay-150 z-20 hidden md:block">
                        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 p-4 rounded-2xl shadow-xl flex items-center gap-4 w-56 md:w-60 hover:bg-slate-800/60 transition-colors">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                                <Users size={20} />
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Active Load</div>
                                <div className="text-xl font-bold font-mono">24 Pax</div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Left: Latency */}
                    <div className="absolute bottom-10 left-4 md:left-32 animate-[float_9s_ease-in-out_infinite_reverse] delay-300 z-20 hidden md:block">
                        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 p-4 rounded-2xl shadow-xl flex items-center gap-4 w-56 md:w-60 hover:bg-slate-800/60 transition-colors">
                            <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400">
                                <Wifi size={20} />
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Network</div>
                                <div className="text-xl font-bold font-mono">12ms</div>
                            </div>
                        </div>
                    </div>

                </div>

            </main>

            {/* Footer Strip */}
            <footer className="w-full p-6 border-t border-slate-800/30 flex justify-between items-center text-xs text-slate-500 bg-slate-950/50 backdrop-blur z-20 mt-auto">
                <div className="flex gap-4">
                    <span>© 2024 ElevateSim Inc</span>
                </div>
                <div className="flex gap-4 items-center">
                    <span>Latency: <span className="text-green-500">12ms</span></span>
                </div>
            </footer>

            <style>{`
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
        }
        @keyframes morph {
            0% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
            50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
            100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
        }
        @keyframes water-ripple {
            0% { transform: scale(0.8); opacity: 0.6; }
            100% { transform: scale(2); opacity: 0; }
        }
        .animate-morph {
            animation: morph 8s ease-in-out infinite;
        }
        .animate-water-ripple {
            animation: water-ripple 4s linear infinite;
        }
      `}</style>
        </div>
    );
};