"use client";

import { ClusterScene } from "@/components/3d/ClusterScene";
import { Sidebar } from "@/components/layout/Sidebar";
import { TelemetryPanel } from "@/components/layout/TelemetryPanel";
import { useSimulationStore } from "@/store/simulationStore";
import { useState, useEffect } from "react";
import { BarChart3, X, CheckCircle2, CircleDashed, Maximize2, Minimize2 } from "lucide-react";

function MobilePhaseProgressBar() {
  const currentPhase = useSimulationStore((s) => s.currentPhase);
  
  if (currentPhase === 0) return null;

  const phases = [
    { id: 1, label: "Request" },
    { id: 2, label: "AEGIS Scan" },
    { id: 3, label: "Kernel Check" },
    { id: 4, label: "Deployment" }
  ];

  return (
    <div className="md:hidden fixed top-0 inset-x-0 z-[100] bg-white/95 backdrop-blur-md border-b border-slate-200/50 shadow-sm px-4 py-3">
      <div className="flex items-center justify-between">
        {phases.map((phase, i) => {
          const isActive = currentPhase >= phase.id;
          const isCurrent = currentPhase === phase.id;
          return (
            <div key={phase.id} className="flex flex-col items-center gap-1.5 flex-1 relative">
              {i !== 0 && (
                <div className={`absolute left-0 top-2 -translate-x-1/2 w-full h-[2px] -z-10 ${isActive ? "bg-blue-500" : "bg-slate-200"}`} />
              )}
              <div className="bg-white">
                {isActive ? (
                  <CheckCircle2 className={`w-4 h-4 ${isCurrent ? "text-blue-600 animate-pulse" : "text-blue-500"}`} />
                ) : (
                  <CircleDashed className="w-4 h-4 text-slate-300" />
                )}
              </div>
              <span className={`text-[8px] uppercase tracking-wider font-bold text-center ${isActive ? "text-slate-800" : "text-slate-400"}`}>
                {phase.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WebhookAlert() {
  const alert = useSimulationStore((s) => s.visuals.webhookAlert);
  if (!alert) return <div className="flex-1" />;
  return (
    <div className="flex-1 flex justify-center pointer-events-none mt-20 md:mt-0">
      <div className="bg-red-600/90 backdrop-blur border border-red-500 text-white font-mono font-bold text-sm md:text-lg px-6 py-3 rounded-full shadow-[0_0_40px_-5px_rgba(220,38,38,0.8)] animate-pulse">
        {alert}
      </div>
    </div>
  );
}

function CollapsedHud({ onExpand }: { onExpand: () => void }) {
  const aggregatedRisk = useSimulationStore((s) => s.aggregatedRisk);
  const currentScenario = useSimulationStore((s) => s.currentScenario);
  
  const formatScenario = (s: string) => s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto animate-in slide-in-from-bottom-4 fade-in duration-500">
      <button 
        onClick={onExpand}
        className="flex items-center gap-3 bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-full px-4 py-2.5 transition-transform hover:scale-105 active:scale-95"
      >
        <div className="flex items-center gap-2 border-r border-slate-200 pr-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-800">AEGIS</span>
        </div>
        <div className="flex items-center gap-2 border-r border-slate-200 pr-3 hidden sm:flex">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Scenario</span>
          <span className="text-[11px] font-mono font-bold text-slate-700 truncate max-w-[140px]">{formatScenario(currentScenario)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold hidden sm:block">Risk</span>
          <span className={`text-[13px] font-mono font-bold ${aggregatedRisk > 80 ? 'text-red-600' : aggregatedRisk > 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {Math.round(aggregatedRisk)}
          </span>
        </div>
        <div className="pl-2 border-l border-slate-200 text-blue-600 ml-1">
          <Maximize2 className="w-4 h-4" />
        </div>
      </button>
    </div>
  );
}

function PremiumTelemetryOverlay() {
  const aggregatedRisk = useSimulationStore((s) => s.aggregatedRisk);
  const visuals = useSimulationStore((s) => s.visuals);
  const simulationState = useSimulationStore((s) => s.simulationState);
  const currentScenario = useSimulationStore((s) => s.currentScenario);
  const metrics = useSimulationStore((s) => s.metrics);

  const isScanning = simulationState === "SCANNING";
  const isNetworkScenario = currentScenario === "multi_tenant_isolation";
  const isValidationScenario = currentScenario !== "multi_tenant_isolation";

  const riskColor = aggregatedRisk > 80 ? 'text-red-600' : aggregatedRisk > 50 ? 'text-amber-600' : 'text-emerald-600';
  const riskDot = aggregatedRisk > 80 ? 'bg-red-500' : aggregatedRisk > 50 ? 'bg-amber-500' : 'bg-emerald-500';
  const webhookActive = visuals.coreAura !== "neutral" && visuals.coreAura !== "success";

  return (
    <div className={`absolute top-4 inset-x-0 z-40 flex gap-2 px-4 md:justify-center pointer-events-none transition-all duration-700 ${isScanning ? 'opacity-25' : 'opacity-100'}`}>

      {/* AEGIS Engine — validation scenarios only */}
      {isValidationScenario && (
        <div className="flex items-center gap-2.5 bg-white/75 backdrop-blur-md border border-slate-200/50 rounded-full px-3 py-1.5 shadow-sm">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${webhookActive ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`} />
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Webhook</span>
          <span className={`text-[10px] font-mono font-bold ${webhookActive ? 'text-blue-600' : 'text-slate-500'}`}>
            {webhookActive ? 'ACTIVE' : 'STANDBY'}
          </span>
          <span className="text-slate-200">|</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Latency</span>
          <span className="text-[10px] font-mono font-bold text-slate-700">{metrics.latency}ms</span>
        </div>
      )}

      {/* Risk — validation scenarios only */}
      {isValidationScenario && (
        <div className="flex items-center gap-2.5 bg-white/75 backdrop-blur-md border border-slate-200/50 rounded-full px-3 py-1.5 shadow-sm">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${riskDot}`} />
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Risk</span>
          <span className={`text-[11px] font-mono font-bold ${riskColor}`}>{Math.round(aggregatedRisk)}</span>
          <span className="text-slate-200">|</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Policy</span>
          <span className="text-[10px] font-mono font-bold text-slate-700">
            {simulationState === "SCANNING" ? "EVAL…" : simulationState === "PLAYING" ? "ENFORCING" : "IDLE"}
          </span>
        </div>
      )}

      {/* Network Context — network scenario only */}
      {isNetworkScenario && (
        <div className="flex items-center gap-2.5 bg-white/75 backdrop-blur-md border border-slate-200/50 rounded-full px-3 py-1.5 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Flow</span>
          <span className={`text-[10px] font-mono font-bold ${visuals.networkLineActive ? 'text-cyan-600' : 'text-slate-500'}`}>
            {visuals.networkLineActive ? 'TCP ESTAB' : 'NO FLOW'}
          </span>
          <span className="text-slate-200">|</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Isolation</span>
          <span className={`text-[10px] font-mono font-bold ${visuals.isolationBarrier.shieldWall ? 'text-amber-600' : visuals.isolationBarrier.active ? 'text-cyan-600' : 'text-slate-500'}`}>
            {visuals.isolationBarrier.shieldWall ? 'SHIELD' : visuals.isolationBarrier.active ? 'ENFORCED' : 'OPEN'}
          </span>
        </div>
      )}

    </div>
  );
}

export default function Home() {
  const currentScenario = useSimulationStore((s) => s.currentScenario);
  const startSimulation = useSimulationStore((s) => s.startSimulation);
  const stopSimulation = useSimulationStore((s) => s.stopSimulation);
  const setScenario = useSimulationStore((s) => s.setScenario);
  const activeCameraMode = useSimulationStore((s) => s.activeCameraMode);
  const setCameraMode = useSimulationStore((s) => s.setCameraMode);

  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isHudExpanded, setIsHudExpanded] = useState(true);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsHudExpanded(false);
    }
  }, []);

  const handleScenarioClick = (id: "secure_admission" | "shadow_ai_drift" | "stateless_multi_label" | "container_escape" | "multi_tenant_isolation" | "critical_reset") => {
    stopSimulation();
    setScenario(id);
    startSimulation();
  };

  const isNetworkScenario = currentScenario === "multi_tenant_isolation";
  const isValidationScenario = currentScenario !== "multi_tenant_isolation";
  const isScanning = useSimulationStore((s) => s.simulationState) === "SCANNING";

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-white selection:bg-slate-200">
      <div className="absolute inset-0 z-0">
        <ClusterScene />
      </div>

      {!isHudExpanded && <CollapsedHud onExpand={() => setIsHudExpanded(true)} />}

      <div className={`absolute inset-0 z-40 transition-all duration-700 ease-in-out ${isHudExpanded ? 'opacity-100 pointer-events-none' : 'opacity-0 pointer-events-none [&_*]:!pointer-events-none translate-y-8'}`}>


        <div className="absolute inset-x-0 top-0 z-50 flex pointer-events-none p-4 md:p-6 items-start justify-between">
          <aside className={`pointer-events-auto hidden md:block w-80 transition-all duration-700 ${!isValidationScenario ? 'opacity-0 -translate-x-4 pointer-events-none absolute' : isScanning ? 'opacity-100 scale-105' : 'opacity-80 hover:opacity-100'}`}>
            <Sidebar />
          </aside>

          <WebhookAlert />

          <aside className={`pointer-events-auto hidden md:block w-[360px] transition-all duration-700 ${!isNetworkScenario ? 'opacity-0 translate-x-4 pointer-events-none absolute right-6' : isScanning ? 'opacity-100 scale-105 right-6 absolute' : 'opacity-80 hover:opacity-100 absolute right-6'}`}>
            <TelemetryPanel />
          </aside>
        </div>

        <PremiumTelemetryOverlay />

        {!isMobileSheetOpen && (
          <div className="md:hidden fixed top-16 right-4 z-50 pointer-events-auto">
            <button 
              onClick={() => setIsMobileSheetOpen(true)}
              className="flex items-center gap-2 bg-white/90 backdrop-blur border border-slate-200 shadow-lg px-4 py-2 rounded-full text-xs font-bold text-slate-700"
            >
              <BarChart3 className="w-4 h-4 text-blue-600" />
              View Telemetry
            </button>
          </div>
        )}

        <div className="pointer-events-auto fixed bottom-6 left-0 right-0 z-50 flex flex-col items-center gap-3 px-4">
          
          <div className="w-full flex justify-between md:justify-center items-end px-2 max-w-5xl pointer-events-none">
            <div className="flex-1 hidden md:block" />
            
            <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 p-1 shadow-sm backdrop-blur-md pointer-events-auto">
              <button
                onClick={() => setCameraMode("CINEMATIC")}
                className={`rounded-full px-4 py-1.5 text-[11px] font-semibold transition ${
                  activeCameraMode === "CINEMATIC" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                🎥 Cinematic Tracking
              </button>
              <button
                onClick={() => setCameraMode("OVERVIEW")}
                className={`rounded-full px-4 py-1.5 text-[11px] font-semibold transition ${
                  activeCameraMode === "OVERVIEW" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                🛰️ System Map Overview
              </button>
            </div>

            <div className="flex-1 flex justify-end pointer-events-auto">
              <button onClick={() => setIsHudExpanded(false)} className="flex items-center gap-1.5 bg-white/90 backdrop-blur border border-slate-200 shadow-md rounded-full px-4 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                <Minimize2 className="w-4 h-4" /> <span className="hidden md:inline">Minimize HUD</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 rounded-3xl border border-slate-200/60 bg-white/80 p-2 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] backdrop-blur-xl w-full md:w-auto md:max-w-fit">
            <button
              onClick={() => handleScenarioClick("secure_admission")}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                currentScenario === "secure_admission" ? "bg-cyan-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Scenario 1
            </button>
            <button
              onClick={() => handleScenarioClick("shadow_ai_drift")}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                currentScenario === "shadow_ai_drift" ? "bg-red-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Scenario 2
            </button>
            <button
              onClick={() => handleScenarioClick("stateless_multi_label")}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                currentScenario === "stateless_multi_label" ? "bg-purple-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Scenario 3
            </button>
            <button
              onClick={() => handleScenarioClick("container_escape")}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                currentScenario === "container_escape" ? "bg-orange-500 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Scenario 4
            </button>
            <button
              onClick={() => handleScenarioClick("multi_tenant_isolation")}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                currentScenario === "multi_tenant_isolation" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Scenario 5
            </button>
            
            <div className="mx-1 h-5 w-px bg-slate-300" />
            
            <button
              onClick={() => handleScenarioClick("critical_reset")}
              className="rounded-full px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              Reset Array
            </button>
          </div>
        </div>
      </div>

    <div className={`md:hidden fixed inset-x-0 bottom-0 z-[60] bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-2xl transition-transform duration-300 rounded-t-3xl ${isMobileSheetOpen ? "translate-y-0" : "translate-y-full"}`}>
        <div className="p-4 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-2 shrink-0">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-600" />
              {isValidationScenario ? "Telemetry & Rules" : "Hubble Network Telemetry"}
            </h3>
            <button onClick={() => setIsMobileSheetOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-600 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
          {isValidationScenario && <Sidebar />}
          {isNetworkScenario && <TelemetryPanel />}
        </div>
      </div>

    </main>
  );
}
