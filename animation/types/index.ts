
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
  | 'OVERLOAD'
  | 'WAITING_APPROVAL';

export type SystemMode = 'NORMAL' | 'FIRE_ALARM' | 'POWER_OUTAGE' | 'EARTHQUAKE' | 'FLOOD' | 'CABLE_SNAP' | 'CYBER_ATTACK' | 'EMERGENCY_STOP';

export interface Scenario {
  title: string;
  description: string;
  type: SystemMode;
  severity: number;
}

export interface Passenger {
  id: string;
  weight: number;
  startFloor: number;
  destinationFloor: number;
  requestTime: number;
  boardTime?: number;
  name: string; 
  isVIP?: boolean;
  isEmergency?: boolean;
}

export type ComponentType = 'Motor Unit' | 'Door Mechanism' | 'Brake System' | 'Control Panel' | 'Cable Tension';

export interface MachineComponent {
  name: ComponentType;
  health: number;
  status: 'OK' | 'WARNING' | 'CRITICAL';
  cycles: number;
}

export interface LiftState {
  id: 'A' | 'B';
  currentFloor: number;
  targetFloor: number | null;
  status: LiftStatus;
  direction: Direction;
  passengers: Passenger[];
  doorOpenProgress: number;
  totalWeight: number;
  energyConsumed: number;
  components: MachineComponent[];
  totalDistanceTraveled: number;
  batteryLevel: number;
  lastMoveTime: number;
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
  totalWaitTime: number;
  avgWaitTime: number;
  totalEnergyJ: number;
  floorVisits: { [key: number]: number };
  peakPassengers: number;
  minPassengers: number;
  energyHistory: number[];
  totalDistanceTraveled: number;
  totalTravelTime: number;
  elevatorUtilization: { [key: string]: number };
  passengerThroughput: number;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SYSTEM' | 'AI_NARRATIVE';
  message: string;
}

export interface ApprovalRequest {
    liftId: 'A' | 'B';
    targetFloor: number;
    reason: string;
}
