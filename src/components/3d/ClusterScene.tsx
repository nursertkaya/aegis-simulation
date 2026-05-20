"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Line, Html, Text, Edges } from "@react-three/drei";
import { Suspense, useMemo, useRef, useState, useEffect } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { CinematicCamera } from "@/components/3d/CinematicCamera";
import { SceneControls } from "@/components/3d/SceneControls";
import { useViewportLayout } from "@/hooks/useViewportLayout";
import { useSimulationStore } from "@/store/simulationStore";
import { ShieldCheck } from "lucide-react";

function OutsideWorld({ spread }: { spread: number }) {
  const aggregatedRisk = useSimulationStore((s) => s.aggregatedRisk);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const targetColor = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const riskMultiplier = 1 + (aggregatedRisk / 50);
    const riskLevel = aggregatedRisk > 80 ? 'high' : aggregatedRisk > 50 ? 'medium' : 'low';
    
    const pulseIntensity = 0.05 * riskMultiplier;
    
    if (matRef.current) {
      matRef.current.emissiveIntensity = pulseIntensity + Math.sin(t * 1.5 * riskMultiplier) * pulseIntensity;
      
      if (riskLevel === 'high') targetColor.set("#ef4444");
      else if (riskLevel === 'medium') targetColor.set("#f59e0b");
      else targetColor.set("#94a3b8");
      matRef.current.emissive.lerp(targetColor, delta * 3);
    }
    
    if (groupRef.current) {
      const scale = 1 + Math.sin(t * 2 * riskMultiplier) * 0.005 * riskMultiplier;
      groupRef.current.scale.set(scale, 1, scale);
      
      if (riskLevel === 'high') {
        groupRef.current.position.y = Math.sin(t * 20) * 0.01;
        groupRef.current.position.x = -6 * spread + Math.cos(t * 25) * 0.01;
      } else {
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, 0, delta * 5);
        groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, -6 * spread, delta * 5);
      }
    }
  });

  return (
    <group position={[-6 * spread, 0, 0]} ref={groupRef}>
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.1, 32]} />
        <meshStandardMaterial ref={matRef} color="#f8fafc" emissive="#94a3b8" emissiveIntensity={0.05} roughness={0.1} />
        <Edges color="#1e293b" />
      </mesh>
      
      <Html position={[0, -0.6, 0]} center>
        <div className="text-slate-500 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap opacity-80 backdrop-blur-md bg-white/30 px-2 py-1 rounded border border-slate-200 shadow-sm">
          Developer Workstation / CI-CD Trigger
        </div>
      </Html>
    </group>
  );
}

