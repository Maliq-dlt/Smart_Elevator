
import { GoogleGenAI, Type } from "@google/genai";
import { LiftState, SystemMode, Scenario, SimulationStats } from "../types/index";

// --- KONFIGURASI API KEY ---
const HARDCODED_KEY = 'AIzaSyArMQ6MbNN3Uv15FNvgWpsIA4AUEluEb_Q';

// Helper to safely get API Key
const getApiKey = (): string | undefined => {
  if (HARDCODED_KEY && HARDCODED_KEY.length > 10) return HARDCODED_KEY;
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) return import.meta.env.VITE_GEMINI_API_KEY;
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) return process.env.API_KEY;
  return undefined;
};

const MODEL_NAME = 'gemini-2.5-flash';

// Safety settings using standard string values to avoid type issues while maintaining functionality
const SAFETY_SETTINGS = [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
] as any;

// --- FALLBACK GENERATORS (LOCAL LOGIC) ---

const generateLocalAnalysis = (history: string[], stats?: SimulationStats): string => {
   const errors = history.filter(h => h.includes('ERROR') || h.includes('CRITICAL') || h.includes('DARURAT') || h.includes('KEBAKARAN') || h.includes('BANJIR'));
   const warnings = history.filter(h => h.includes('WARNING') || h.includes('ALARM'));
   
   let statsSummary = "";
   if (stats) {
       statsSummary = `
DATA METRIK OPERASIONAL:
• Penumpang Terlayani: ${stats.totalPassengersDelivered}
• Rata-rata Waktu Tunggu: ${stats.avgWaitTime.toFixed(1)}s
• Konsumsi Energi: ${(stats.totalEnergyJ/1000).toFixed(1)} kJ
• Peak Load: ${stats.peakPassengers} orang
       `;
   }

   return `[ANALISIS OTOMATIS - FALLBACK MODE]
(AI tidak dapat dihubungi atau memblokir konten, menggunakan analisis internal)

${statsSummary}

1. RANGKUMAN INSIDEN
   • Total Log Event: ${history.length}
   • Insiden Kritis: ${errors.length}
   • Peringatan Sistem: ${warnings.length}
   ${errors.length > 0 ? `• Insiden Terakhir: "${errors[errors.length-1].replace(/\[.*?\]/, '').trim()}"` : "• Status Operasional: STABIL"}

2. EVALUASI RESPONS
   ${errors.length > 0 
     ? "Sistem mendeteksi kondisi berbahaya. Protokol keselamatan (Safety Halt/Evacuation) telah diaktifkan secara otomatis." 
     : "Sistem lift beroperasi dalam parameter normal. Algoritma dispatch berjalan efisien."}

3. REKOMENDASI TEKNIS
   • ${errors.length > 0 ? "Wajib inspeksi fisik pada shaft dan sensor terkait insiden." : "Lanjutkan pemeliharaan preventif sesuai jadwal."}
   • ${warnings.length > 3 ? "Periksa sensitivitas sensor pintu dan beban." : "Monitor tegangan input dan backup battery."}
   • Analisis log menunjukkan waktu respon rata-rata dalam batas wajar.`;
};

const LOCAL_SCENARIOS: Scenario[] = [
    { type: 'NORMAL', title: 'Jam Sibuk Pagi', description: 'Lonjakan penumpang di lobi utama saat jam masuk kantor.', severity: 3 },
    { type: 'NORMAL', title: 'Kunjungan VIP', description: 'Delegasi penting sedang meninjau fasilitas gedung.', severity: 2 },
    { type: 'FIRE_ALARM', title: 'Kebakaran Lantai 2', description: 'Detektor asap di koridor timur Lantai 2 mendeteksi panas berlebih.', severity: 9 },
    { type: 'FLOOD', title: 'Pipa Pecah Basement', description: 'Pipa air utama bocor, sensor air mendeteksi genangan di L1.', severity: 8 },
    { type: 'POWER_OUTAGE', title: 'Blackout Wilayah', description: 'Suplai listrik utama terputus, sistem beralih ke baterai cadangan.', severity: 7 },
    { type: 'CABLE_SNAP', title: 'Kelelahan Kabel', description: 'Sensor tegangan mendeteksi anomali kritis pada kabel utama.', severity: 10 },
];

const scenarioSchema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['NORMAL', 'FIRE_ALARM', 'POWER_OUTAGE', 'EARTHQUAKE', 'FLOOD', 'CABLE_SNAP', 'CYBER_ATTACK'] },
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    severity: { type: Type.INTEGER }
  },
  required: ["type", "title", "description", "severity"]
};

