import React, { useEffect, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { gsap } from "gsap";

export default function SolutionCard3D({ position, data, delay }) {
  const groupRef = useRef();

  useEffect(() => {
    if (groupRef.current) {
      gsap.fromTo(
        groupRef.current.position,
        { y: position[1] - 10, opacity: 0 },
        { y: position[1], opacity: 1, duration: 0.8, delay, ease: "back.out" }
      );
    }
  }, [delay, position]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.z += 0.002;
    }
  });

  const priorityColor = {
    URGENT: "#EA5022",
    HIGH: "#E79EA1",
    MEDIUM: "#66C2CC",
    LOW: "#289F7A"
  };

  return (
    <group ref={groupRef} position={position}>
      <mesh castShadow>
        <boxGeometry args={[4.5, 3.5, 0.3]} />
        <meshPhysicalMaterial
          color="#0d1b2a"
          emissive={priorityColor[data.priority]}
          emissiveIntensity={0.35}
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>

      <Html position={[0, 0, 0.2]} scale={1} distanceFactor={1}>
        <div className="solution-card-3d">
          <div className="solution-icon-3d">{data.icon}</div>
          <h4 style={{ color: priorityColor[data.priority] }}>{data.title}</h4>
          <span className={`priority-3d priority-${data.priority.toLowerCase()}`}>
            {data.priority}
          </span>
          <p>{data.description}</p>
          <div className="solution-meta">
            <span>⏱️ {data.timeline}</span>
            <span>💡 {data.expectedImpact}</span>
          </div>
        </div>
      </Html>
    </group>
  );
}