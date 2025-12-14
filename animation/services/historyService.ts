// historyService.ts - Service untuk menyimpan dan memuat riwayat perjalanan elevator

import { LiftState, BuildingState, SimulationStats, LogEntry } from '../types/index';

export interface JourneyRecord {
  id: string;
  timestamp: number;
  duration: number;
  liftA: LiftState;
  liftB: LiftState;
  building: BuildingState;
  stats: SimulationStats;
  logs: LogEntry[];
  scenario: string;
}

export class HistoryService {
  private readonly storageKey = 'elevator_journey_history';
  private readonly maxRecords = 50; // Batasi jumlah maksimal rekaman yang disimpan

  saveJourney(journey: Omit<JourneyRecord, 'id' | 'timestamp'>, scenario: string): string {
    const id = this.generateId();
    const record: JourneyRecord = {
      id,
      timestamp: Date.now(),
      duration: 0, // Akan dihitung saat perjalanan selesai
      ...journey,
      scenario
    };

    const history = this.getHistory();
    history.push(record);

    // Batasi jumlah rekaman
    if (history.length > this.maxRecords) {
      history.shift(); // Hapus rekaman tertua
    }

    this.saveToStorage(history);
    return id;
  }

  updateJourneyDuration(journeyId: string, duration: number): boolean {
    const history = this.getHistory();
    const recordIndex = history.findIndex(record => record.id === journeyId);
    
    if (recordIndex !== -1) {
      history[recordIndex].duration = duration;
      this.saveToStorage(history);
      return true;
    }
    
    return false;
  }

  getHistory(): JourneyRecord[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      
      // Validasi struktur data
      return parsed.map(record => this.validateRecord(record)).filter(Boolean) as JourneyRecord[];
    } catch (error) {
      console.error('Error loading journey history:', error);
      return [];
    }
  }

  getJourneyById(id: string): JourneyRecord | null {
    const history = this.getHistory();
    return history.find(record => record.id === id) || null;
  }

  deleteJourney(id: string): boolean {
    const history = this.getHistory();
    const initialLength = history.length;
    
    const filtered = history.filter(record => record.id !== id);
    
    if (filtered.length !== initialLength) {
      this.saveToStorage(filtered);
      return true;
    }
    
    return false;
  }

  clearHistory(): void {
    localStorage.removeItem(this.storageKey);
  }

  exportHistory(): string {
    const history = this.getHistory();
    return JSON.stringify(history, null, 2);
  }

  importHistory(jsonString: string): boolean {
    try {
      const imported = JSON.parse(jsonString);
      if (!Array.isArray(imported)) {
        throw new Error('Invalid history format');
      }

      // Validasi setiap rekaman
      const validRecords = imported
        .map(record => this.validateRecord(record))
        .filter(Boolean) as JourneyRecord[];

      this.saveToStorage(validRecords);
      return true;
    } catch (error) {
      console.error('Error importing journey history:', error);
      return false;
    }
  }

  private validateRecord(record: any): JourneyRecord | null {
    if (
      !record.id || 
      typeof record.timestamp !== 'number' || 
      !record.liftA || 
      !record.liftB || 
      !record.building || 
      !record.stats
    ) {
      return null;
    }

    return record as JourneyRecord;
  }

  private generateId(): string {
    return `journey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveToStorage(history: JourneyRecord[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving journey history:', error);
    }
  }
}

// Singleton instance
export const historyService = new HistoryService();