function PolicyValidationLayer() {
  const visuals = useSimulationStore((s) => s.visuals);
  const simulationState = useSimulationStore((s) => s.simulationState);
  const currentScenario = useSimulationStore((s) => s.currentScenario);

  const [activeIdx, setActiveIdx] = useState(-1);
  const [results, setResults] = useState<Record<string, "pass" | "fail">>({});

  const POLICIES = useMemo(() => [
    { id: 'root', label: 'Root User' },
    { id: 'priv', label: 'Privileged Mode' },
    { id: 'path', label: 'HostPath' },
    { id: 'sec', label: 'Seccomp' },
    { id: 'tags', label: 'Immutable Tags' },
    { id: 'cap', label: 'Linux Capabilities' },
    { id: 'lim', label: 'Resource Limits' },
    { id: 'net', label: 'Host Network' },
  ], []);

  useEffect(() => {
    let isCancelled = false;
    
    if (simulationState === "SCANNING") {
      setActiveIdx(0);
      setResults({});
      
      const runChecks = async () => {
        const newResults: Record<string, "pass" | "fail"> = {};
        for (let i = 0; i < POLICIES.length; i++) {
          if (isCancelled) break;
          setActiveIdx(i);
          
          await new Promise(r => setTimeout(r, 200));
          if (isCancelled) break;

          const p = POLICIES[i];
          let status: "pass" | "fail" = "pass";

          if (currentScenario === "shadow_ai_drift" && p.id === "root") status = "fail";
          if (currentScenario === "stateless_multi_label" && (p.id === "root" || p.id === "path" || p.id === "priv")) status = "fail";
          if (currentScenario === "container_escape" && (p.id === "path" || p.id === "cap")) status = "fail";

          newResults[p.id] = status;
          setResults({ ...newResults });

          if (status === "fail") {
            break;
          }
        }
        if (!isCancelled) setActiveIdx(-1);
      };
      
      runChecks();
    } else if (simulationState === "STOPPED" || simulationState === "IDLE") {
      setActiveIdx(-1);
      setResults({});
    }

    return () => { isCancelled = true; };
  }, [simulationState, currentScenario, POLICIES]);

  const isVisible = simulationState === "SCANNING" || (Object.keys(results).length > 0 && simulationState === "PLAYING");

  if (!isVisible && Object.keys(results).length === 0) return null;

  return (
    <Html position={[1.5, 0.8, 0]} center zIndexRange={[100, 0]}>
      <div className={`pointer-events-none transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
        <div className="flex flex-col gap-1 w-48 bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-lg p-3 shadow-[0_0_20px_rgba(0,0,0,0.4)]">
          <div className="text-[8px] text-cyan-400 uppercase tracking-[0.2em] font-bold mb-1 border-b border-slate-700/50 pb-1.5 flex justify-between items-center">
            <span>Policy Stream</span>
            {activeIdx !== -1 && <span className="animate-pulse text-amber-400">EVALUATING</span>}
          </div>
          {POLICIES.map((p, idx) => {
            const res = results[p.id];
            const isActive = activeIdx === idx;
            const isPending = !res && !isActive;
            
            if (isPending && activeIdx !== -1 && idx > activeIdx + 1) return null;
            
            let colorClass = "text-slate-500";
            let icon = "○";
            if (isActive) { colorClass = "text-cyan-400"; icon = "●"; }
            else if (res === "pass") { colorClass = "text-emerald-400"; icon = "✓"; }
            else if (res === "fail") { colorClass = "text-red-500 font-bold"; icon = "✕"; }

            const opacityClass = (res === "pass" && activeIdx !== -1 && idx < activeIdx - 1) ? "opacity-40" : "opacity-100";

            return (
              <div key={p.id} className={`flex items-center justify-between text-[10px] font-mono tracking-wider transition-all duration-300 ${colorClass} ${opacityClass}`}>
                <span className="truncate pr-2">{p.label}</span>
                <span className={isActive ? "animate-pulse" : ""}>{icon}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Html>
  );
}

function BehavioralDriftLayer() {
  const visuals = useSimulationStore((s) => s.visuals);
  const simulationState = useSimulationStore((s) => s.simulationState);
  const currentScenario = useSimulationStore((s) => s.currentScenario);
  
  const isActiveScenario = currentScenario === "shadow_ai_drift" || currentScenario === "stateless_multi_label" || currentScenario === "container_escape";
  const [step, setStep] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    if (simulationState === "SCANNING") {
      setStep(0);
      setTimeout(() => !isCancelled && setStep(1), 600);
      setTimeout(() => !isCancelled && setStep(2), 1200);
      setTimeout(() => !isCancelled && setStep(3), 1800);
    } else if (simulationState === "STOPPED" || simulationState === "IDLE") {
      setStep(0);
    }
    return () => { isCancelled = true; };
  }, [simulationState]);

  const isVisible = isActiveScenario && (simulationState === "SCANNING" || (simulationState === "PLAYING" && visuals.pod.blockedAtGateway));

  const [shouldRender, setShouldRender] = useState(false);
  useEffect(() => {
    if (isVisible) setShouldRender(true);
    else {
      const t = setTimeout(() => setShouldRender(false), 1000);
      return () => clearTimeout(t);
    }
  }, [isVisible]);

  if (!shouldRender && !isVisible) return null;

  let header = "NHI Governance";
  let items: { label: string; value: string; status: 'normal' | 'warn' | 'critical' }[] = [];

  if (currentScenario === "shadow_ai_drift") {
    header = "Identity Drift Analysis";
    items = [
      { label: "Declared Label", value: "tier=frontend", status: 'normal' },
      { label: "Runtime Context", value: "runAsUser: 0 (ROOT)", status: step >= 1 ? 'critical' : 'normal' },
      { label: "Behavioral Vector", value: "Identity Masquerading", status: step >= 2 ? 'warn' : 'normal' },
    ];
  } else if (currentScenario === "stateless_multi_label") {
    header = "Heuristic Anomaly Detection";
    items = [
      { label: "Profile Baseline", value: "Stateless App", status: 'normal' },
      { label: "Operational Drift", value: "hostPath Mount Request", status: step >= 1 ? 'warn' : 'normal' },
      { label: "Risk Forecast", value: "Privilege Escalation", status: step >= 2 ? 'critical' : 'normal' },
    ];
  } else if (currentScenario === "container_escape") {
    header = "Predictive Risk Evaluation";
    items = [
      { label: "Volume Vector", value: "Node Boundary Traversal", status: step >= 0 ? 'warn' : 'normal' },
      { label: "Kernel Capability", value: "SYS_ADMIN Requested", status: step >= 1 ? 'critical' : 'normal' },
      { label: "Signature Analysis", value: "MITRE ATT&CK T1611", status: step >= 2 ? 'critical' : 'normal' },
    ];
  }

  return (
    <Html position={[-1.5, 0.8, 0]} center zIndexRange={[100, 0]}>
      <div className={`pointer-events-none transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
        <div className="flex flex-col gap-2 w-56 bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-lg p-3 shadow-[0_0_20px_rgba(0,0,0,0.4)]">
          <div className="text-[8px] text-blue-400 uppercase tracking-[0.2em] font-bold mb-1 border-b border-slate-700/50 pb-1.5 flex justify-between items-center">
            <span>{header}</span>
            <span className={step < 3 ? "animate-pulse text-cyan-400" : "text-amber-400"}>
              {step < 3 ? "ANALYZING" : "DETECTED"}
            </span>
          </div>
          
          <div className="flex flex-col gap-2.5 mt-0.5">
            {items.map((item, idx) => {
              const valueColor = item.status === 'critical' ? 'text-red-400 font-bold' : item.status === 'warn' ? 'text-amber-400' : 'text-slate-300';
              const showItem = step >= idx;
              
              return (
                <div key={idx} className={`flex flex-col transition-all duration-500 ${showItem ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
                  <span className="text-[7.5px] text-slate-500 uppercase tracking-widest">{item.label}</span>
                  <span className={`text-[9.5px] font-mono tracking-wide transition-colors duration-300 ${valueColor}`}>
                    {item.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Html>
  );
}

function AegisCoreSystem({ spread }: { spread: number }) {
  const visuals = useSimulationStore((s) => s.visuals);
  const aggregatedRisk = useSimulationStore((s) => s.aggregatedRisk);
  const axis1 = useRef<THREE.Mesh>(null);
  const axis2 = useRef<THREE.Mesh>(null);
  const laserRef = useRef<THREE.Mesh>(null);
  const coreGroupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const riskMultiplier = 1 + (aggregatedRisk / 50);
    const riskLevel = aggregatedRisk > 80 ? 'high' : aggregatedRisk > 50 ? 'medium' : 'low';

    if (axis1.current) {
      axis1.current.rotation.x = t * riskMultiplier;
      axis1.current.rotation.y = t * 0.5 * riskMultiplier;
    }
    if (axis2.current) {
      axis2.current.rotation.y = -t * riskMultiplier;
      axis2.current.rotation.z = t * 0.8 * riskMultiplier;
    }
    if (laserRef.current && visuals.coreAura !== "neutral" && visuals.coreAura !== "success") {
      const scale = (t * 5 * riskMultiplier) % 3;
      laserRef.current.scale.set(scale, scale, scale);
      (laserRef.current.material as THREE.MeshBasicMaterial).opacity = 1 - (scale / 3);
    }
    if (coreGroupRef.current) {
      const scale = 1 + Math.sin(t * 3 * riskMultiplier) * 0.01 * riskMultiplier;
      coreGroupRef.current.scale.set(scale, scale, scale);
      coreGroupRef.current.position.y = 0.5 + Math.sin(t * 2 * riskMultiplier) * 0.02;
      
      if (riskLevel === 'high') {
        coreGroupRef.current.position.x = Math.sin(t * 30) * 0.01;
      } else {
        coreGroupRef.current.position.x = THREE.MathUtils.lerp(coreGroupRef.current.position.x, 0, delta * 5);
      }
    }
  });

  const baseColor = visuals.coreAura === "purple" ? "#a855f7" : visuals.coreAura === "red" ? "#ef4444" : visuals.coreAura === "orange" ? "#f97316" : visuals.coreAura === "amber" ? "#f59e0b" : visuals.coreAura === "success" ? "#10b981" : visuals.coreAura === "scan" ? "#3b82f6" : "#0ea5e9";
  const emissiveInt = visuals.coreAura === "neutral" ? 0.8 : 2.5;

  return (
    <group position={[0, 0.5, 0]} ref={coreGroupRef}>
        <PolicyValidationLayer />
        <BehavioralDriftLayer />
        {/* Güçlü Mavi Kapı Kalkanı (Strong Portal Ring) */}
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <ringGeometry args={[0.6, 1.4, 64]} />
          <meshStandardMaterial color={baseColor} emissive={baseColor} emissiveIntensity={emissiveInt} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
        
        <mesh ref={axis1} castShadow>
          <torusGeometry args={[0.8, 0.02, 16, 64]} />
          <meshStandardMaterial color={baseColor} emissive={baseColor} emissiveIntensity={emissiveInt} metalness={0.8} roughness={0.2} transparent opacity={0.8} />
        </mesh>
        <mesh ref={axis2} castShadow>
          <torusGeometry args={[0.6, 0.02, 16, 64]} />
          <meshStandardMaterial color={baseColor} emissive={baseColor} emissiveIntensity={emissiveInt} metalness={0.8} roughness={0.2} transparent opacity={0.8} />
        </mesh>
        <mesh castShadow>
          <sphereGeometry args={[0.2, 32, 32]} />
          <meshPhysicalMaterial color="#ffffff" transmission={0.9} roughness={0.1} metalness={0.5} ior={1.5} transparent opacity={0.5} />
        </mesh>
        
        {visuals.coreAura !== "neutral" && visuals.coreAura !== "success" && (
          <mesh ref={laserRef} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.8, 0.85, 64]} />
            <meshBasicMaterial color={baseColor} transparent opacity={0.8} side={THREE.DoubleSide} />
          </mesh>
        )}

      <Html position={[0, -1.2, 0]} center>
        <div className="text-blue-600 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap bg-white/90 px-3 py-1.5 rounded backdrop-blur-md shadow-sm border border-blue-200">
          AEGIS Webhook Gate
        </div>
      </Html>
    </group>
  );
}

function VolumetricPlasma({ spread, shieldWallActive, isImpact }: { spread: number; shieldWallActive: boolean; isImpact: boolean }) {
  const lineCount = 15;
  const pointsCount = 60;
  const linesRef = useRef<THREE.Line[]>([]);
  const targetColor = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();
    
    if (isImpact) targetColor.set("#ef4444");
    else targetColor.set("#0ea5e9");

    for (let i = 0; i < lineCount; i++) {
      const line = linesRef.current[i];
      if (line) {
        (line.material as THREE.LineBasicMaterial).color.lerp(targetColor, delta * 8);
        
        const pulse = 0.5 + Math.sin(time * 3 + i) * 0.4;
        (line.material as THREE.LineBasicMaterial).opacity = isImpact ? 1.0 : pulse;

        const pos = line.geometry.attributes.position.array as Float32Array;
        for (let j = 0; j < pointsCount; j++) {
          const idx = j * 3;
          
          const zBase = (j / pointsCount) * 6 * spread - 3 * spread;
          const flowOffset = (time * 2.5 + i * 0.2) % (6 * spread);
          let z = zBase + flowOffset;
          if (z > 3 * spread) z -= 6 * spread;
          
          let x = Math.sin(time * 2 + z * 2 + i) * 1.5 + Math.sin(time * 5 + i)*0.5;
          let y = Math.cos(time * 1.5 + z * 2 + i * 1.2) * 1.5 + Math.cos(time * 4 + i)*0.5;
          
          if (shieldWallActive) {
            const distToWall = Math.abs(z);
            const pullFactor = Math.max(0, 1 - distToWall / (1.5 * spread));
            const ripple = isImpact ? Math.sin(distToWall * 15 - time * 20) * 0.4 : 0;
            x = THREE.MathUtils.lerp(x, Math.sin(time * 20 + i) * 0.8 + ripple, pullFactor);
            y = THREE.MathUtils.lerp(y, Math.cos(time * 20 + i) * 2.0 + ripple, pullFactor);
          } else if (isImpact) {
            x += Math.sin(z * 8 - time * 15) * 0.2;
            y += Math.cos(z * 8 - time * 15) * 0.2;
          }
          
          pos[idx] = x;
          pos[idx+1] = y;
          pos[idx+2] = z;
        }
        line.geometry.attributes.position.needsUpdate = true;
      }
    }
  });

  return (
    <group>
      {Array.from({ length: lineCount }).map((_, i) => (
        <line key={i} ref={(el: any) => { if(el) linesRef.current[i] = el; }}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={pointsCount} args={[new Float32Array(pointsCount * 3), 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#0ea5e9" transparent opacity={0.9} linewidth={3} depthWrite={false} />
        </line>
      ))}
    </group>
  );
}

function GrandKubernetesContainer({ spread }: { spread: number }) {
  const visuals = useSimulationStore((s) => s.visuals);
  const aggregatedRisk = useSimulationStore((s) => s.aggregatedRisk);
  const dynaGridWallRef = useRef<THREE.Mesh>(null);
  const ciliumRingAlpha = useRef<THREE.Mesh>(null);
  const ciliumRingBeta = useRef<THREE.Mesh>(null);
  const eBpfGridRef = useRef<THREE.Mesh>(null);
  const containerBoxRef = useRef<THREE.Mesh>(null);
  const tenantAlphaRef = useRef<THREE.Group>(null);
  const tenantBetaRef = useRef<THREE.Group>(null);
  const targetBoxColor = useMemo(() => new THREE.Color(), []);
  const ringColorTargetA = useMemo(() => new THREE.Color(), []);
  const ringColorTargetB = useMemo(() => new THREE.Color(), []);
  
  const customGridShader = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        baseColor: { value: new THREE.Color("#0ea5e9") },
        emissiveIntensity: { value: 2.0 },
        opacityValue: { value: 0.0 },
        impactRipple: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 baseColor;
        uniform float emissiveIntensity;
        uniform float opacityValue;
        uniform float impactRipple;
        varying vec2 vUv;
        void main() {
          float scrollY = vUv.y - time * 2.0;
          float gridX = sin(vUv.x * 100.0);
          float gridY = sin(scrollY * 50.0);
          float grid = max(smoothstep(0.95, 1.0, gridX), smoothstep(0.95, 1.0, gridY));
          
          float dist = distance(vUv, vec2(0.5, 0.5));
          float ripple = sin(dist * 40.0 - time * 15.0) * impactRipple * 2.0;
          grid = clamp(grid + ripple, 0.0, 1.0);
          
          vec3 finalColor = baseColor * grid * emissiveIntensity;
          gl_FragColor = vec4(finalColor, grid * opacityValue);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }, []);

  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();
    const riskMultiplier = 1 + (aggregatedRisk / 50);
    const riskLevel = aggregatedRisk > 80 ? 'high' : aggregatedRisk > 50 ? 'medium' : 'low';

    if (containerBoxRef.current) {
      const scale = 1 + Math.sin(time * 0.5 * riskMultiplier) * 0.003;
      containerBoxRef.current.scale.set(scale, 1, scale);
      
      const mat = containerBoxRef.current.material as THREE.MeshStandardMaterial;
      if (riskLevel === 'high') targetBoxColor.set("#fecaca");
      else if (riskLevel === 'medium') targetBoxColor.set("#fef3c7");
      else targetBoxColor.set("#cbd5e1");
      mat.color.lerp(targetBoxColor, delta * 3);

      if (riskLevel === 'high') {
        containerBoxRef.current.position.x = Math.sin(time * 15) * 0.01;
        containerBoxRef.current.position.z = Math.cos(time * 17) * 0.01;
      } else {
        containerBoxRef.current.position.x = THREE.MathUtils.lerp(containerBoxRef.current.position.x, 0, delta * 5);
        containerBoxRef.current.position.z = THREE.MathUtils.lerp(containerBoxRef.current.position.z, 0, delta * 5);
      }
    }

    if (tenantAlphaRef.current) {
      tenantAlphaRef.current.position.y = Math.sin(time * 1.5 * riskMultiplier) * 0.015;
    }
    if (tenantBetaRef.current) {
      tenantBetaRef.current.position.y = Math.cos(time * 1.2 * riskMultiplier + 1) * 0.015;
    }

    if (ciliumRingAlpha.current && ciliumRingBeta.current) {
      ciliumRingAlpha.current.rotation.z = time * riskMultiplier;
      ciliumRingAlpha.current.rotation.x = time * 0.5 * riskMultiplier;
      ciliumRingBeta.current.rotation.z = -time * riskMultiplier;
      ciliumRingBeta.current.rotation.x = time * 0.5 * riskMultiplier;

      const isolationActive = visuals.isolationBarrier.active || visuals.isolationBarrier.shieldWall;
      const baseRingColor = aggregatedRisk > 80 ? "#ef4444" : aggregatedRisk > 50 ? "#f97316" : "#0ea5e9";
      const targetColorStr = isolationActive ? "#f59e0b" : baseRingColor;
      const targetEmissive = isolationActive ? 6.0 : 3.0;

      const matA = ciliumRingAlpha.current.material as THREE.MeshStandardMaterial;
      const matB = ciliumRingBeta.current.material as THREE.MeshStandardMaterial;
      
      ringColorTargetA.set(targetColorStr);
      matA.color.lerp(ringColorTargetA, delta * 5);
      matA.emissive.lerp(ringColorTargetA, delta * 5);
      matA.emissiveIntensity = THREE.MathUtils.lerp(matA.emissiveIntensity, targetEmissive, delta * 5);

      ringColorTargetB.set(targetColorStr);
      matB.color.lerp(ringColorTargetB, delta * 5);
      matB.emissive.lerp(ringColorTargetB, delta * 5);
      matB.emissiveIntensity = THREE.MathUtils.lerp(matB.emissiveIntensity, targetEmissive, delta * 5);
    }

    if (eBpfGridRef.current) {
      let opacity = visuals.isolationBarrier.shieldWall ? 0.8 : 0.5 + Math.sin(time * 3 * riskMultiplier) * 0.15;
      if (riskLevel === 'medium') opacity += Math.random() * 0.1 - 0.05;
      if (riskLevel === 'high') opacity += Math.random() * 0.2 - 0.1;
      (eBpfGridRef.current.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.clamp(opacity, 0, 1);
      eBpfGridRef.current.position.y = -3.8 + Math.sin(time * 0.8 * riskMultiplier) * (riskLevel === 'high' ? 0.1 : 0.05);
    }

    if (dynaGridWallRef.current) {
      customGridShader.uniforms.time.value = time;
      
      const targetRipple = visuals.dataParticles.impact ? 1.0 : 0.0;
      customGridShader.uniforms.impactRipple.value = THREE.MathUtils.lerp(customGridShader.uniforms.impactRipple.value, targetRipple, delta * 15);

      if (visuals.isolationBarrier.active) {
        customGridShader.uniforms.opacityValue.value = THREE.MathUtils.lerp(customGridShader.uniforms.opacityValue.value, 1.0, delta * 5);
      } else {
        customGridShader.uniforms.opacityValue.value = THREE.MathUtils.lerp(customGridShader.uniforms.opacityValue.value, 0.0, delta * 5);
      }

      if (visuals.isolationBarrier.shieldWall) {
        customGridShader.uniforms.baseColor.value.set("#f59e0b"); 
        customGridShader.uniforms.emissiveIntensity.value = 8.0; 
        dynaGridWallRef.current.position.y = 1.8 + Math.sin(time * 40) * 0.05;
      } else {
        customGridShader.uniforms.baseColor.value.set("#0ea5e9"); 
        customGridShader.uniforms.emissiveIntensity.value = 2.0;
        dynaGridWallRef.current.position.y = 1.8;
      }
    }
  });

  return (
    <group position={[4.5 * spread, 0, 0]}>
      {/* THE GRAND CONTAINER */}
      <mesh ref={containerBoxRef} position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[6 * spread, 8, 6 * spread]} />
        <meshStandardMaterial 
          color="#cbd5e1" 
          transparent 
          opacity={0.15} 
          depthWrite={false}
        />
        <Edges color="#0f172a" />
      </mesh>

      <Html position={[0, 4.5, 0]} center>
        <div className="text-slate-500 font-bold text-[12px] uppercase tracking-[0.3em] whitespace-nowrap opacity-90 backdrop-blur-sm bg-white/80 px-3 py-1 rounded border border-slate-400 shadow-md">
          Kubernetes Cluster Boundary
        </div>
      </Html>

      <mesh ref={eBpfGridRef} position={[0, -3.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.8 * spread, 5.8 * spread, 20, 20]} />
        <meshBasicMaterial color="#0ea5e9" wireframe transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Volumetric Plasma Ribbons System */}
      <VolumetricPlasma spread={spread} shieldWallActive={visuals.isolationBarrier.shieldWall} isImpact={visuals.dataParticles.impact} />

      <group ref={tenantAlphaRef} position={[0, 0, -1.2 * spread]}>
        <gridHelper args={[2.5, 10, "#93c5fd", "#eff6ff"]} position={[0, -0.01, 0]} />
        <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[2.5, 2.5]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
          <Edges color="#1e293b" />
        </mesh>
        <mesh ref={ciliumRingAlpha} position={[0, 0.4, 0]}>
          <torusGeometry args={[1.5, 0.02, 16, 64]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={3} transparent opacity={0.8} />
        </mesh>
        <Html position={[0, -0.4, 0]} center>
          <div className="text-blue-600 font-bold text-[9px] uppercase tracking-[0.2em] whitespace-nowrap backdrop-blur-sm bg-white/40 px-2 py-0.5 rounded-full shadow-sm border border-blue-100">
            Tenant-Alpha Namespace (Production)
          </div>
        </Html>
      </group>

      <group ref={tenantBetaRef} position={[0, 0, 1.2 * spread]}>
        <gridHelper args={[2.5, 10, "#6ee7b7", "#ecfdf5"]} position={[0, -0.01, 0]} />
        <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[2.5, 2.5]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
          <Edges color="#1e293b" />
        </mesh>
        <mesh ref={ciliumRingBeta} position={[0, 0.4, 0]}>
          <torusGeometry args={[1.5, 0.02, 16, 64]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={3} transparent opacity={0.8} />
        </mesh>
        <Html position={[0, -0.4, 0]} center>
          <div className="text-emerald-600 font-bold text-[9px] uppercase tracking-[0.2em] whitespace-nowrap backdrop-blur-sm bg-white/40 px-2 py-0.5 rounded-full shadow-sm border border-emerald-100">
            Tenant-Beta Namespace (Isolated Dev)
          </div>
        </Html>
      </group>

      {visuals.ciliumAlertActive && (
        <Html position={[0, 5.5, 0]} center zIndexRange={[100, 0]}>
          <div className="flex animate-bounce items-center gap-2 rounded-xl border border-blue-400 bg-blue-900/90 px-4 py-2 shadow-[0_0_30px_-5px_rgba(59,130,246,0.6)] backdrop-blur-md">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
            <span className="font-mono text-[11px] font-bold tracking-wide text-white">
              Network Secured: Cilium eBPF Policy Enforced
            </span>
          </div>
        </Html>
      )}

      {/* Dyna-Shield Wall */}
      <group position={[0, 0, 0]}>
        <mesh ref={dynaGridWallRef} position={[0, 1.8, 0]}>
          <planeGeometry args={[5.5, 4.5]} />
          <primitive object={customGridShader} attach="material" />
        </mesh>

        {visuals.isolationBarrier.active && (
          <Html position={[0, visuals.isolationBarrier.shieldWall ? 4.6 : 1.8, 0]} center>
            <div className={`text-white px-2 py-1 rounded font-bold uppercase whitespace-nowrap shadow-lg transition-colors ${visuals.isolationBarrier.shieldWall ? 'bg-amber-600 shadow-amber-500/60 text-[12px] animate-pulse border-2 border-white' : 'bg-cyan-600 shadow-cyan-500/40 text-[9px]'}`}>
              {visuals.isolationBarrier.shieldWall ? 'CILIUM DYNA-SHIELD ACTIVE' : 'Cilium default-deny Boundary'}
            </div>
          </Html>
        )}

        {visuals.dataParticles.impact && (
          <Html position={[0, 0.5, -0.2]} center>
            <div className="w-20 h-20 rounded-full bg-slate-900/90 blur-xl animate-pulse" />
          </Html>
        )}
      </group>
    </group>
  );
}

function DynamicScenarioElements({ spread }: { spread: number }) {
  const visuals = useSimulationStore((s) => s.visuals);
  const groupRef = useRef<THREE.Group>(null);
  const escapeRef = useRef<THREE.Mesh>(null);
  const textRef = useRef<THREE.Group>(null);
  const containmentMatrixRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock, camera }) => {
    if (escapeRef.current && visuals.pod.type === "escape") {
      escapeRef.current.rotation.x = clock.getElapsedTime() * 2;
      escapeRef.current.rotation.y = clock.getElapsedTime() * 3;
    }
    if (textRef.current) {
      textRef.current.quaternion.copy(camera.quaternion);
    }
    if (containmentMatrixRef.current && visuals.pod.blockedAtGateway) {
      containmentMatrixRef.current.rotation.y = clock.getElapsedTime() * 0.5;
      containmentMatrixRef.current.rotation.z = clock.getElapsedTime() * 0.2;
    }

    if (groupRef.current) {
      if (visuals.pod.animation === "lunge") {
        groupRef.current.position.z = visuals.pod.position[2] * spread + Math.sin(clock.getElapsedTime() * 25) * 0.8;
      } else {
        groupRef.current.position.z = visuals.pod.position[2] * spread;
      }
    }
  });

  const containmentColor = visuals.pod.type === "multivector" ? "#a855f7" : visuals.coreAura === "orange" || visuals.coreAura === "amber" || visuals.coreAura === "red" ? "#ef4444" : "#ef4444";

  return (
    <group>
      {visuals.pod.visible && (
        <group ref={groupRef} position={[visuals.pod.position[0] * spread, visuals.pod.position[1], visuals.pod.position[2] * spread]}>
          <mesh 
            position={[0, 0.4, 0]} 
            ref={visuals.pod.type === "escape" ? escapeRef : null} 
            rotation={[0, 0, 0]}
            castShadow
          >
            {visuals.pod.type === "escape" ? (
              <icosahedronGeometry args={[0.3, 0]} />
            ) : visuals.pod.type === "multivector" ? (
              <octahedronGeometry args={[0.3, 2]} />
            ) : (
              <capsuleGeometry args={[0.2, 0.4, 16, 32]} />
            )}
            <meshPhysicalMaterial 
              color={visuals.pod.badgeColor} 
              emissive={visuals.pod.badgeColor}
              emissiveIntensity={1.5}
              clearcoat={1}
              roughness={0.1}
            />
            <Edges color="#0f172a" />
          </mesh>
          
          {/* Removed containment wireframe box entirely to keep it clean */}
          
          <group ref={textRef} position={[0, 1.1, 0]}>
            {visuals.pod.badgeText.map((text, idx) => {
              const yOffset = (visuals.pod.badgeText.length - 1 - idx) * 0.15;
              return (
                <Text
                  key={idx}
                  position={[0, yOffset, 0]}
                  fontSize={0.1}
                  color={visuals.pod.badgeColor}
                  anchorX="center"
                  anchorY="middle"
                  outlineWidth={0.015}
                  outlineColor="#ffffff"
                  letterSpacing={0.02}
                  fontWeight="600"
                >
                  {text}
                </Text>
              );
            })}
          </group>
        </group>
      )}

      {visuals.networkLineActive && (
        <Line
          points={[[visuals.pod.position[0] * spread, visuals.pod.position[1] + 0.2, visuals.pod.position[2] * spread], [0, 0.5, 0]]}
          color="#06b6d4"
          lineWidth={3}
          dashed={true}
          dashSize={0.2}
          dashScale={2}
        />
      )}
    </group>
  );
}

function AmbientTraffic({ spread }: { spread: number }) {
  const aggregatedRisk = useSimulationStore((s) => s.aggregatedRisk);
  const line1Ref = useRef<any>(null);
  const line2Ref = useRef<any>(null);
  const line3Ref = useRef<any>(null);
  const targetColor1 = useMemo(() => new THREE.Color(), []);
  const targetColor2 = useMemo(() => new THREE.Color(), []);
  const targetColor3 = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const riskMultiplier = 1 + (aggregatedRisk / 50);
    const riskLevel = aggregatedRisk > 80 ? 'high' : aggregatedRisk > 50 ? 'medium' : 'low';

    if (line1Ref.current?.material) {
      line1Ref.current.material.dashOffset = -t * 0.8 * riskMultiplier;
      if (riskLevel === 'high') targetColor1.set("#ef4444");
      else if (riskLevel === 'medium') targetColor1.set("#f59e0b");
      else targetColor1.set("#64748b");
      line1Ref.current.material.color.lerp(targetColor1, delta * 3);
    }
    if (line2Ref.current?.material) {
      line2Ref.current.material.dashOffset = -t * 0.6 * riskMultiplier;
      if (riskLevel === 'high') targetColor2.set("#ef4444");
      else if (riskLevel === 'medium') targetColor2.set("#f59e0b");
      else targetColor2.set("#64748b");
      line2Ref.current.material.color.lerp(targetColor2, delta * 3);
    }
    if (line3Ref.current?.material) {
      line3Ref.current.material.dashOffset = -t * 0.6 * riskMultiplier;
      if (riskLevel === 'high') targetColor3.set("#ef4444");
      else if (riskLevel === 'medium') targetColor3.set("#f59e0b");
      else targetColor3.set("#64748b");
      line3Ref.current.material.color.lerp(targetColor3, delta * 3);
    }
  });

  return (
    <group position={[0, -0.15, 0]}>
      <Line ref={line1Ref} points={[[-6 * spread, 0, 0], [-1.5 * spread, 0, 0]]} color="#64748b" lineWidth={1.5} transparent opacity={0.25} dashed dashSize={0.2} gapSize={0.4} />
      <Line ref={line2Ref} points={[[1.5 * spread, 0, 0], [4.5 * spread, 0, -1.2 * spread]]} color="#64748b" lineWidth={1.5} transparent opacity={0.2} dashed dashSize={0.15} gapSize={0.5} />
      <Line ref={line3Ref} points={[[1.5 * spread, 0, 0], [4.5 * spread, 0, 1.2 * spread]]} color="#64748b" lineWidth={1.5} transparent opacity={0.2} dashed dashSize={0.15} gapSize={0.5} />
    </group>
  );
}

function SceneContent({
  layout,
  controlsRef,
}: {
  layout: ReturnType<typeof useViewportLayout>;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  return (
    <>
      <color attach="background" args={["#ffffff"]} />
      
      <ambientLight intensity={1.2} color="#ffffff" />
      <directionalLight
        castShadow
        position={[10, 20, 15]}
        intensity={2.5}
        color="#ffffff"
        shadow-mapSize={[layout.isMobile ? 1024 : 2048, layout.isMobile ? 1024 : 2048]}
        shadow-camera-far={1000}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-10, 8, -10]} intensity={1.5} color="#f8fafc" />

      <CinematicCamera layout={layout} controlsRef={controlsRef} />
      <SceneControls layout={layout} controlsRef={controlsRef} />

      <group position={[0, -0.5, 0]}>
        <OutsideWorld spread={layout.nodeSpread} />
        <AmbientTraffic spread={layout.nodeSpread} />
        <AegisCoreSystem spread={layout.nodeSpread} />
        <GrandKubernetesContainer spread={layout.nodeSpread} />
        <DynamicScenarioElements spread={layout.nodeSpread} />
      </group>

      <mesh position={[0, -2.55, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <shadowMaterial opacity={0.2} />
      </mesh>
      <gridHelper args={[100, 100, "#cbd5e1", "#f1f5f9"]} position={[0, -2.5, 0]} />

      <ContactShadows
        position={[0, -2.49, 0]}
        opacity={0.15}
        scale={layout.isMobile ? 20 : 40}
        blur={2.5}
        far={10}
        color="#000000"
      />

      {!layout.isMobile ? (
        <Environment preset="studio" environmentIntensity={0.6} />
      ) : null}
    </>
  );
}

function SceneLoader() {
  return (
    <mesh>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshBasicMaterial color="#e2e8f0" wireframe />
    </mesh>
  );
}

export function ClusterScene() {
  const layout = useViewportLayout();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const dpr = useMemo<[number, number]>(
    () => [1, layout.maxDpr],
    [layout.maxDpr],
  );

  const cameraPosition = useMemo<[number, number, number]>(
    () => [
      8.5 * layout.nodeSpread,
      5.2 * (layout.isMobile ? 0.92 : 1),
      10.5 * layout.nodeSpread,
    ],
    [layout.isMobile, layout.nodeSpread],
  );

  return (
    <div className="fixed inset-0 z-0 h-dvh w-full touch-none bg-white">
      <Canvas
        shadows
        dpr={dpr}
        gl={{
          antialias: !layout.isMobile,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
        }}
        camera={{
          position: cameraPosition,
          fov: layout.cameraFov,
          near: 0.1,
          far: 1000,
        }}
        performance={{ min: layout.isMobile ? 0.6 : 0.75 }}
        style={{ width: "100%", height: "100%", touchAction: "none" }}
      >
        <Suspense fallback={<SceneLoader />}>
          <SceneContent layout={layout} controlsRef={controlsRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
