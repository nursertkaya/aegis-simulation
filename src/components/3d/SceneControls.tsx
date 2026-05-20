"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  type CameraMode,
  useSimulationStore,
} from "@/store/simulationStore";
import type { ViewportLayout } from "@/hooks/useViewportLayout";

type SceneControlsProps = {
  layout: ViewportLayout;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
};

const MODE_DAMPING: Record<
  CameraMode,
  { enabled: boolean; rotate: boolean; zoom: boolean; pan: boolean; factor: number }
> = {
  CINEMATIC: { enabled: true, rotate: true, zoom: true, pan: true, factor: 0.05 },
  OVERVIEW: { enabled: true, rotate: true, zoom: true, pan: true, factor: 0.06 },
};

export function SceneControls({ layout, controlsRef }: SceneControlsProps) {
  const activeCameraMode = useSimulationStore((s) => s.activeCameraMode);
  const mode = MODE_DAMPING[activeCameraMode] || MODE_DAMPING.CINEMATIC;
  const internalRef = useRef<OrbitControlsImpl>(null);
  const targetDamping = useRef(mode.factor);

  useEffect(() => {
    targetDamping.current = mode.factor;
    const controls = internalRef.current;
    if (!controls) return;

    controls.enabled = mode.enabled;
    controls.enableRotate = mode.rotate;
    controls.enableZoom = mode.zoom;
    controls.enablePan = mode.pan;
    
    // Safely configure touch behavior using integer mapped fallback if necessary
    // 0 = ROTATE, 1 = PAN, 2 = DOLLY_PAN, 3 = DOLLY
    controls.touches.ONE = 0; 
    controls.touches.TWO = 2; 
  }, [mode]);

  useFrame(() => {
    const controls = internalRef.current;
    if (!controls) return;
    controls.dampingFactor +=
      (targetDamping.current - controls.dampingFactor) * 0.08;
  });

  const maxDistance = layout.isMobile ? 35 : 45;
  const minDistance = layout.isMobile ? 3.5 : 4;

  return (
    <OrbitControls
      ref={(instance) => {
        internalRef.current = instance;
        if (instance) {
          instance.touches.ONE = 0;
          instance.touches.TWO = 2;
        }
        if (controlsRef) {
          (controlsRef as React.MutableRefObject<OrbitControlsImpl | null>).current = instance;
        }
      }}
      makeDefault
      enableDamping
      dampingFactor={mode.factor}
      enabled={mode.enabled}
      enableRotate={mode.rotate}
      enableZoom={mode.zoom}
      enablePan={!layout.isMobile && mode.pan}
      minDistance={minDistance}
      maxDistance={maxDistance}
      maxPolarAngle={Math.PI / 2 - 0.05}
      minPolarAngle={0.0}
      rotateSpeed={layout.isMobile ? 0.6 : 0.8}
      zoomSpeed={layout.isMobile ? 0.5 : 0.8}
      panSpeed={layout.isMobile ? 0.5 : 0.7}
    />
  );
}
