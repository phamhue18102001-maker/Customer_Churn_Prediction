import React, { useEffect, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { gsap } from "gsap";

export default function KPICard3D({ position, data, delay }) {
  const groupRef = useRef();
  const meshRef = useRef();

  useEffect(() => {
    if (groupRef.current) {
      gsap.fromTo(
        groupRef.current.position,
        { z: -10, opacity: 0 },
        { z: position[2], duration: 1, delay, ease: "power2.out" }
      );
    }
  }, [delay, position]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.position.y += Math.sin(Date.now() * 0.001) * 0.002;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[3, 4, 0.3]} />
        <meshPhysicalMaterial
          color="#0d1b2a"
          emissive="#00e5ff"
          emissiveIntensity={0.4}
          metalness={0.7}
          roughness={0.3}
          wireframe={false}
        />
      </mesh>

      <Html position={[0, 0, 0.2]} scale={1} distanceFactor={1}>
        <div className="kpi-card-3d">
          <div className="kpi-icon-3d">{data.icon}</div>
          <div className="kpi-label-3d">{data.label}</div>
          <div className="kpi-value-3d">{data.value}</div>
        </div>
      </Html>

      {/* Glow Effect */}
      <mesh position={[0, 0, -0.2]}>
        <boxGeometry args={[3.2, 4.2, 0.1]} />
        <meshBasicMaterial
          color="#00e5ff"
          transparent
          opacity={0.2}
        />
      </mesh>
    </group>
  );
}