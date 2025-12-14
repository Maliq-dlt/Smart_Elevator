import React, { useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { LiftState } from '../types/index';

// --- CONSTANTS ---
const FLOOR_HEIGHT = 3;
const SHAFT_HEIGHT = 15;
const CABIN_HEIGHT = 2.5;
const SHAFT_SPACING = 6; // Distance between two elevator shafts

// --- WASD CAMERA CONTROLS ---
const WASDCameraControls = () => {
  const { camera, gl } = useThree();
  const moveSpeed = 0.15;
  const zoomSpeed = 0.5;
  const keys = useRef<Set<string>>(new Set());
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current.add(e.key.toLowerCase());
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
    };
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      camera.position.addScaledVector(direction, -e.deltaY * zoomSpeed * 0.01);
    };
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        isDragging.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
      }
    };
    const handleMouseUp = () => {
      isDragging.current = false;
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const deltaX = e.clientX - lastMouse.current.x;
        const deltaY = e.clientY - lastMouse.current.y;
        camera.rotation.y -= deltaX * 0.005;
        camera.rotation.x -= deltaY * 0.005;
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
        lastMouse.current = { x: e.clientX, y: e.clientY };
      }
    };
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    const domElement = gl.domElement;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });
    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    domElement.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      domElement.removeEventListener('wheel', handleWheel);
      domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      domElement.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [camera, gl]);

  useFrame(() => {
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    if (keys.current.has('w')) camera.position.addScaledVector(forward, moveSpeed);
    if (keys.current.has('s')) camera.position.addScaledVector(forward, -moveSpeed);
    if (keys.current.has('a')) camera.position.addScaledVector(right, -moveSpeed);
    if (keys.current.has('d')) camera.position.addScaledVector(right, moveSpeed);
    if (keys.current.has('q') || keys.current.has(' ')) camera.position.y += moveSpeed;
    if (keys.current.has('e') || keys.current.has('shift')) camera.position.y -= moveSpeed;
  });

  return null;
};

// --- GEARLESS TRACTION MACHINE (Motor + Sheave Integrated) ---
const GearlessTractionMachine = ({ velocity, xOffset }: { velocity: number; xOffset: number }) => {
  const { scene } = useGLTF('/models/electric_motor.glb');
  const sheaveRef = useRef<THREE.Group>(null);
  const sheaveYellow = "#E5A830";
  const hubBlue = "#2B7A9C";

  const clonedScene = React.useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  // Rotate sheave based on velocity
  useFrame((_, delta) => {
    if (sheaveRef.current) {
      const angularSpeed = velocity / 0.5;
      sheaveRef.current.rotation.z += angularSpeed * delta;
    }
  });

  return (
    <group position={[xOffset, SHAFT_HEIGHT + 2.5, 0]}>
      {/* Motor Body (GLB Model) - positioned behind sheave */}
      <primitive
        object={clonedScene}
        scale={[0.6, 0.6, 0.6]}
        position={[0, 0, -0.8]}
        rotation={[0, 0, 0]}
      />

      {/* Integrated Sheave on Motor Shaft Front */}
      <group ref={sheaveRef} position={[0, 0, 0.3]}>
        {/* Main Sheave Ring (Yellow) */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <torusGeometry args={[1.0, 0.2, 16, 48]} />
          <meshStandardMaterial color={sheaveYellow} roughness={0.3} metalness={0.5} />
        </mesh>

        {/* Cable Grooves */}
        {[-0.1, 0, 0.1].map((offset, i) => (
          <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[0, offset, 0]} castShadow>
            <torusGeometry args={[1.0, 0.015, 8, 48]} />
            <meshStandardMaterial color="#5a4a2a" roughness={0.6} />
          </mesh>
        ))}

        {/* Central Hub (Blue) */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.35, 32]} />
          <meshStandardMaterial color={hubBlue} roughness={0.4} metalness={0.6} />
        </mesh>

        {/* Spokes */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh
            key={i}
            position={[Math.cos((i * Math.PI) / 3) * 0.35, 0, Math.sin((i * Math.PI) / 3) * 0.35]}
            rotation={[0, (i * Math.PI) / 3, 0]}
            castShadow
          >
            <boxGeometry args={[0.5, 0.15, 0.1]} />
            <meshStandardMaterial color={hubBlue} roughness={0.4} metalness={0.6} />
          </mesh>
        ))}

        {/* Center Cap */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.1, 24]} />
          <meshStandardMaterial color="#D4883A" roughness={0.5} />
        </mesh>
      </group>

      {/* Electromagnetic Brake (on motor shaft side) */}
      <mesh position={[0.9, 0, -0.3]} castShadow>
        <boxGeometry args={[0.3, 0.6, 0.5]} />
        <meshStandardMaterial color="#ef4444" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Brake Label */}
      <mesh position={[1.06, 0.15, -0.3]} castShadow>
        <boxGeometry args={[0.02, 0.15, 0.2]} />
        <meshStandardMaterial color="#FFC107" />
      </mesh>
    </group>
  );
};

