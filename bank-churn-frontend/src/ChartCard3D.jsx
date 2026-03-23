import React, { useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

export default function ChartCard3D({ position, data, title, color, rotation }) {
  const groupRef = useRef();

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.x = rotation[0] + Math.sin(Date.now() * 0.0005) * 0.05;
      groupRef.current.rotation.y = rotation[1] + Math.cos(Date.now() * 0.0003) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <mesh castShadow>
        <boxGeometry args={[5, 5, 0.4]} />
        <meshPhysicalMaterial
          color="#0d1b2a"
          emissive={color}
          emissiveIntensity={0.3}
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>

      <Html position={[0, 0, 0.3]} scale={0.015} distanceFactor={1}>
        <div className="chart-card-3d">
          <h3 style={{ color }}>{title}</h3>
          <svg width="300" height="150" style={{ marginTop: "10px" }}>
            <polyline
              points={data
                .map((val, idx) => `${(idx / (data.length - 1)) * 300},${150 - (val / Math.max(...data)) * 140}`)
                .join(" ")}
              fill="none"
              stroke={color}
              strokeWidth="3"
            />
          </svg>
          <p style={{ marginTop: "10px", fontSize: "12px" }}>
            Trị số cuối: {data[data.length - 1]}
          </p>
        </div>
      </Html>

      {/* Glow Border */}
      <mesh position={[0, 0, -0.3]}>
        <boxGeometry args={[5.2, 5.2, 0.2]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
        />
      </mesh>
    </group>
  );
}