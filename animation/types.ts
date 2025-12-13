
export type Direction = 'UP' | 'DOWN' | 'IDLE';

export type LiftStatus = 
  | 'IDLE' 
  | 'MOVING' 
  | 'DOOR_OPENING' 
  | 'DOOR_OPEN' 
  | 'DOOR_CLOSING' 
  | 'MAINTENANCE' 
  | 'EMERGENCY_HALT'
  | 'BATTERY_MODE'
  | 'OVERLOAD';

export type SystemMode = 'NORMAL' | 'FIRE_ALARM' | 'POWER_OUTAGE' | 'EARTHQUAKE' | 'FLOOD' | 'CABLE_SNAP' | 'CYBER_ATTACK';

export interface Scenario {
  title: string;
  description: string; // The AI generated backstory
  type: SystemMode;
  severity: number; // 1-10
}

export interface Passenger {
  id: string;
  weight: number;
  startFloor: number;
  destinationFloor: number;
  requestTime: number; // Time in seconds when they appear
  boardTime?: number; // Time when they enter lift
  name: string; 
}

export type ComponentType = 'Motor Unit' | 'Door Mechanism' | 'Brake System' | 'Control Panel' | 'Cable Tension';

export interface MachineComponent {
  name: ComponentType;
  health: number; // 0-100%
  status: 'OK' | 'WARNING' | 'CRITICAL';
  cycles: number;
}

export interface LiftState {
  id: 'A' | 'B';
  currentFloor: number; // 1, 2, 3 (can be float during movement)
  targetFloor: number | null;
  status: LiftStatus;
  direction: Direction; // The intended direction of the current "Run"
  passengers: Passenger[];
  doorOpenProgress: number; // 0 to 1
  totalWeight: number;
  energyConsumed: number; // Joules
  components: MachineComponent[];
  totalDistanceTraveled: number; // meters
  batteryLevel: number; // 0-100% for Emergency Backup
}

export interface BuildingState {
  floors: {
    [key: number]: {
      waitingPassengers: Passenger[];
    };
  };
}

export interface SimulationStats {
  totalPassengersDelivered: number;
  totalWaitTime: number; // seconds
  avgWaitTime: number; // seconds
  totalEnergyJ: number; // Joules
  floorVisits: { [key: number]: number }; // Frequency per floor
  peakPassengers: number;
  minPassengers: number;
  energyHistory: number[]; // Array for graph
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SYSTEM' | 'AI_NARRATIVE';
  message: string;
}