useGLTF.preload('/models/electric_motor.glb');

// --- ELEVATOR CABIN ---
const ElevatorCabin = ({ position, doorsOpen, xOffset, liftId }: {
  position: number; doorsOpen: boolean; xOffset: number; liftId: string
}) => {
  const cabinY = position * FLOOR_HEIGHT + CABIN_HEIGHT / 2 + 0.5;
  const doorOffset = doorsOpen ? 0.45 : 0;
  const cabinColor = liftId === 'A' ? "#3b82f6" : "#10b981"; // Blue for A, Green for B

  return (
    <group position={[xOffset, cabinY, 0]}>
      {/* Main Cabin Box */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.8, CABIN_HEIGHT, 1.6]} />
        <meshStandardMaterial color="#4a5568" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Cabin Interior */}
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[1.6, CABIN_HEIGHT - 0.1, 1.4]} />
        <meshStandardMaterial color="#f7fafc" roughness={0.8} />
      </mesh>

      {/* Cabin Roof with Lift ID color */}
      <mesh position={[0, CABIN_HEIGHT / 2 + 0.08, 0]} castShadow>
        <boxGeometry args={[1.9, 0.15, 1.7]} />
        <meshStandardMaterial color={cabinColor} roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Cabin Floor */}
      <mesh position={[0, -CABIN_HEIGHT / 2 - 0.05, 0]} castShadow>
        <boxGeometry args={[1.9, 0.1, 1.7]} />
        <meshStandardMaterial color="#1a202c" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Doors */}
      <mesh position={[-0.45 + doorOffset, 0, 0.82]} castShadow>
        <boxGeometry args={[0.8, CABIN_HEIGHT - 0.3, 0.05]} />
        <meshStandardMaterial color="#718096" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0.45 - doorOffset, 0, 0.82]} castShadow>
        <boxGeometry args={[0.8, CABIN_HEIGHT - 0.3, 0.05]} />
        <meshStandardMaterial color="#718096" roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Guide Shoes */}
      {[[-0.95, 1], [-0.95, -1], [0.95, 1], [0.95, -1]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0]} castShadow>
          <boxGeometry args={[0.12, 0.2, 0.12]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
};

// --- COUNTERWEIGHT ---
const Counterweight = ({ cabinPosition, xOffset }: { cabinPosition: number; xOffset: number }) => {
  const maxPosition = 4;
  const counterweightY = (maxPosition - cabinPosition) * FLOOR_HEIGHT + 1.5;

  return (
    <group position={[xOffset - 2, counterweightY, -0.8]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.5, 2.5, 0.4]} />
        <meshStandardMaterial color="#374151" roughness={0.6} metalness={0.5} />
      </mesh>
      {/* Weight Plates */}
      {[-0.8, -0.4, 0, 0.4, 0.8].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} castShadow>
          <boxGeometry args={[0.55, 0.12, 0.45]} />
          <meshStandardMaterial color="#1f2937" roughness={0.5} metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
};

