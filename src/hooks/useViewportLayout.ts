"use client";

import { useEffect, useState } from "react";

export type ViewportLayout = {
  width: number;
  height: number;
  isMobile: boolean;
  isPortrait: boolean;
  nodeSpread: number;
  cameraFov: number;
  maxDpr: number;
};

const MOBILE_MAX_WIDTH = 768;

function readViewport(): ViewportLayout {
  if (typeof window === "undefined") {
    return {
      width: 1280,
      height: 720,
      isMobile: false,
      isPortrait: false,
      nodeSpread: 1,
      cameraFov: 42,
      maxDpr: 2,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const isMobile = width < MOBILE_MAX_WIDTH;
  const isPortrait = height > width;

  const nodeSpread = isMobile ? 0.55 : 1;
  const cameraFov = isMobile ? (isPortrait ? 48 : 44) : 42;
  const maxDpr = isMobile ? 1.35 : 2;

  return {
    width,
    height,
    isMobile,
    isPortrait,
    nodeSpread,
    cameraFov,
    maxDpr,
  };
}

export function useViewportLayout(): ViewportLayout {
  const [layout, setLayout] = useState<ViewportLayout>(readViewport);

  useEffect(() => {
    const onResize = () => setLayout(readViewport());

    onResize();
    window.addEventListener("resize", onResize, { passive: true });
    window.visualViewport?.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, []);

  return layout;
}
