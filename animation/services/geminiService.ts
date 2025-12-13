import { GoogleGenAI, Type } from "@google/genai";
import { LiftState, SystemMode, Passenger, Scenario } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

// Define schema for structured scenario generation
const scenarioSchema = {
  type: Type.OBJECT,
  properties: {
    type: {
      type: Type.STRING,
      enum: ['NORMAL', 'FIRE_ALARM', 'POWER_OUTAGE', 'EARTHQUAKE', 'FLOOD', 'CABLE_SNAP', 'CYBER_ATTACK'],
      description: "Tipe kejadian yang terjadi di gedung."
    },
    title: {
      type: Type.STRING,
      description: "Judul singkat dan dramatis untuk skenario (Contoh: 'Gempa Tektonik 6.0 SR', 'Banjir Basement', 'Kabel Utama Putus')."
    },
    description: {
      type: Type.STRING,
      description: "2 kalimat latar belakang kejadian dalam BAHASA INDONESIA. Contoh: 'Hujan deras semalaman menyebabkan air masuk ke lantai dasar.' atau 'Kabel baja utama Lift A mengalami kelelahan material.'"
    },
    severity: {
      type: Type.INTEGER,
      description: "Tingkat keparahan 1 (Tenang) sampai 10 (Bencana)."
    }
  },
  required: ["type", "title", "description", "severity"]
};

export const generateRandomScenario = async (): Promise<Scenario> => {
  const prompt = `
    Buatkan skenario simulasi acak untuk sistem lift pintar dalam BAHASA INDONESIA.
    
    Probabilitas:
    - 40% Peluang: NORMAL (Pagi sibuk, Kunjungan VIP, Inspeksi Rutin)
    - 60% Peluang: BENCANA/EVENT (Kebakaran, Mati Lampu, Gempa Bumi, BANJIR, Kabel Putus, Serangan Siber)

    Untuk skenario BANJIR (FLOOD), asumsikan air masuk ke lantai 1.
    Deskripsi harus dramatis dan imersif.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: scenarioSchema,
        temperature: 1.2 // High temperature for variety
      }
    });

    const data = JSON.parse(response.text || "{}");
    // Fallback if parsing fails
    return {
      type: data.type || 'NORMAL',
      title: data.title || 'Operasional Standar',
      description: data.description || 'Sistem berjalan dalam parameter normal tanpa gangguan.',
      severity: data.severity || 1
    };
  } catch (error) {
    console.error("Scenario Generation Error:", error);
    return {
      type: 'NORMAL',
      title: 'Sistem Online',
      description: 'Koneksi ke AI Scenario Engine gagal. Menjalankan protokol standar.',
      severity: 1
    };
  }
};

export const generateSystemNarrative = async (
  events: string[],
  liftA: LiftState,
  liftB: LiftState,
  mode: SystemMode,
  activeScenario: Scenario | null
): Promise<string> => {
  const prompt = `
    Anda adalah AI 'Sistem Kontrol Gedung'. Gunakan BAHASA INDONESIA.
    
    SKENARIO AKTIF: "${activeScenario?.title || 'Unknown'}"
    TIPE SKENARIO: ${mode}
    LATAR BELAKANG: ${activeScenario?.description}
    
    Telemetri Saat Ini:
    - Lift A: Lantai ${liftA.currentFloor.toFixed(1)} (${liftA.status}) | Kesehatan: ${liftA.components[0].health.toFixed(0)}%
    - Lift B: Lantai ${liftB.currentFloor.toFixed(1)} (${liftB.status}) | Kesehatan: ${liftB.components[0].health.toFixed(0)}%

    Log Terbaru:
    ${events.length > 0 ? events.map(e => `- ${e}`).join('\n') : "(Tidak ada log baru)"}

    Tugas:
    Tulis update status langsung yang *dinamis* (maksimal 2 kalimat).
    - Jika skenario BENCANA (Kabel Putus, Kebakaran, Gempa, Banjir), terdengar mendesak dan khawatir. Deskripsikan kekacauan (misal: "Air mulai meninggi di lobi!").
    - Jika skenario NORMAL, deskripsikan suasana (misal: "Siang yang tenang", "Antrian penumpang padat").
    - JANGAN mengulang output sebelumnya. Jadilah kreatif.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "Status Sistem: Memonitor...";
  }
};

export const generateScenarioAnalysis = async (
  history: string[],
): Promise<string> => {
  const prompt = `
    Analisis riwayat sesi simulasi Smart Elevator berikut dalam BAHASA INDONESIA.
    Berikan "Laporan Skenario" yang mengevaluasi efisiensi algoritma pengiriman, 
    menyoroti insiden kritis (kelebihan beban, keadaan darurat, banjir, kebakaran), dan meringkas arus penumpang.
    
    Riwayat Sesi:
    ${history.slice(-20).join('\n')} 

    Format sebagai laporan teknis profesional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "Analisis Gagal.";
  }
};