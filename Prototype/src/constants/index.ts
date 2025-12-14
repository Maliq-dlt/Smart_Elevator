
import { MachineComponent } from '../types/index';

export const FLOORS = [1, 2, 3];
export const LIFT_CAPACITY_KG = 1000;
export const LIFT_CAPACITY_PEOPLE = 12;
export const FLOOR_HEIGHT_METERS = 4;

// Physics Constants
export const GRAVITY = 9.8;
export const LIFT_EMPTY_MASS = 1000;
export const LIFT_MAX_SPEED_MPS = 3.5;

// Simulation timings (in ms)
export const TICK_RATE = 50;
export const DOOR_OPERATION_TIME = 2000;
export const FLOOR_TRAVEL_TIME = 2000; 
export const IDLE_RETURN_TIMEOUT_MS = 10000;

// Visuals
export const FLOOR_PIXELS = 160;

export const MOCK_NAMES = [
  "Budi", "Siti", "Agus", "Dewi", "Eko", "Putri", "Rizky", "Ani", 
  "Joko", "Sari", "Bambang", "Lina", "Hendra", "Rina", "Doni", 
  "Tono", "Wati", "Dedi", "Nina", "Bayu"
];

export const INITIAL_COMPONENTS: MachineComponent[] = [
  { name: 'Motor Unit', health: 100, status: 'OK', cycles: 0 },
  { name: 'Door Mechanism', health: 100, status: 'OK', cycles: 0 },
  { name: 'Brake System', health: 100, status: 'OK', cycles: 0 },
  { name: 'Control Panel', health: 98, status: 'OK', cycles: 0 },
  { name: 'Cable Tension', health: 100, status: 'OK', cycles: 0 },
];
