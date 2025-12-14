// audioService.ts - Service untuk mengelola efek suara dalam simulator elevator

export interface AudioConfig {
  volume: number;
  enabled: boolean;
}

export class AudioService {
  private audioContext: AudioContext | null = null;
  private config: AudioConfig = {
    volume: 0.5,
    enabled: true
  };
  
  private soundBuffers: Map<string, AudioBuffer> = new Map();
  
  constructor() {
    if (typeof window !== 'undefined' && window.AudioContext) {
      this.audioContext = new (window.AudioContext)();
    }
  }
  
  async init() {
    // Inisialisasi buffer suara dasar
    await this.generateBasicTones();
  }
  
  private async generateBasicTones() {
    // Generate suara dasar jika Web Audio API tersedia
    if (!this.audioContext) return;
    
    // Suara pintu elevator
    const doorSound = this.createDoorSound();
    this.soundBuffers.set('door', doorSound);
    
    // Suara gerakan elevator
    const movingSound = this.createMovingSound();
    this.soundBuffers.set('moving', movingSound);
    
    // Suara lonceng
    const bellSound = this.createBellSound();
    this.soundBuffers.set('bell', bellSound);
    
    // Suara darurat
    const emergencySound = this.createEmergencySound();
    this.soundBuffers.set('emergency', emergencySound);
  }
  
  private createDoorSound(): AudioBuffer {
    if (!this.audioContext) {
      // Jika Web Audio API tidak tersedia, kembalikan buffer kosong
      return this.audioContext!.createBuffer(1, 22050, 44100);
    }
    
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, sampleRate * 2, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Membuat suara "swish" untuk pintu
    for (let i = 0; i < data.length; i++) {
      const time = i / sampleRate;
      // Suara untuk pembukaan pintu
      if (time < 1) {
        data[i] = Math.sin(440 * 2 * Math.PI * time) * Math.exp(-time * 3) * 0.3;
      } 
      // Suara untuk penutupan pintu
      else if (time < 2) {
        data[i] = Math.sin(554 * 2 * Math.PI * (time - 1)) * Math.exp(-(time - 1) * 3) * 0.3;
      }
    }
    
    return buffer;
  }
  
  private createMovingSound(): AudioBuffer {
    if (!this.audioContext) {
      return this.audioContext!.createBuffer(1, 22050, 44100);
    }
    
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, sampleRate * 3, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Membuat suara mesin elevator yang berjalan
    for (let i = 0; i < data.length; i++) {
      const time = i / sampleRate;
      // Suara mesin dengan frekuensi bervariasi
      const frequency = 120 + 20 * Math.sin(0.5 * 2 * Math.PI * time); // 120-140 Hz
      data[i] = Math.sin(frequency * 2 * Math.PI * time) * 0.2 * Math.min(1, time * 2); // Fade in
    }
    
    return buffer;
  }
  
  private createBellSound(): AudioBuffer {
    if (!this.audioContext) {
      return this.audioContext!.createBuffer(1, 22050, 44100);
    }
    
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, sampleRate * 1.5, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Membuat suara lonceng
    for (let i = 0; i < data.length; i++) {
      const time = i / sampleRate;
      // Suara lonceng dengan harmonik
      data[i] = (
        Math.sin(880 * 2 * Math.PI * time) * 0.4 +  // Harmonik utama
        Math.sin(1760 * 2 * Math.PI * time) * 0.2 +  // Harmonik kedua
        Math.sin(2640 * 2 * Math.PI * time) * 0.1    // Harmonik ketiga
      ) * Math.exp(-time * 2); // Decaying sound
    }
    
    return buffer;
  }
  
  private createEmergencySound(): AudioBuffer {
    if (!this.audioContext) {
      return this.audioContext!.createBuffer(1, 22050, 44100);
    }
    
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, sampleRate * 2, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Membuat suara sirene darurat
    for (let i = 0; i < data.length; i++) {
      const time = i / sampleRate;
      // Sirene dengan modulasi frekuensi
      const frequency = 440 + 100 * Math.sin(2 * 2 * Math.PI * time); // 340-540 Hz
      data[i] = Math.sin(frequency * 2 * Math.PI * time) * 0.3;
    }
    
    return buffer;
  }
  
  playSound(soundType: 'door' | 'moving' | 'bell' | 'emergency') {
    if (!this.config.enabled || !this.audioContext) return;
    
    const buffer = this.soundBuffers.get(soundType);
    if (!buffer) return;
    
    try {
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = this.config.volume;
      gainNode.connect(this.audioContext.destination);
      
      source.connect(gainNode);
      source.start();
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }
  
  updateConfig(newConfig: Partial<AudioConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
  
  setVolume(volume: number) {
    this.config.volume = Math.max(0, Math.min(1, volume));
  }
  
  toggleMute() {
    this.config.enabled = !this.config.enabled;
  }
  
  async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
}

// Singleton instance
export const audioService = new AudioService();