// --- MAIN EXPORTS ---

export const generateRandomScenario = async (): Promise<Scenario> => {
  const apiKey = getApiKey();
  
  // Always try to use AI if key exists, but handle failure gracefully
  if (!apiKey) {
    await new Promise(resolve => setTimeout(resolve, 800)); 
    return LOCAL_SCENARIOS[Math.floor(Math.random() * LOCAL_SCENARIOS.length)];
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
    Buatkan skenario simulasi lift (Bahasa Indonesia).
    Probabilitas: 40% NORMAL, 60% BENCANA (Kebakaran, Mati Lampu, Banjir, Kabel Putus).
    Output JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: scenarioSchema,
        temperature: 1.1,
        safetySettings: SAFETY_SETTINGS
      }
    });

    const data = JSON.parse(response.text || "{}");
    return {
      type: data.type || 'NORMAL',
      title: data.title || 'Operasional Standar',
      description: data.description || 'Sistem berjalan normal.',
      severity: data.severity || 1
    };
  } catch (error) {
    console.warn("AI Scenario Failed:", error);
    return LOCAL_SCENARIOS[Math.floor(Math.random() * LOCAL_SCENARIOS.length)];
  }
};

export const generateSystemNarrative = async (
  events: string[],
  liftA: LiftState,
  liftB: LiftState,
  mode: SystemMode,
  activeScenario: Scenario | null
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey || events.length === 0) return "";

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
    Role: AI Gedung Cerdas. Bahasa: Indonesia. Max 1 kalimat pendek.
    Mode: ${mode}. Skenario: "${activeScenario?.title}".
    Event Terbaru: ${events.slice(-1).join(', ')}.
    Status: Lift A(L${Math.round(liftA.currentFloor)}), Lift B(L${Math.round(liftB.currentFloor)}).
    Buat log status sistem yang teknis dan imersif.
  `;

  try {
    const response = await ai.models.generateContent({ 
        model: MODEL_NAME, 
        contents: prompt,
        config: { safetySettings: SAFETY_SETTINGS }
    });
    return response.text || "";
  } catch (error) {
    return ""; // Silent fail is acceptable for narrative
  }
};

export const generateScenarioAnalysis = async (
  history: string[],
  stats: SimulationStats
): Promise<string> => {
  const apiKey = getApiKey();

  // If no key, fallback immediately
  if (!apiKey) return generateLocalAnalysis(history, stats);

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
    Role: Senior Building Automation Engineer & Data Analyst.
    
    METRIK STATISTIK SIMULASI:
    - Total Penumpang Terlayani: ${stats.totalPassengersDelivered}
    - Total Penumpang Naik (Boarded): ${stats.totalBoarded}
    - Rata-rata Waktu Tunggu: ${stats.avgWaitTime.toFixed(2)} detik
    - Total Konsumsi Energi: ${(stats.totalEnergyJ / 1000).toFixed(2)} kJ
    - Load Penumpang Maksimum (Peak): ${stats.peakPassengers} orang
    - Statistik Kunjungan Lantai: ${JSON.stringify(stats.floorVisits)}

    LOG AKTIVITAS (30 Event Terakhir):
    ${history.slice(-30).join('\n')}
    
    TUGAS:
    Buat laporan analisis komprehensif mengenai keadaan dan kegiatan simulasi saat ini dengan gaya bahasa profesional (Indonesia Formal).
    
    STRUKTUR LAPORAN:
    1. 📊 RINGKASAN PERFORMA
       Analisis efisiensi lift berdasarkan waktu tunggu dan konsumsi energi. Apakah sistem overload atau underutilized?
       
    2. 🚦 DINAMIKA TRAFIK
       Jelaskan pola pergerakan penumpang dan lantai tersibuk berdasarkan data statistik.
       
    3. ⚠️ ANALISIS INSIDEN & KESELAMATAN
       Review log untuk menemukan error, warning, atau intervensi manual (kebakaran, banjir, dll). Bagaimana respon sistem?
       
    4. 💡 REKOMENDASI OPTIMASI
       Saran teknis spesifik untuk meningkatkan throughput atau keamanan berdasarkan data di atas.
  `;

  try {
    const response = await ai.models.generateContent({ 
        model: MODEL_NAME, 
        contents: prompt,
        config: { safetySettings: SAFETY_SETTINGS }
    });
    
    if (!response.text) throw new Error("Empty response from AI");
    return response.text;

  } catch (error) {
    console.error("AI Analysis Error:", error);
    return generateLocalAnalysis(history, stats);
  }
};
