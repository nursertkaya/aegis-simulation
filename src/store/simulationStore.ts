import { create } from "zustand";

export type Scenario =
  | "IDLE"
  | "secure_admission"
  | "shadow_ai_drift"
  | "stateless_multi_label"
  | "container_escape"
  | "multi_tenant_isolation"
  | "critical_reset";

export type SimulationState =
  | "STOPPED"
  | "PLAYING"
  | "PAUSED"
  | "SCANNING"
  | "COMPLETED";

export type CameraMode = "CINEMATIC" | "OVERVIEW";

export type CoreAura = "neutral" | "scan" | "amber" | "orange" | "red" | "purple" | "success";

export type RuleState = "idle" | "spinning" | "passed" | "failed";

export interface SecurityBaselines {
  ae01: RuleState;
  ae02: RuleState;
  ae03: RuleState;
  ae04: RuleState;
}

export interface SimulationVisuals {
  coreAura: CoreAura;
  coreScanIntensity: number;
  pod: {
    visible: boolean;
    type: "compliant" | "shadow" | "escape" | "tenant" | "multivector";
    position: [number, number, number];
    quarantined: boolean;
    blockedAtGateway: boolean;
    animation: "none" | "lunge";
    badgeText: string[];
    badgeColor: string;
  };
  networkLineActive: boolean;
  isolationBarrier: {
    active: boolean;
    flashing: boolean;
    shieldWall: boolean;
  };
  dataParticles: {
    active: boolean;
    impact: boolean;
  };
  webhookAlert: string | null;
  ciliumAlertActive: boolean;
}

const DEFAULT_VISUALS: SimulationVisuals = {
  coreAura: "neutral",
  coreScanIntensity: 0,
  pod: {
    visible: false,
    type: "compliant",
    position: [-6, 0, 0],
    quarantined: false,
    blockedAtGateway: false,
    animation: "none",
    badgeText: [],
    badgeColor: "#ffffff",
  },
  networkLineActive: false,
  isolationBarrier: { active: false, flashing: false, shieldWall: false },
  dataParticles: { active: false, impact: false },
  webhookAlert: null,
  ciliumAlertActive: false,
};

const DEFAULT_BASELINES: SecurityBaselines = {
  ae01: "idle",
  ae02: "idle",
  ae03: "idle",
  ae04: "idle",
};

interface SimulationStoreState {
  currentScenario: Scenario;
  simulationState: SimulationState;
  currentPhase: number;
  aggregatedRisk: number;
  telemetryLogs: string[];
  activeCameraMode: CameraMode;
  visuals: SimulationVisuals;
  baselines: SecurityBaselines;
  metrics: { cpu: number; memory: number; allowed: number; blocked: number; latency: number };
  runToken: number;
}

interface SimulationStoreActions {
  setScenario: (scenario: Scenario) => void;
  startSimulation: () => void;
  stopSimulation: () => void;
  reset: () => void;
  setCameraMode: (mode: CameraMode) => void;
  addLog: (log: string) => void;
  setVisuals: (patch: Partial<SimulationVisuals>) => void;
  setBaselines: (patch: Partial<SecurityBaselines>) => void;
  setPodPosition: (pos: [number, number, number]) => void;
  animateAggregatedRisk: (target: number, durationMs?: number) => void;
  runActiveScenario: () => Promise<void>;
  clearLogs: () => void;
  incrementMetric: (key: "allowed" | "blocked") => void;
}

const INITIAL_STATE: SimulationStoreState = {
  currentScenario: "IDLE",
  simulationState: "STOPPED",
  currentPhase: 0,
  aggregatedRisk: 10,
  telemetryLogs: [
    "[SYS] AEGIS control plane initialized",
    "[SYS] Awaiting scenario orchestration",
  ],
  activeCameraMode: "CINEMATIC",
  visuals: DEFAULT_VISUALS,
  baselines: DEFAULT_BASELINES,
  metrics: { cpu: 24, memory: 38, allowed: 1284, blocked: 12, latency: 4.2 },
  runToken: 0,
};

const clampRisk = (value: number) => Math.min(100, Math.max(0, value));

