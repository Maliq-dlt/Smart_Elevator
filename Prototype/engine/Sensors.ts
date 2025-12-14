
import { LiftState, SensorReadings } from '../types/index';
import { LIFT_CAPACITY_KG, FLOOR_HEIGHT_METERS } from '../constants/index';

/**
 * Simulates hardware sensors reading physical values with slight noise/jitter
 * to mimic real-world analog-to-digital conversion.
 */
export const readSensors = (lift: LiftState, timeScale: number): SensorReadings => {
    // 1. Position Encoder (Rotary Encoder simulation)
    // Add tiny jitter (0.001) to simulate sensor noise
    const rawPos = lift.currentFloor + (Math.random() - 0.5) * 0.002;
    
    // 2. Load Cell (Strain Gauge)
    // Add ±2kg fluctuation
    const rawLoad = lift.totalWeight + (Math.random() - 0.5) * 4;
    
    // 3. Velocity (Derivation from position change, handled roughly here based on status)
    let velocity = 0;
    if (lift.status === 'MOVING') {
        velocity = lift.direction === 'UP' ? 3.5 : -3.5; // Simplified max speed
        // Add ramp-up/down logic simulation would be here
    }

    // 4. Door Sensors
    let doorState: 'CLOSED' | 'OPEN' | 'AJAR' = 'CLOSED';
    if (lift.doorOpenProgress === 0) doorState = 'CLOSED';
    else if (lift.doorOpenProgress === 1) doorState = 'OPEN';
    else doorState = 'AJAR';

    // 5. Leveling Sensor (Magnetic reed switch)
    // Returns true if within 5cm of a floor
    const distToNearest = Math.abs(rawPos - Math.round(rawPos));
    const levelingSensor = distToNearest < (0.05 / FLOOR_HEIGHT_METERS); // 5cm tolerance

    // 6. Cable Tension
    const baseTension = (1000 + rawLoad) * 9.8; // Mass * Gravity
    const tensionJitter = baseTension * 0.01 * (Math.random() - 0.5);
    
    return {
        position: parseFloat(rawPos.toFixed(4)),
        velocity: velocity,
        load: Math.max(0, parseFloat(rawLoad.toFixed(1))),
        doorState,
        levelingSensor,
        cableTension: baseTension + tensionJitter,
        temperature: 24 + (lift.energyConsumed / 100000) + (Math.random() * 0.5)
    };
};
