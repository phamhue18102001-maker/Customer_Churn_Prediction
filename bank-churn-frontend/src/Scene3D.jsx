import React, { useEffect, useRef } from "react";
import { Html, useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { gsap } from "gsap";
import * as THREE from "three";
import KPICard3D from "./KPICard3D";
import InsightCard3D from "./InsightCard3D";
import SolutionCard3D from "./SolutionCard3D";
import ChartCard3D from "./ChartCard3D";

export default function Scene3D({
  bankData,
  analysis,
  insights,
  solutions,
  kpis,
  trend,
  scrollProgress,
  viewCustomer
}) {
  const sceneRef = useRef();
  const cameraRef = useRef();
  const groupsRef = useRef({
    kpi: null,
    charts: null,
    solutions: null,
    insights: null
  });

  useFrame(({ camera }) => {
    // Station 0 (0-0.25): KPI Overview
    if (scrollProgress <= 0.25) {
      const progress = scrollProgress / 0.25;
      camera.position.lerp(new THREE.Vector3(0, 0, 25), 0.1);
      camera.rotation.z = THREE.MathUtils.lerp(0, -0.1, progress);
    }
    // Station 1 (0.25-0.5): Charts
    else if (scrollProgress <= 0.5) {
      const progress = (scrollProgress - 0.25) / 0.25;
      camera.position.lerp(new THREE.Vector3(0, -5, 20), 0.1);
      camera.rotation.z = THREE.MathUtils.lerp(-0.1, 0.05, progress);
    }
    // Station 2 (0.5-0.75): Solutions
    else if (scrollProgress <= 0.75) {
      const progress = (scrollProgress - 0.5) / 0.25;
      camera.position.lerp(new THREE.Vector3(-5, -10, 18), 0.1);
      camera.rotation.z = THREE.MathUtils.lerp(0.05, -0.15, progress);
    }
    // Station 3 (0.75-1): Insights
    else {
      const progress = (scrollProgress - 0.75) / 0.25;
      camera.position.lerp(new THREE.Vector3(5, -15, 16), 0.1);
      camera.rotation.z = THREE.MathUtils.lerp(-0.15, 0, progress);
    }

    // Update card positions based on scroll
    if (groupsRef.current.kpi) {
      groupsRef.current.kpi.position.y = scrollProgress < 0.25 ? 0 : -50;
      groupsRef.current.kpi.rotation.y += 0.002;
    }
    if (groupsRef.current.charts) {
      groupsRef.current.charts.position.y = scrollProgress < 0.25 ? 30 : -10 + (scrollProgress - 0.25) * 40;
    }
    if (groupsRef.current.solutions) {
      groupsRef.current.solutions.position.z = scrollProgress < 0.5 ? 100 : -20 + (scrollProgress - 0.5) * 80;
    }
    if (groupsRef.current.insights) {
      groupsRef.current.insights.position.x = scrollProgress < 0.75 ? 100 : -20 + (scrollProgress - 0.75) * 80;
    }
  });

  return (
    <group ref={sceneRef}>
      {/* Background */}
      <mesh position={[0, 0, -50]}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial 
          color="#0a1929"
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Lights */}
      <ambientLight intensity={0.6} color="#00e5ff" />
      <pointLight position={[20, 20, 20]} intensity={1} color="#00e5ff" />
      <pointLight position={[-20, -20, 20]} intensity={0.8} color="#0288d1" />

      {/* Station 1: KPI Cards */}
      <group ref={(ref) => (groupsRef.current.kpi = ref)} position={[0, 0, 0]}>
        <KPICard3D position={[-8, 2, 0]} data={kpis[0]} delay={0} />
        <KPICard3D position={[8, 2, 0]} data={kpis[1]} delay={0.2} />
        <KPICard3D position={[-8, -6, 0]} data={kpis[2]} delay={0.4} />
        <KPICard3D position={[8, -6, 0]} data={kpis[3]} delay={0.6} />

        {/* Laptop Screen Display */}
        <mesh position={[0, 0, -2]}>
          <boxGeometry args={[16, 10, 0.5]} />
          <meshPhysicalMaterial 
            color="#1a2332"
            metalness={0.8}
            roughness={0.2}
            emissive="#00e5ff"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>

      {/* Station 2: Charts */}
      <group ref={(ref) => (groupsRef.current.charts = ref)} position={[0, 30, 0]}>
        <ChartCard3D 
          position={[-6, 0, 0]} 
          data={bankData.churn} 
          title="Churn (%)"
          color="#EA5022"
          rotation={[0, 0.3, 0]}
        />
        <ChartCard3D 
          position={[6, 0, 0]} 
          data={bankData.deposit} 
          title="Tiền gửi"
          color="#66C2CC"
          rotation={[0, -0.3, 0]}
        />
        <Html position={[0, -6, 2]} scale={0.1}>
          <div className="chart-label">
            Xu hướng tháng này: {analysis.currentMonth}%
          </div>
        </Html>
      </group>

      {/* Station 3: Solutions */}
      <group ref={(ref) => (groupsRef.current.solutions = ref)} position={[0, 0, 100]}>
        {solutions.slice(0, 3).map((solution, idx) => (
          <SolutionCard3D
            key={idx}
            position={[
              idx === 0 ? -6 : idx === 1 ? 0 : 6,
              -8,
              0
            ]}
            data={solution}
            delay={idx * 0.2}
          />
        ))}
      </group>

      {/* Station 4: Insights */}
      <group ref={(ref) => (groupsRef.current.insights = ref)} position={[100, 0, 0]}>
        {insights.slice(0, 2).map((insight, idx) => (
          <InsightCard3D
            key={idx}
            position={[
              0,
              idx === 0 ? 4 : -4,
              0
            ]}
            data={insight}
            severity={insight.severity}
            delay={idx * 0.3}
          />
        ))}
      </group>

      {/* Ambient Particles */}
      <Points bankData={bankData} scrollProgress={scrollProgress} />
    </group>
  );
}

function Points({ bankData, scrollProgress }) {
  const pointsRef = useRef();

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.x += 0.0001;
      pointsRef.current.rotation.y += 0.0002;
    }
  });

  const positions = new Float32Array(300);
  for (let i = 0; i < 300; i += 3) {
    positions[i] = (Math.random() - 0.5) * 100;
    positions[i + 1] = (Math.random() - 0.5) * 100;
    positions[i + 2] = (Math.random() - 0.5) * 100;
  }

  return (
    <points ref={pointsRef} position={[0, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={positions.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.3}
        color="#00e5ff"
        sizeAttenuation
        transparent
        opacity={0.4}
      />
    </points>
  );
}