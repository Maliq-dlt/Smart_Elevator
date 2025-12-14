
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { LiftState } from '../types/index';

// --- FIX FOR TYPESCRIPT ERRORS ---
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      boxGeometry: any;
      cylinderGeometry: any;
      planeGeometry: any;
      meshStandardMaterial: any;
      ambientLight: any;
      pointLight: any;
      spotLight: any;
    }
  }
}

// --- 3D COMPONENTS ---

const MotorHousing = () => {
  return (
    <group position={[0, 1.5, -1]}>
      {/* Main Block */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 1.5, 2]} />
        <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.8} />
      </mesh>
      {/* Cooling Fins */}
      {[-0.6, 0, 0.6].map((x, i) => (
         <mesh key={i} position={[x, 0.8, 0]} castShadow>
            <boxGeometry args={[0.1, 0.2, 1.8]} />
            <meshStandardMaterial color="#334155" />
         </mesh>
      ))}
    </group>
  );
}

const TractionSheave = ({ velocity }: { velocity: number }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
        // Convert linear velocity (m/s) to angular rotation (rads)
        // Sheave radius approx 0.5 units
        const angularSpeed = velocity / 0.5; 
        meshRef.current.rotation.x += angularSpeed * delta;
    }
  });

  return (
    <group ref={meshRef} position={[0, 1.5, 0.5]}>
       {/* The Wheel */}
       <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.8, 0.8, 0.6, 32]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.5} metalness={0.2} />
       </mesh>
       {/* Stripes for visualization */}
       <mesh rotation={[0, 0, Math.PI / 2]} position={[0.2, 0, 0]}>
          <boxGeometry args={[0.65, 1.5, 0.1]} />
          <meshStandardMaterial color="#000" />
       </mesh>
       <mesh rotation={[0, Math.PI/2, Math.PI / 2]} position={[-0.2, 0, 0]}>
          <boxGeometry args={[0.65, 1.5, 0.1]} />
          <meshStandardMaterial color="#000" />
       </mesh>
    </group>
  );
}

const Cables = ({ velocity, position }: { velocity: number, position: number }) => {
    // We simulate cable movement by just having them exist. 
    // In a real advanced shader we would offset UVs.
    return (
        <group>
            {/* Main Hoist Cables */}
            {[-0.2, 0, 0.2].map((x, i) => (
                <mesh key={i} position={[x, -5, 0.9]} rotation={[0,0,0]}>
                    <cylinderGeometry args={[0.02, 0.02, 15, 8]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
                </mesh>
            ))}
             {/* Counterweight Cables (Back) */}
             {[-0.2, 0, 0.2].map((x, i) => (
                <mesh key={i} position={[x, -5, 0.1]} rotation={[0,0,0]}>
                    <cylinderGeometry args={[0.02, 0.02, 15, 8]} />
                    <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.1} />
                </mesh>
            ))}
        </group>
    )
}

const BrakeSystem = ({ engaged }: { engaged: boolean }) => {
    return (
        <group position={[0.8, 1.5, 0.5]}>
             <mesh position={[0.2, 0, 0]} castShadow>
                <boxGeometry args={[0.4, 0.6, 0.8]} />
                <meshStandardMaterial color={engaged ? "#ef4444" : "#22c55e"} emissive={engaged ? "#7f1d1d" : "#000"} />
             </mesh>
        </group>
    )
}

interface SceneProps {
  lift: LiftState;
}

export const Elevator3DScene: React.FC<SceneProps> = ({ lift }) => {
  return (
    <div className="w-full h-full bg-slate-950 relative overflow-hidden">
        {/* Gradients for background aesthetics */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-slate-900 to-black opacity-80 z-0 pointer-events-none" />
        
        <Canvas shadows className="z-10">
            <PerspectiveCamera makeDefault position={[4, 3, 5]} fov={50} />
            <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 1.5} minDistance={3} maxDistance={10} />
            
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} castShadow />
            <spotLight position={[-5, 5, 5]} intensity={2} angle={0.5} penumbra={1} color="#3b82f6" castShadow />

            <group position={[0, 0, 0]}>
                <MotorHousing />
                {/* Note: In three.js Y is up. Velocity determines rotation speed. */}
                <TractionSheave velocity={lift.status === 'MOVING' ? (lift.direction === 'UP' ? lift.sensors.velocity : -lift.sensors.velocity) : 0} />
                <Cables velocity={lift.sensors.velocity} position={lift.sensors.position} />
                <BrakeSystem engaged={lift.safety.emergencyBrakeEngaged || lift.status === 'IDLE'} />
                
                {/* Floor/Base */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                    <planeGeometry args={[10, 10]} />
                    <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
                </mesh>
                <Grid position={[0, 0.01, 0]} args={[10, 10]} cellColor="#334155" sectionColor="#475569" fadeDistance={10} />
            </group>
        </Canvas>
    </div>
  );
};
