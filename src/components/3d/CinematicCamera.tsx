"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useSimulationStore } from "@/store/simulationStore";
import type { ViewportLayout } from "@/hooks/useViewportLayout";
import * as THREE from "three";

type CinematicCameraProps = {
  layout: ViewportLayout;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
};

export function CinematicCamera({ layout, controlsRef }: CinematicCameraProps) {
  const camera = useThree((state) => state.camera);
  const currentScenario = useSimulationStore((s) => s.currentScenario);
  const simulationState = useSimulationStore((s) => s.simulationState);
  const visuals = useSimulationStore((s) => s.visuals);
  const activeCameraMode = useSimulationStore((s) => s.activeCameraMode);
  
  const defaultPosition = useRef(new THREE.Vector3(8.5, 5.2, 10.5));
  const defaultTarget = useRef(new THREE.Vector3(0, 0, 0));
  
  const isTransitioningToOverview = useRef(false);
  const isTransitioningToCinematic = useRef(false);

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    camera.fov = layout.cameraFov;
    camera.aspect = layout.width / Math.max(layout.height, 1);
    camera.updateProjectionMatrix();
  }, [camera, layout.width, layout.height, layout.cameraFov]);

  useEffect(() => {
    if (activeCameraMode === "OVERVIEW") {
      isTransitioningToOverview.current = true;
      isTransitioningToCinematic.current = false;
      if (controlsRef.current) {
        controlsRef.current.enableDamping = true;
        controlsRef.current.dampingFactor = 0.05;
      }
    } else {
      isTransitioningToCinematic.current = true;
      isTransitioningToOverview.current = false;
    }
  }, [activeCameraMode, controlsRef]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    const spread = layout.nodeSpread;
    const isPlaying = simulationState === "PLAYING" || simulationState === "SCANNING";
    const isCompleted = simulationState === "COMPLETED";

    if (activeCameraMode === "OVERVIEW") {
      if (isTransitioningToOverview.current) {
        // Updated OVERVIEW coordinates based on final masterpiece instructions
        const targetCamPos = new THREE.Vector3(0, 14 * (layout.isMobile ? 1.5 : 1), 0.5);
        const targetLookAt = new THREE.Vector3(0, 0, 0);
        
        camera.position.lerp(targetCamPos, 3.5 * delta);
        controls.target.lerp(targetLookAt, 4.0 * delta);
        
        if (camera.position.distanceTo(targetCamPos) < 0.1) {
          isTransitioningToOverview.current = false;
        }
        controls.update();
      }
      return;
    }

    // CINEMATIC MODE
    let targetCamPos = new THREE.Vector3(
      defaultPosition.current.x * spread,
      defaultPosition.current.y * (layout.isMobile ? 0.92 : 1),
      defaultPosition.current.z * spread
    );
    let targetLookAt = new THREE.Vector3(
      defaultTarget.current.x,
      defaultTarget.current.y,
      defaultTarget.current.z
    );

    let shouldLerp = false;

    if (isPlaying || isCompleted) {
      shouldLerp = true;
      if (currentScenario === "secure_admission" || currentScenario === "shadow_ai_drift" || currentScenario === "container_escape" || currentScenario === "stateless_multi_label") {
        if (visuals.pod.visible) {
          const podX = visuals.pod.position[0] * spread;
          const podY = visuals.pod.position[1];
          const podZ = visuals.pod.position[2] * spread;
          
          // Track the pod - Increased comfort distance
          targetLookAt.set(podX, podY, podZ);
          targetCamPos.set(podX + 2.5, podY + 2.0, podZ + 6.0);
          
          // If the pod is scanning at the AEGIS gate [0, 0, 0]
          if (visuals.coreAura !== "neutral" && Math.abs(podX) < 0.1) {
            targetCamPos.set(2.5, 2.5, 6.5); 
            targetLookAt.set(0, 0, 0);
          }
        }
      } else if (currentScenario === "multi_tenant_isolation") {
        // Pull back wider on mobile to keep Dyna-Shield and tenant boundaries both visible
        const mobileOffset = layout.isMobile ? 2.5 : 0;
        targetLookAt.set(2 * spread, 0, 0);
        targetCamPos.set((12 + mobileOffset) * spread, 5 + mobileOffset, 3);
      }
    } else if (isTransitioningToCinematic.current) {
      shouldLerp = true;
      if (camera.position.distanceTo(targetCamPos) < 0.1) {
        isTransitioningToCinematic.current = false;
      }
    }

    if (shouldLerp) {
      camera.position.lerp(targetCamPos, 3.5 * delta);
      controls.target.lerp(targetLookAt, 4.0 * delta);
      controls.update();
    }
  });

  return null;
}
