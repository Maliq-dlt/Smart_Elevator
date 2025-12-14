
import { LiftState, BuildingState, SimulationStats, SystemMode, ApprovalRequest, LiftStatus, Passenger } from '../types/index';
import { LIFT_MAX_SPEED_MPS, TICK_RATE, FLOOR_HEIGHT_METERS, LIFT_CAPACITY_KG, INITIAL_COMPONENTS, IDLE_RETURN_TIMEOUT_MS } from '../constants/index';

export interface TickResult {
    lift: LiftState;
    building: BuildingState;
    stats: SimulationStats;
    logs: string[];
    approvalRequest?: ApprovalRequest;
}

export const initialLiftState = (id: 'A' | 'B', startFloor: number): LiftState => ({
    id,
    currentFloor: startFloor,
    targetFloor: null,
    status: 'IDLE',
    direction: 'IDLE',
    passengers: [],
    doorOpenProgress: 0,
    totalWeight: 0,
    energyConsumed: 0,
    components: JSON.parse(JSON.stringify(INITIAL_COMPONENTS)),
    totalDistanceTraveled: 0,
    batteryLevel: 100,
    lastMoveTime: 0
});

export const processLiftTick = (
    lift: LiftState,
    otherLift: LiftState,
    buildingState: BuildingState,
    currentStats: SimulationStats,
    systemMode: SystemMode,
    fireFloor: number | null,
    mainsSpeedMultiplier: number,
    hasMainsPower: boolean,
    isCableSnapped: boolean,
    snapTimerRef: { current: number },
    approvalRequests: ApprovalRequest[],
    simTime: number
): TickResult => {
    let nextLift = { ...lift };
    const nextBuilding = buildingState;
    let nextStats = { ...currentStats };
    const logs: string[] = [];
    let newApprovalRequest: ApprovalRequest | undefined = undefined;

    // --- UPDATE TOTAL WEIGHT ---
    nextLift.totalWeight = nextLift.passengers.reduce((sum, p) => sum + p.weight, 0);

    // --- CABLE HEALTH DEGRADATION ---
    if (nextLift.status === 'MOVING') {
        const loadRatio = nextLift.totalWeight / LIFT_CAPACITY_KG;
        if (loadRatio > 0.8) {
            const degradation = 0.05 * (loadRatio - 0.7);
            const cableComp = nextLift.components.find(c => c.name === 'Cable Tension');
            if (cableComp) {
                cableComp.health = Math.max(0, cableComp.health - degradation);
                if (cableComp.health < 50) cableComp.status = 'WARNING';
                if (cableComp.health < 20) cableComp.status = 'CRITICAL';

                if (cableComp.health <= 0 && !isCableSnapped) {
                    // In a real pure function we can't set global state, but the App will detect health 0
                    // and set isCableSnapped to true in the next cycle.
                }
            }
        }
    }

    // Treat 0 health as snapped
    if (nextLift.components.find(c => c.name === 'Cable Tension')?.health === 0) {
        isCableSnapped = true;
    }

    // --- 0. WAITING FOR APPROVAL STATE ---
    if (nextLift.status === 'WAITING_APPROVAL') {
        return { lift: nextLift, building: nextBuilding, stats: nextStats, logs };
    }

    // --- 1. CABLE SNAP LOGIC ---
    if (isCableSnapped) {
        if ((nextLift.status as LiftStatus) === 'MAINTENANCE') {
            return { lift: nextLift, building: nextBuilding, stats: nextStats, logs };
        }

        const nearestFloor = Math.round(nextLift.currentFloor);
        const distance = Math.abs(nextLift.currentFloor - nearestFloor);

        // Phase 1: Halt at nearest floor
        if (distance < 0.05 && nextLift.status !== 'DOOR_OPEN') {
            nextLift.currentFloor = nearestFloor;
            nextLift.status = 'DOOR_OPEN';
            nextLift.doorOpenProgress = 1;
            snapTimerRef.current = 3.0; // 3 seconds countdown
            logs.push(`LIFT ${nextLift.id} DARURAT: Pintu terbuka untuk evakuasi. Menunggu 3 detik...`);

        } else if (nextLift.status === 'DOOR_OPEN') {
            // Phase 2: Wait 3 seconds
            if (snapTimerRef.current > 0) {
                snapTimerRef.current -= TICK_RATE / 1000;
            } else {
                // Phase 3: Evacuate and Breakdown
                if (nextLift.passengers.length > 0) {
                    const names = nextLift.passengers.map(p => p.name).join(', ');
                    logs.push(`LIFT ${nextLift.id} EVAKUASI: ${names} telah keluar.`);
                    nextLift.passengers = [];
                    nextLift.totalWeight = 0;
                }
                nextLift.doorOpenProgress = 0;
                nextLift.status = 'MAINTENANCE';
                logs.push(`LIFT ${nextLift.id} OUT OF ORDER.`);
            }
        } else {
            // Phase 0: Drift to floor
            nextLift.status = 'EMERGENCY_HALT';
            const direction = nearestFloor > nextLift.currentFloor ? 1 : -1;
            nextLift.currentFloor += direction * 0.02;
        }
        return { lift: nextLift, building: nextBuilding, stats: nextStats, logs };
    }

    // --- 2. POWER OUTAGE / BATTERY LOGIC ---
    if (!hasMainsPower) {
        if (nextLift.batteryLevel > 0) {
            if (Math.abs(nextLift.currentFloor - 1) < 0.05) {
                nextLift.currentFloor = 1;
                nextLift.status = 'DOOR_OPEN';
                nextLift.doorOpenProgress = 1;
                if (nextLift.passengers.length > 0) {
                    const names = nextLift.passengers.map(p => p.name).join(', ');
                    logs.push(`LIFT ${nextLift.id} (Battery): Evakuasi ${names} di Lantai 1.`);
                    nextStats.totalPassengersDelivered += nextLift.passengers.length;
                    nextLift.passengers = [];
                }
            } else {
                nextLift.status = 'BATTERY_MODE';
                nextLift.currentFloor -= 0.03;
                nextLift.batteryLevel -= 0.1;
                if (nextLift.currentFloor < 1) nextLift.currentFloor = 1;
            }
        } else {
            nextLift.status = 'IDLE';
        }
        return { lift: nextLift, building: nextBuilding, stats: nextStats, logs };
    }

    // --- 3. EMERGENCY STOP LOGIC ---
    if (systemMode === 'EMERGENCY_STOP') {
        if (nextLift.status === 'MOVING') {
            // Hentikan elevator secara perlahan
            nextLift.status = 'EMERGENCY_HALT';
            logs.push(`LIFT ${nextLift.id}: BERHENTI DARURAT - Menghentikan pergerakan`);
        } else if (nextLift.status !== 'EMERGENCY_HALT' && nextLift.status !== 'DOOR_OPEN') {
            // Jika elevator sedang idle atau dalam status lain, buka pintu
            nextLift.status = 'DOOR_OPEN';
            nextLift.doorOpenProgress = 1;
            logs.push(`LIFT ${nextLift.id}: PINTU DIBUKA - Mode Darurat`);
        }
        return { lift: nextLift, building: nextBuilding, stats: nextStats, logs };
    }

    // --- 4. STANDARD OPERATIONS ---

    // Door Operations
    if (nextLift.status === 'DOOR_OPEN') {
        if (systemMode === 'EARTHQUAKE' && nextLift.currentFloor === 1) {
            // Keep doors open in EQ at safe floor
        } else {
            // --- OVERLOAD CHECK ---
            if (nextLift.totalWeight > LIFT_CAPACITY_KG) {
                const passengers = [...nextLift.passengers];
                if (passengers.length > 0) {
                    passengers.sort((a, b) => b.weight - a.weight);
                    const heaviest = passengers[0];

                    nextLift.passengers = passengers.slice(1);
                    nextLift.totalWeight -= heaviest.weight;

                    const currentFloor = Math.round(nextLift.currentFloor);
                    nextBuilding.floors[currentFloor].waitingPassengers.push(heaviest);

                    logs.push(`OVERLOAD (${(nextLift.totalWeight + heaviest.weight)}kg > 1000kg): ${heaviest.name} (${heaviest.weight}kg) diminta keluar.`);

                    nextLift.doorOpenProgress = 1;
                    const cable = nextLift.components.find(c => c.name === 'Cable Tension');
                    if (cable) cable.health -= 2;

                    return { lift: nextLift, building: nextBuilding, stats: nextStats, logs };
                }
            }
            nextLift.status = 'DOOR_CLOSING';
        }
        return { lift: nextLift, building: nextBuilding, stats: nextStats, logs };
    }
    if (nextLift.status === 'DOOR_OPENING') {
        nextLift.doorOpenProgress += 0.05 * Math.max(0.5, mainsSpeedMultiplier);
        if (nextLift.doorOpenProgress >= 1) {
            nextLift.doorOpenProgress = 1;
            nextLift.status = 'DOOR_OPEN';

            // BOARDING
            const currentFloor = Math.round(nextLift.currentFloor);
            const isFireHere = systemMode === 'FIRE_ALARM' && currentFloor === fireFloor;

            // REJECTION / EVACUATION CHECK
            if (systemMode === 'FIRE_ALARM') {
                const riskyPax = nextLift.passengers.filter(p => p.destinationFloor === fireFloor);
                if (riskyPax.length > 0) {
                    const names = riskyPax.map(p => p.name).join(', ');
                    logs.push(`SAFETY: ${names} dipaksa keluar di L${currentFloor} karena tujuan (L${fireFloor}) berbahaya.`);
                    nextLift.passengers = nextLift.passengers.filter(p => p.destinationFloor !== fireFloor);
                }
            }

            if (!isFireHere) {
                const liftPassengers = [...nextLift.passengers];
                const leaving = liftPassengers.filter(p => p.destinationFloor === currentFloor);
                const staying = liftPassengers.filter(p => p.destinationFloor !== currentFloor);

                if (leaving.length > 0) {
                    nextStats.totalPassengersDelivered += leaving.length;
                    const names = leaving.map(p => p.name).join(', ');
                    logs.push(`${names} turun di Lantai ${currentFloor}`);
                }

                const waiting = nextBuilding.floors[currentFloor].waitingPassengers;
                const liftDir = nextLift.direction;
                const boarding: Passenger[] = [];
                const leftBehind: Passenger[] = [];

                let currentWeight = staying.reduce((sum, p) => sum + p.weight, 0);

                for (const p of waiting) {
                    const pDir = p.destinationFloor > p.startFloor ? 'UP' : 'DOWN';
                    const canBoard = (liftDir === 'IDLE') || (liftDir === pDir) || (staying.length === 0);

                    if (canBoard) {
                        // Calculate wait time for this passenger
                        const waitTime = simTime - p.requestTime;
                        nextStats.totalWaitTime += waitTime;

                        // Set board time and add to boarding list
                        boarding.push({ ...p, boardTime: simTime });
                        currentWeight += p.weight;
                    } else {
                        leftBehind.push(p);
                    }
                }

                // Update avgWaitTime based on total passengers who have boarded
                const totalBoarded = nextStats.totalPassengersDelivered + nextLift.passengers.length + boarding.length;
                if (totalBoarded > 0) {
                    nextStats.avgWaitTime = nextStats.totalWaitTime / totalBoarded;
                }

                nextLift.passengers = [...staying, ...boarding];
                nextBuilding.floors[currentFloor].waitingPassengers = leftBehind;
                nextLift.totalWeight = nextLift.passengers.reduce((sum, p) => sum + p.weight, 0);
            } else {
                logs.push(`FIRE ALARM: Doors opened at L${currentFloor} but boarding restricted!`, 'WARNING');
            }
        }
        return { lift: nextLift, building: nextBuilding, stats: nextStats, logs };
    }
    if (nextLift.status === 'DOOR_CLOSING') {
        nextLift.doorOpenProgress -= 0.05 * Math.max(0.5, mainsSpeedMultiplier);
        if (nextLift.doorOpenProgress <= 0) {
            nextLift.doorOpenProgress = 0;

            // --- INTERCEPTION LOGIC ---
            if (nextLift.passengers.length > 0) {
                const riskyDestinations = nextLift.passengers.filter(p =>
                    (systemMode === 'FIRE_ALARM' && p.destinationFloor === fireFloor) ||
                    (systemMode === 'FLOOD' && p.destinationFloor === 1)
                );

                if (riskyDestinations.length > 0) {
                    const targetFloor = riskyDestinations[0].destinationFloor;
                    const existingReq = approvalRequests.find(r => r.liftId === nextLift.id);
                    if (!existingReq) {
                        const hazard = systemMode === 'FIRE_ALARM' ? 'KEBAKARAN' : 'BANJIR';
                        const names = riskyDestinations.map(p => p.name).join(', ');
                        logs.push(`INTERSEPSI: ${names} ingin ke L${targetFloor} yang berbahaya (${hazard}). Menunggu persetujuan User.`);

                        newApprovalRequest = {
                            liftId: nextLift.id,
                            targetFloor: targetFloor,
                            reason: `${hazard} di Lantai ${targetFloor}`
                        };
                    }

                    nextLift.status = 'WAITING_APPROVAL';
                    return { lift: nextLift, building: nextBuilding, stats: nextStats, logs, approvalRequest: newApprovalRequest };
                }
            }

            nextLift.status = 'IDLE';
            nextLift.lastMoveTime = simTime;
        }
        return { lift: nextLift, building: nextBuilding, stats: nextStats, logs };
    }

    // Movement
    if (nextLift.status === 'MOVING' && nextLift.targetFloor !== null) {
        nextLift.lastMoveTime = simTime;

        const dist = Math.abs(nextLift.targetFloor - nextLift.currentFloor);
        const dir = Math.sign(nextLift.targetFloor - nextLift.currentFloor);
        let speed = LIFT_MAX_SPEED_MPS * Math.max(0.2, mainsSpeedMultiplier);
        if (dist < 0.8) speed = Math.max(0.5, speed * dist);

        const step = (speed * (TICK_RATE / 1000)) / FLOOR_HEIGHT_METERS;

        if (dist < step) {
            nextLift.currentFloor = nextLift.targetFloor;
            nextLift.status = 'DOOR_OPENING';
        } else {
            nextLift.currentFloor += dir * step;
            nextLift.direction = dir > 0 ? 'UP' : 'DOWN';
        }
        return { lift: nextLift, building: nextBuilding, stats: nextStats, logs };
    }

    // Idle / Decision (SCAN)
    if (nextLift.status === 'IDLE') {
        // --- IDLE RETURN LOGIC ---
        if (nextLift.passengers.length === 0 && nextLift.currentFloor !== 1) {
            if (simTime - nextLift.lastMoveTime > (IDLE_RETURN_TIMEOUT_MS / 1000)) {
                nextLift.targetFloor = 1;
                nextLift.status = 'MOVING';
                nextLift.direction = 'DOWN';
                logs.push(`IDLE TIMEOUT: Lift ${nextLift.id} kembali ke L1 untuk mengurangi beban katrol.`);
                return { lift: nextLift, building: nextBuilding, stats: nextStats, logs };
            }
        }

        if (systemMode === 'EARTHQUAKE' && Math.abs(nextLift.currentFloor - 1) > 0.05) {
            nextLift.targetFloor = 1;
            nextLift.status = 'MOVING';
            return { lift: nextLift, building: nextBuilding, stats: nextStats, logs };
        }

        const otherLiftBusy = otherLift.status !== 'IDLE';
        const otherLiftTarget = otherLift.targetFloor;

        // Implementasi FIFO untuk antrean lantai - mengambil penumpang berdasarkan waktu permintaan
        const floorCalls = Object.keys(nextBuilding.floors).map(Number).filter(f => {
            if (systemMode === 'FIRE_ALARM' && f === fireFloor) return false;
            const hasPax = nextBuilding.floors[f].waitingPassengers.length > 0;
            if (!hasPax) return false;
            if (otherLiftBusy && otherLiftTarget === f) return false;
            if (systemMode === 'FLOOD' && f === 1) return false;
            return true;
        });

        // Urutkan floorCalls dengan prioritas: darurat > VIP > FIFO berdasarkan waktu permintaan
        floorCalls.sort((a, b) => {
            // Cari penumpang darurat di lantai a dan b
            const emergencyPaxAtA = nextBuilding.floors[a].waitingPassengers.find(p => p.isEmergency);
            const emergencyPaxAtB = nextBuilding.floors[b].waitingPassengers.find(p => p.isEmergency);
            
            if (emergencyPaxAtA && !emergencyPaxAtB) return -1;
            if (!emergencyPaxAtA && emergencyPaxAtB) return 1;
            
            // Jika tidak ada darurat, cek VIP
            const vipPaxAtA = nextBuilding.floors[a].waitingPassengers.find(p => p.isVIP);
            const vipPaxAtB = nextBuilding.floors[b].waitingPassengers.find(p => p.isVIP);
            
            if (vipPaxAtA && !vipPaxAtB) return -1;
            if (!vipPaxAtA && vipPaxAtB) return 1;
            
            // Jika tidak ada darurat atau VIP, gunakan FIFO berdasarkan waktu permintaan
            const firstPassengerAtA = nextBuilding.floors[a].waitingPassengers.length > 0 
                ? nextBuilding.floors[a].waitingPassengers[0].requestTime 
                : Infinity;
            const firstPassengerAtB = nextBuilding.floors[b].waitingPassengers.length > 0 
                ? nextBuilding.floors[b].waitingPassengers[0].requestTime 
                : Infinity;
            return firstPassengerAtA - firstPassengerAtB;
        });

        const cabinDestinations = nextLift.passengers.map(p => p.destinationFloor);
        const allTargets = new Set([...floorCalls, ...cabinDestinations]);

        if (allTargets.size === 0) {
            nextLift.direction = 'IDLE';
        } else {
            // SCAN Algorithm Implementation
            // The elevator moves in one direction until it reaches the end of its path,
            // then reverses direction
            
            // Determine targets in the current direction of movement
            let targetsInDirection: number[] = [];
            
            // If elevator is moving in a specific direction, prioritize targets in that direction
            if (nextLift.direction === 'UP') {
                // Look for targets that are above current floor
                targetsInDirection = Array.from(allTargets).filter(target => target >= nextLift.currentFloor);
                
                // If no targets in current direction, switch to DOWN and look for targets below
                if (targetsInDirection.length === 0) {
                    targetsInDirection = Array.from(allTargets).filter(target => target < nextLift.currentFloor);
                    nextLift.direction = 'DOWN';
                }
            } else if (nextLift.direction === 'DOWN') {
                // Look for targets that are below current floor
                targetsInDirection = Array.from(allTargets).filter(target => target <= nextLift.currentFloor);
                
                // If no targets in current direction, switch to UP and look for targets above
                if (targetsInDirection.length === 0) {
                    targetsInDirection = Array.from(allTargets).filter(target => target > nextLift.currentFloor);
                    nextLift.direction = 'UP';
                }
            } else {
                // If IDLE, determine initial direction based on closest target with load balancing
                const closest = Array.from(allTargets).reduce((prev, curr) =>
                    Math.abs(curr - nextLift.currentFloor) < Math.abs(prev - nextLift.currentFloor) ? curr : prev
                );
                
                // Load balancing: if other elevator is less loaded, consider letting it handle the request
                const currentLiftLoad = nextLift.passengers.length + (nextBuilding.floors[Math.round(nextLift.currentFloor)]?.waitingPassengers.length || 0);
                const otherLiftLoad = otherLift.passengers.length + (nextBuilding.floors[Math.round(otherLift.currentFloor)]?.waitingPassengers.length || 0);
                
                // If other elevator is significantly less loaded and closer to the target, let it handle
                if (otherLiftLoad < currentLiftLoad && 
                    Math.abs(otherLift.currentFloor - closest) < Math.abs(nextLift.currentFloor - closest)) {
                    // In this case, remain idle and let the other elevator handle the request
                    nextLift.direction = 'IDLE';
                } else {
                    nextLift.targetFloor = closest;
                    nextLift.direction = closest > nextLift.currentFloor ? 'UP' : 'DOWN';
                    nextLift.status = 'MOVING';
                }
            }

            // If still in IDLE state (not yet assigned a target), find the best target using SCAN logic with load balancing
            if (nextLift.status === 'IDLE') {
                if (targetsInDirection.length > 0) {
                    // Load balancing: consider which targets would be more efficiently handled by this elevator vs other elevator
                    let optimalTarget: number | null = null;
                    
                    // If elevator is idle, check if any targets are better handled by other elevator
                    if (nextLift.direction === 'IDLE') {
                        // Find the best target for this elevator considering distance and load
                        optimalTarget = null;
                        let bestScore = -Infinity;
                        
                        for (const target of targetsInDirection) {
                            // Calculate score based on distance and current load
                            const distanceToTarget = Math.abs(target - nextLift.currentFloor);
                            const distanceForOther = Math.abs(target - otherLift.currentFloor);
                            
                            // Calculate load difference - prefer targets that don't overload this elevator
                            const currentLiftLoad = nextLift.passengers.length;
                            const otherLiftLoad = otherLift.passengers.length;
                            
                            // Score calculation: closer distance = higher score, but also consider load balance
                            const distanceScore = -distanceToTarget; // Negative because closer is better
                            const loadBalanceScore = otherLiftLoad - currentLiftLoad; // Positive if other elevator is more loaded
                            
                            // Prefer targets this elevator can reach faster than the other
                            const targetScore = distanceScore + (distanceForOther < distanceToTarget ? -10 : 10) + loadBalanceScore;
                            
                            if (targetScore > bestScore) {
                                bestScore = targetScore;
                                optimalTarget = target;
                            }
                        }
                    } else {
                        // For SCAN algorithm, we pick the furthest target in the current direction
                        // to ensure we service all floors in that direction before reversing
                        if (nextLift.direction === 'UP') {
                            optimalTarget = Math.max(...targetsInDirection);
                        } else if (nextLift.direction === 'DOWN') {
                            optimalTarget = Math.min(...targetsInDirection);
                        }
                    }
                    
                    if (optimalTarget !== null) {
                        nextLift.targetFloor = optimalTarget;
                        
                        // Check if already at target floor
                        if (Math.abs(nextLift.targetFloor - nextLift.currentFloor) < 0.1) {
                            nextLift.status = 'DOOR_OPENING';
                        } else {
                            nextLift.status = 'MOVING';
                        }
                    }
                } else {
                    // No targets in any direction, remain idle
                    nextLift.direction = 'IDLE';
                }
            }
        }
    }

    return { lift: nextLift, building: nextBuilding, stats: nextStats, logs };
};
