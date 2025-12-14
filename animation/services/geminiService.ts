
import { GoogleGenAI, Type } from "@google/genai";
import { LiftState, SystemMode, Scenario } from "../types/index";

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

// Menggunakan String Literal agar lebih stabil di browser (menghindari masalah Enum import)
const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
] as any;

// --- FALLBACK GENERATORS (LOCAL LOGIC) ---
// Dipanggil jika AI gagal atau memblokir konten

const generateLocalAnalysis = (history: string[]): string => {
  const errors = history.filter(h => h.includes('ERROR') || h.includes('CRITICAL') || h.includes('DARURAT') || h.includes('KEBAKARAN') || h.includes('BANJIR'));
  const warnings = history.filter(h => h.includes('WARNING') || h.includes('ALARM'));
  const infos = history.filter(h => h.includes('INFO'));

  return `[ANALISIS OTOMATIS - FALLBACK MODE]
(AI tidak merespons, menggunakan analisis logika internal)

1. RANGKUMAN INSIDEN
   • Total Event: ${history.length}
   • Insiden Kritis: ${errors.length}
   • Peringatan: ${warnings.length}
   ${errors.length > 0 ? `• Insiden Terakhir: "${errors[errors.length - 1].replace(/\[.*?\]/, '').trim()}"` : "• Status: Operasional Stabil"}

2. EVALUASI RESPONS SISTEM
   ${errors.length > 0
      ? "Sistem mendeteksi anomali berbahaya. Protokol darurat (Emergency Halt/Evakuasi) tampaknya telah dipicu sesuai standar keselamatan."
      : "Lalu lintas penumpang dan pergerakan lift berjalan efisien tanpa gangguan berarti."}

3. REKOMENDASI TEKNIS
   • ${errors.length > 0 ? "Lakukan inspeksi fisik menyeluruh pada poros lift dan sensor keamanan." : "Pertahankan jadwal maintenance rutin."}
   • ${warnings.length > 5 ? "Optimalkan algoritma dispatching untuk mengurangi waktu tunggu." : "Monitor tegangan baterai cadangan secara berkala."}
   • Cek log detail untuk timestamp kejadian spesifik.`;
};

const LOCAL_SCENARIOS: Scenario[] = [
  { type: 'NORMAL', title: 'Jam Sibuk Pagi', description: 'Lonjakan penumpang di lobi utama saat jam masuk kantor.', severity: 3 },
  { type: 'NORMAL', title: 'Kunjungan VIP', description: 'Delegasi penting sedang meninjau fasilitas gedung.', severity: 2 },
  { type: 'FIRE_ALARM', title: 'Kebakaran Lantai 2', description: 'Detektor asap di koridor timur Lantai 2 mendeteksi panas.', severity: 9 },
  { type: 'FLOOD', title: 'Pipa Pecah Basement', description: 'Pipa air utama bocor, air menggenangi area bawah.', severity: 8 },
  { type: 'POWER_OUTAGE', title: 'Blackout Wilayah', description: 'Gardu listrik kota padam, beralih ke baterai.', severity: 7 },
  { type: 'CABLE_SNAP', title: 'Kelelahan Kabel', description: 'Sensor tegangan mendeteksi keretakan mikro pada kabel.', severity: 10 },
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
  // Fallback acak jika tanpa key
  if (!apiKey) {
    await new Promise(resolve => setTimeout(resolve, 500));
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
    console.warn("AI Scenario Failed, using local fallback.");
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
    Role: AI Gedung. Bahasa: Indonesia. Max 1 kalimat.
    Mode: ${mode}. Skenario: "${activeScenario?.title}".
    Event: ${events.slice(-1).join(', ')}.
    Status: A(L${Math.round(liftA.currentFloor)}), B(L${Math.round(liftB.currentFloor)}).
    Berikan update status log singkat & teknis.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { safetySettings: SAFETY_SETTINGS }
    });
    return response.text || "";
  } catch (error) {
    return ""; // Silent fail
  }
};

export const generateScenarioAnalysis = async (
  history: string[],
): Promise<string> => {
  const apiKey = getApiKey();

  // Jika tidak ada key, langsung fallback
  if (!apiKey) return generateLocalAnalysis(history);

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
    Bertindaklah sebagai Senior Safety Engineer.
    Analisis log simulasi lift berikut ini:
    
    ${history.slice(-30).join('\n')}
    
    Tugas:
    1. Rangkuman insiden.
    2. Evaluasi respons sistem.
    3. Rekomendasi teknis (bullet points).
    Bahasa: Indonesia Formal. Hindari penolakan konten.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { safetySettings: SAFETY_SETTINGS }
    });

    if (!response.text) throw new Error("Empty response");
    return response.text;

  } catch (error) {
    console.error("AI Analysis Error:", error);
    // CRITICAL: Return Fallback analysis instead of error message
    return generateLocalAnalysis(history);
  }
};