export const useSimulationStore = create<SimulationStoreState & SimulationStoreActions>((set, get) => ({
  ...INITIAL_STATE,

  setScenario: (scenario) => {
    if (scenario === "critical_reset") {
      set({ 
        ...INITIAL_STATE, 
        currentScenario: "IDLE",
        runToken: get().runToken + 1, 
        telemetryLogs: ["[SYS] Critical cluster reset executed. Risk mitigated to baseline 10%."] 
      });
      get().animateAggregatedRisk(10, 1000);
    } else {
      set({
        currentScenario: scenario,
        simulationState: "STOPPED",
        currentPhase: 0,
        visuals: DEFAULT_VISUALS,
        baselines: DEFAULT_BASELINES,
      });
    }
  },

  startSimulation: () => {
    const { currentScenario, runToken } = get();
    if (currentScenario === "IDLE" || currentScenario === "critical_reset") return;
    set({
      simulationState: "PLAYING",
      currentPhase: 1,
      aggregatedRisk: 10, // EVERY-SCENARIO RISK RESET
      visuals: DEFAULT_VISUALS,
      baselines: { ae01: "spinning", ae02: "spinning", ae03: "spinning", ae04: "spinning" },
      runToken: runToken + 1,
    });
    get().runActiveScenario();
  },

  stopSimulation: () => {
    set({
      simulationState: "STOPPED",
      currentPhase: 0,
      visuals: DEFAULT_VISUALS,
      baselines: DEFAULT_BASELINES,
      runToken: get().runToken + 1,
    });
  },

  reset: () => set({ ...INITIAL_STATE, runToken: get().runToken + 1 }),

  setCameraMode: (activeCameraMode) => set({ activeCameraMode }),

  addLog: (line) =>
    set((state) => ({
      telemetryLogs: [...state.telemetryLogs.slice(-49), line],
    })),

  clearLogs: () => set({ telemetryLogs: [] }),

  setVisuals: (patch) =>
    set((state) => ({ visuals: { ...state.visuals, ...patch } })),
    
  setBaselines: (patch) =>
    set((state) => ({ baselines: { ...state.baselines, ...patch } })),

  setPodPosition: (pos) =>
    set((state) => ({
      visuals: { ...state.visuals, pod: { ...state.visuals.pod, position: pos } },
    })),

  animateAggregatedRisk: (target, durationMs = 1500) => {
    const start = get().aggregatedRisk;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      set({ aggregatedRisk: clampRisk(start + (target - start) * progress) });
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },
  
  incrementMetric: (key) => 
    set((state) => ({ metrics: { ...state.metrics, [key]: state.metrics[key] + 1 } })),

  runActiveScenario: async () => {
    const { currentScenario, addLog, setVisuals, setBaselines, animateAggregatedRisk, incrementMetric, runToken } = get();
    const currentToken = runToken;
    const checkCancel = () => get().runToken !== currentToken;

    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // Common spawn logic
    const spawnAndMoveToCore = async () => {
      const steps = 60;
      // Start at outside [-6, 0, 0], move through API Server [-2.5, 0, 0] up to AEGIS Core [0, 0, 0]
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        get().setPodPosition([-6 + (6.0 * t), 0, 0]);
        await wait(25); if (checkCancel()) throw new Error("cancelled");
      }
    };

    try {
      if (currentScenario === "secure_admission") {
        setVisuals({ pod: { visible: true, type: "compliant", position: [-6, 0, 0], quarantined: false, blockedAtGateway: false, animation: "none", badgeText: ["ID: nginx-prod | Role: web"], badgeColor: "#06b6d4" } });
        await wait(500); if (checkCancel()) return;
        
        await spawnAndMoveToCore();
        
        set({ currentPhase: 2 });
        setVisuals({ coreAura: "scan", coreScanIntensity: 1 });
        set({ simulationState: "SCANNING" });
        
        addLog("[INFO] NIST SP-800-190 compliance checks initiated.");
        await wait(1500); if (checkCancel()) return;
        setBaselines({ ae01: "passed", ae02: "passed" });
        
        addLog("[INFO] Evaluating Pod Security Standards (PSS) boundaries.");
        await wait(1500); if (checkCancel()) return;
        
        set({ currentPhase: 3 });
        addLog("[INFO] Network Isolation checks passed.");
        setBaselines({ ae03: "passed", ae04: "passed" });
        
        animateAggregatedRisk(18, 1500); // Ticks to 18%
        setVisuals({ coreAura: "success", coreScanIntensity: 0 });
        addLog("[APPROVED] Webhook executed safely. Cache hit successful.");
        
        incrementMetric("allowed");
        await wait(800); if (checkCancel()) return;
        
        set({ simulationState: "PLAYING", currentPhase: 4 });
        
        // Move from [0, 0, 0] into Tenant-Alpha [+4.5, 0, -1.2]
        const finalSteps = 60;
        for (let i = 0; i <= finalSteps; i++) {
          const t = i / finalSteps;
          get().setPodPosition([0 + (4.5 * t), 0, -1.2 * t]);
          await wait(25); if (checkCancel()) return;
        }
        
        setVisuals({ networkLineActive: true, ciliumAlertActive: true });
        addLog("[SYS] Network Secured: Cilium eBPF Policy Enforced");
        await wait(2500); if (checkCancel()) return;
        setVisuals({ ciliumAlertActive: false });
        set({ simulationState: "COMPLETED" });
      }
      
      else if (currentScenario === "shadow_ai_drift") {
        setVisuals({ pod: { visible: true, type: "shadow", position: [-6, 0, 0], quarantined: false, blockedAtGateway: false, animation: "none", badgeText: ["Label: tier=frontend"], badgeColor: "#ef4444" } });
        await wait(500); if (checkCancel()) return;
        
        await spawnAndMoveToCore();
        
        set({ currentPhase: 2 });
        setVisuals({ coreAura: "scan", coreScanIntensity: 1 });
        set({ simulationState: "SCANNING" });
        
        addLog("[WARNING] Identity verification started.");
        await wait(1500); if (checkCancel()) return;
        
        setVisuals({ pod: { visible: true, type: "shadow", position: [0, 0, 0], quarantined: false, blockedAtGateway: false, animation: "none", badgeText: ["REAL: runAsUser: 0 (ROOT DRIFT)"], badgeColor: "#ef4444" } });
        setBaselines({ ae04: "failed" });
        addLog("[CRITICAL] Metadata masquerading detected. Fraudulent label context blocked.");
        await wait(1500); if (checkCancel()) return;
        
        set({ currentPhase: 3 });
        setBaselines({ ae02: "passed", ae03: "passed" });
        addLog("[CRITICAL] Non-human identity privilege escalation context mapped.");
        await wait(1500); if (checkCancel()) return;
        
        setBaselines({ ae01: "failed" });
        
        animateAggregatedRisk(40, 1500); // Ticks to 40%
        
        await wait(1500); if (checkCancel()) return;
        
        setVisuals({ webhookAlert: "IDENTITY DRIFT FAULT" });
        incrementMetric("blocked");
        
        await wait(600); if (checkCancel()) return;
        
        addLog("[DENIED] Admission rejected. Identity masking detected. Workload paralyzed at Gateway.");
        set({ simulationState: "PLAYING" });
        
        setVisuals({ pod: { visible: true, type: "shadow", position: [0, 0, 0], quarantined: false, blockedAtGateway: true, animation: "none", badgeText: ["REAL: runAsUser: 0 (ROOT DRIFT)"], badgeColor: "#ef4444" }, coreAura: "red", coreScanIntensity: 0 });
        await wait(2000); if (checkCancel()) return;
        set({ simulationState: "COMPLETED" });
      }

      else if (currentScenario === "stateless_multi_label") {
        setVisuals({ pod: { visible: true, type: "multivector", position: [-6, 0, 0], quarantined: false, blockedAtGateway: false, animation: "none", badgeText: ["[Label: app=frontend]", "[Label: env=prod]", "[Label: security=high]"], badgeColor: "#a855f7" } });
        await wait(500); if (checkCancel()) return;
        
        await spawnAndMoveToCore();
        
        set({ currentPhase: 2 });
        setVisuals({ coreAura: "scan", coreScanIntensity: 1 });
        set({ simulationState: "SCANNING" });
        
        addLog("[WARNING] Stateless multi-vector verification started.");
        await wait(2000); if (checkCancel()) return;
        
        setVisuals({ 
          coreAura: "red", 
          coreScanIntensity: 2,
          pod: { visible: true, type: "multivector", position: [0, 0, 0], quarantined: false, blockedAtGateway: false, animation: "none", badgeText: ["[FAIL: runAsUser=0]", "[FAIL: hostPath Mount]", "[FAIL: Privilege Escalation]"], badgeColor: "#a855f7" }
        });
        setBaselines({ ae01: "failed", ae03: "failed", ae04: "failed", ae02: "passed" });
        addLog("[CRITICAL] Compound stateless manifest violation stack detected.");
        await wait(1500); if (checkCancel()) return;
        
        set({ currentPhase: 3 });
        
        animateAggregatedRisk(85, 1500); // Ticks to 85%
        
        await wait(1500); if (checkCancel()) return;
        
        setVisuals({ webhookAlert: "MULTI-VECTOR HEURISTIC BLOCK" });
        incrementMetric("blocked");
        
        await wait(600); if (checkCancel()) return;
        
        addLog("[DENIED] Admission strictly denied. Workload pinned permanently under heavy purple shield.");
        set({ simulationState: "PLAYING" });
        
        setVisuals({ pod: { visible: true, type: "multivector", position: [0, 0, 0], quarantined: false, blockedAtGateway: true, animation: "none", badgeText: ["[FAIL: runAsUser=0]", "[FAIL: hostPath Mount]", "[FAIL: Privilege Escalation]"], badgeColor: "#a855f7" }, coreAura: "red", coreScanIntensity: 0 });
        await wait(2000); if (checkCancel()) return;
        set({ simulationState: "COMPLETED" });
      }
      
      else if (currentScenario === "container_escape") {
        setVisuals({ pod: { visible: true, type: "escape", position: [-6, 0, 0], quarantined: false, blockedAtGateway: false, animation: "none", badgeText: ["Exploit: SYS_ADMIN"], badgeColor: "#f97316" } });
        await wait(500); if (checkCancel()) return;
        
        await spawnAndMoveToCore();
        
        set({ currentPhase: 2 });
        setVisuals({ coreAura: "scan", coreScanIntensity: 1 });
        set({ simulationState: "SCANNING" });
        
        addLog("[WARNING] Inspecting volume mounts and kernel capabilities.");
        await wait(1500); if (checkCancel()) return;
        
        setBaselines({ ae02: "failed" });
        addLog("[CRITICAL] MITRE ATT&CK T1611: HostPath volume requested across boundaries.");
        await wait(1500); if (checkCancel()) return;
        
        set({ currentPhase: 3 });
        setBaselines({ ae03: "failed" });
        addLog("[CRITICAL] Dangerous SYS_ADMIN kernel capabilities detected.");
        await wait(1500); if (checkCancel()) return;
        
        setBaselines({ ae01: "passed", ae04: "passed" });
        
        animateAggregatedRisk(75, 1500); // Ticks to 75%
        
        await wait(1500); if (checkCancel()) return;
        
        setVisuals({ webhookAlert: "MITRE ATT&CK T1611 VIOLATION PREVENTED" });
        incrementMetric("blocked");
        
        await wait(600); if (checkCancel()) return;
        
        addLog("[DENIED] Admission rejected. Container escape vectors blocked. Workload paralyzed at Gateway.");
        set({ simulationState: "PLAYING" });
        
        setVisuals({ pod: { visible: true, type: "escape", position: [0, 0, 0], quarantined: false, blockedAtGateway: true, animation: "none", badgeText: ["MITRE T1611 VIOLATION"], badgeColor: "#f97316" }, coreAura: "red", coreScanIntensity: 0 });
        await wait(2000); if (checkCancel()) return;
        set({ simulationState: "COMPLETED" });
      }
      
      else if (currentScenario === "multi_tenant_isolation") {
        setBaselines({ ae01: "passed", ae02: "passed", ae03: "passed", ae04: "passed" });
        set({ currentPhase: 3 });
        setVisuals({ isolationBarrier: { active: true, flashing: false, shieldWall: false } });
        await wait(800); if (checkCancel()) return;
        
        setVisuals({ pod: { visible: true, type: "tenant", position: [4.5, 0, -1.2], quarantined: false, blockedAtGateway: false, animation: "none", badgeText: ["Namespace: Tenant-Alpha (Prod)"], badgeColor: "#3b82f6" } });
        await wait(800); if (checkCancel()) return;
        
        set({ currentPhase: 4 });
        setVisuals({ dataParticles: { active: true, impact: false } });
        
        // Lunging triggers
        setVisuals({ 
          pod: { visible: true, type: "tenant", position: [4.5, 0, -1.2], quarantined: false, blockedAtGateway: false, animation: "lunge", badgeText: ["Namespace: Tenant-Alpha (Prod)"], badgeColor: "#3b82f6" },
          isolationBarrier: { active: true, flashing: true, shieldWall: true },
          dataParticles: { active: true, impact: true },
          ciliumAlertActive: true
        });
        addLog("[KERNEL DROP] Aggressive Cross-tenant lateral movement detected.");
        
        animateAggregatedRisk(90, 800); // Spike to 90%
        await wait(1500); if (checkCancel()) return;
        
        addLog("[SYS] Network Secured: Cilium eBPF Policy Enforced");
        
        animateAggregatedRisk(80, 1500); // Mitigate to 80%
        await wait(2000); if (checkCancel()) return;
        
        setVisuals({ 
          pod: { visible: true, type: "tenant", position: [4.5, 0, -1.2], quarantined: false, blockedAtGateway: false, animation: "none", badgeText: ["Namespace: Tenant-Alpha (Prod)"], badgeColor: "#3b82f6" },
          isolationBarrier: { active: true, flashing: false, shieldWall: false }, 
          ciliumAlertActive: false 
        });
        await wait(1000); if (checkCancel()) return;
        set({ simulationState: "COMPLETED" });
      }

    } catch (e) {
      if ((e as Error).message === "cancelled") return;
      throw e;
    }
  }
}));