// --- WIRE ROPES ---
const WireRopes = ({ cabinPosition, xOffset }: { cabinPosition: number; xOffset: number }) => {
  const cabinY = cabinPosition * FLOOR_HEIGHT + CABIN_HEIGHT / 2 + 0.5;
  const counterweightY = (4 - cabinPosition) * FLOOR_HEIGHT + 1.5;
  const sheaveY = SHAFT_HEIGHT + 2.5;

  const cabinCableLength = sheaveY - cabinY - CABIN_HEIGHT / 2 - 0.5;
  const cwCableLength = sheaveY - counterweightY - 1.25;

  return (
    <group>
      {/* Cables from Sheave to Cabin */}
      {[-0.08, 0, 0.08].map((offset, i) => (
        <mesh
          key={`cabin-${i}`}
          position={[xOffset + offset, sheaveY - cabinCableLength / 2 - 0.5, 0.8]}
          castShadow
        >
          <cylinderGeometry args={[0.012, 0.012, cabinCableLength, 8]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}

      {/* Cables from Sheave to Counterweight (wrap over sheave) */}
      {[-0.08, 0, 0.08].map((offset, i) => (
        <mesh
          key={`cw-${i}`}
          position={[xOffset - 2 + offset, sheaveY - cwCableLength / 2 - 0.5, -0.5]}
          castShadow
        >
          <cylinderGeometry args={[0.012, 0.012, cwCableLength, 8]} />
          <meshStandardMaterial color="#6b7280" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}

      {/* Horizontal rope section over sheave */}
      <mesh position={[xOffset - 1, sheaveY, 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 2.2, 8]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
};

// --- GUIDE RAILS ---
const GuideRails = ({ xOffset }: { xOffset: number }) => {
  const railColor = "#6b7280";

  return (
    <group>
      {/* Cabin Rails */}
      {[-1.05, 1.05].map((x, i) => (
        <mesh key={`rail-${i}`} position={[xOffset + x, SHAFT_HEIGHT / 2, 0]} castShadow>
          <boxGeometry args={[0.06, SHAFT_HEIGHT, 0.06]} />
          <meshStandardMaterial color={railColor} roughness={0.3} metalness={0.7} />
        </mesh>
      ))}

      {/* Counterweight Rails */}
      {[-2.15, -1.85].map((x, i) => (
        <mesh key={`cw-rail-${i}`} position={[xOffset + x, SHAFT_HEIGHT / 2, -0.8]} castShadow>
          <boxGeometry args={[0.05, SHAFT_HEIGHT, 0.05]} />
          <meshStandardMaterial color={railColor} roughness={0.3} metalness={0.7} />
        </mesh>
      ))}
    </group>
  );
};

// --- BUFFERS ---
const Buffers = ({ xOffset }: { xOffset: number }) => (
  <group position={[0, 0.25, 0]}>
    {/* Cabin Buffers */}
    {[-0.4, 0.4].map((x, i) => (
      <mesh key={i} position={[xOffset + x, 0, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.15, 0.4, 16]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.5} metalness={0.4} />
      </mesh>
    ))}
    {/* Counterweight Buffer */}
    <mesh position={[xOffset - 2, 0, -0.8]} castShadow>
      <cylinderGeometry args={[0.1, 0.12, 0.35, 16]} />
      <meshStandardMaterial color="#fbbf24" roughness={0.5} metalness={0.4} />
    </mesh>
  </group>
);

// --- HOISTWAY STRUCTURE ---
const Hoistway = ({ xOffset, liftId }: { xOffset: number; liftId: string }) => {
  const labelColor = liftId === 'A' ? "#3b82f6" : "#10b981";

  return (
    <group>
      {/* Back Wall */}
      <mesh position={[xOffset, SHAFT_HEIGHT / 2, -1.5]} receiveShadow>
        <boxGeometry args={[3.5, SHAFT_HEIGHT, 0.1]} />
        <meshStandardMaterial color="#e2e8f0" transparent opacity={0.2} roughness={0.8} />
      </mesh>

      {/* Floor Indicators */}
      {[0, 1, 2, 3, 4].map((floor) => (
        <mesh key={floor} position={[xOffset + 1.3, floor * FLOOR_HEIGHT + 0.5, 0.9]}>
          <boxGeometry args={[0.25, 0.25, 0.02]} />
          <meshStandardMaterial color={labelColor} roughness={0.5} />
        </mesh>
      ))}

      {/* Lift ID Label at top */}
      <mesh position={[xOffset, SHAFT_HEIGHT + 4, 0]}>
        <boxGeometry args={[0.8, 0.4, 0.05]} />
        <meshStandardMaterial color={labelColor} roughness={0.5} />
      </mesh>
    </group>
  );
};

// --- COMPLETE ELEVATOR SHAFT ---
const ElevatorShaft = ({ lift, xOffset }: { lift: LiftState; xOffset: number }) => {
  const floorPosition = Math.min(4, Math.max(0, lift.sensors.position / FLOOR_HEIGHT));
  const doorsOpen = lift.status === 'DOOR_OPEN' || lift.status === 'IDLE';
  const velocity = lift.status === 'MOVING'
    ? (lift.direction === 'UP' ? lift.sensors.velocity : -lift.sensors.velocity)
    : 0;

  return (
    <group>
      <Hoistway xOffset={xOffset} liftId={lift.id} />
      <GuideRails xOffset={xOffset} />
      <GearlessTractionMachine velocity={velocity} xOffset={xOffset} />
      <WireRopes cabinPosition={floorPosition} xOffset={xOffset} />
      <ElevatorCabin position={floorPosition} doorsOpen={doorsOpen} xOffset={xOffset} liftId={lift.id} />
      <Counterweight cabinPosition={floorPosition} xOffset={xOffset} />
      <Buffers xOffset={xOffset} />
    </group>
  );
};

// --- MAIN SCENE COMPONENT ---
interface SceneProps {
  liftA: LiftState;
  liftB: LiftState;
}

export const Elevator3DScene: React.FC<SceneProps> = ({ liftA, liftB }) => {
  return (
    <div className="w-full h-full bg-slate-900 relative overflow-hidden">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 12, 18]} fov={50} />
        <WASDCameraControls />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 25, 10]} intensity={1.5} castShadow shadow-mapSize={2048} />
        <pointLight position={[-8, 20, 8]} intensity={1} color="#ffffff" />
        <spotLight position={[0, 25, 0]} intensity={2} angle={0.5} penumbra={1} castShadow />

        {/* Elevator Shafts - Side by Side */}
        <ElevatorShaft lift={liftA} xOffset={-SHAFT_SPACING / 2} />
        <ElevatorShaft lift={liftB} xOffset={SHAFT_SPACING / 2} />

        {/* Ground Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color="#475569" metalness={0.2} roughness={0.8} />
        </mesh>

        {/* Divider between shafts */}
        <mesh position={[0, SHAFT_HEIGHT / 2, -0.5]}>
          <boxGeometry args={[0.15, SHAFT_HEIGHT, 3]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
      </Canvas>

      {/* HUD Overlay */}
      <div className="absolute bottom-4 left-4 flex gap-4">
        {/* Lift A Status */}
        <div className="bg-blue-900/70 border border-blue-500 text-white p-3 rounded-lg text-sm font-mono">
          <div className="text-blue-400 font-bold mb-1">LIFT A</div>
          <div>Floor: {Math.round(liftA.sensors.position / FLOOR_HEIGHT)}</div>
          <div>Status: {liftA.status}</div>
          <div>Speed: {liftA.sensors.velocity.toFixed(2)} m/s</div>
        </div>
        {/* Lift B Status */}
        <div className="bg-green-900/70 border border-green-500 text-white p-3 rounded-lg text-sm font-mono">
          <div className="text-green-400 font-bold mb-1">LIFT B</div>
          <div>Floor: {Math.round(liftB.sensors.position / FLOOR_HEIGHT)}</div>
          <div>Status: {liftB.status}</div>
          <div>Speed: {liftB.sensors.velocity.toFixed(2)} m/s</div>
        </div>
      </div>

      {/* Controls Help */}
      <div className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-lg text-xs">
        <div className="font-bold mb-1">Controls</div>
        <div>W/A/S/D - Move</div>
        <div>Scroll - Zoom</div>
        <div>Drag - Look</div>
      </div>
    </div>
  );
};
