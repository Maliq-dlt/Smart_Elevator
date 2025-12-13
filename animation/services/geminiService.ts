import { GoogleGenAI } from "@google/genai";
import { LiftState, SystemMode, Passenger } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

export const generateSystemNarrative = async (
  events: string[],
  liftA: LiftState,
  liftB: LiftState,
  mode: SystemMode
): Promise<string> => {
  if (events.length === 0) return "";

  const prompt = `
    You are the intelligent central computer of a high-tech building (Finite State Automata system).
    
    Current System Mode: ${mode}
    
    Lift A Status: Floor ${liftA.currentFloor.toFixed(1)}, State: ${liftA.status}, Passengers: ${liftA.passengers.length}, Load: ${liftA.totalWeight}kg.
    Lift B Status: Floor ${liftB.currentFloor.toFixed(1)}, State: ${liftB.status}, Passengers: ${liftB.passengers.length}, Load: ${liftB.totalWeight}kg.

    Recent Events Log:
    ${events.map(e => `- ${e}`).join('\n')}

    Task:
    Write a short, realistic, and slightly dramatic narrative log entry describing what is happening in the building right now. 
    Mention specific passengers by name if they board/leave. 
    If there is an emergency (Fire/Power Outage), describe the safety protocols activating.
    If the lifts are idle, describe them waiting or performing self-diagnostics.
    Keep it under 100 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "System Offline: Unable to generate narrative report.";
  }
};

export const generateScenarioAnalysis = async (
  history: string[],
): Promise<string> => {
  const prompt = `
    Analyze the following Smart Elevator simulation session history. 
    Provide a "Scenario Report" that evaluates the efficiency of the dispatch algorithm, 
    highlights any critical incidents (overload, emergencies), and summarizes the passenger flow.
    
    Session History:
    ${history.slice(-20).join('\n')} 
    (Truncated to last 20 events for brevity)

    Format as a professional engineering report.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "Analysis Failed.";
  }
};
