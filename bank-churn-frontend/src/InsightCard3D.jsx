import React, { useEffect, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { gsap } from "gsap";

export default function InsightCard3D({ position, data, severity, delay }) {
  const groupRef = useRef();

  useEffect(() => {
    if (groupRef.current) {
      gsap.fromTo(
        groupRef.current.scale,
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 1, z: 1, duration: 0.6, delay, ease: "elastic.out(1, 0.5)" }
      );
    }
  }, [delay]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.z += 0.001;
    }
  });

  const severityColor = {
    high: "#EA5022",
    medium: "#66C2CC",
    low: "#289F7A"
  };

  return (
    <group ref={groupRef} position={position}>
      <mesh castShadow>
        <boxGeometry args={[5, 3, 0.3]} />
        <meshPhysicalMaterial
          color="#0d1b2a"
          emissive={severityColor[severity]}
          emissiveIntensity={0.3}
          metalness={0.4}
          roughness={0.6}
        />
      </mesh>

      <Html position={[0, 0, 0.2]} scale={1} distanceFactor={1}>
        <div className={`insight-card-3d insight-${severity}`}>
          <h4>{data.title}</h4>
          <p>{data.detail}</p>
        </div>
      </Html>
    </group>
  );
}