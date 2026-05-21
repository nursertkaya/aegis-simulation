"use client";

import { useSimulationStore, type RuleState } from "@/store/simulationStore";
import { ShieldCheck, ShieldAlert, Loader2, Shield } from "lucide-react";

function RuleItem({
  id,
  title,
  state,
  isExpanded,
  onToggle,
}: {
  id: string;
  title: string;
  state: RuleState;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div 
      onClick={onToggle}
      className={`relative flex flex-col gap-2 rounded-lg border p-2.5 transition-all duration-300 cursor-pointer hover:shadow-sm ${
      state === "passed" ? "border-emerald-200 bg-emerald-50/50" : 
      state === "failed" ? "border-red-200 bg-red-50/50" : 
      state === "spinning" ? "border-blue-200 bg-blue-50/30" : 
      "border-slate-100 bg-slate-50/50"
    }`}>
      <div className="flex items-center gap-2.5">
        <div className="flex-shrink-0">
          {state === "idle" && <Shield className="h-3.5 w-3.5 text-slate-400" />}
          {state === "spinning" && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />}
          {state === "passed" && <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />}
          {state === "failed" && <ShieldAlert className="h-3.5 w-3.5 text-red-500" />}
        </div>
        <div className="flex flex-col">
          <span className={`text-[9px] font-bold tracking-wider uppercase ${
            state === "passed" ? "text-emerald-700" : 
            state === "failed" ? "text-red-700" : 
            state === "spinning" ? "text-blue-700" : 
            "text-slate-500"
          }`}>
            {id}
          </span>
          {isExpanded && (
            <span className="text-[11px] font-medium leading-snug text-slate-700 mt-0.5 animate-in fade-in slide-in-from-top-1">
              {title}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";

export function Sidebar() {
  const baselines = useSimulationStore((s) => s.baselines);
  const aggregatedRisk = useSimulationStore((s) => s.aggregatedRisk);
  
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Auto-expand the currently active or failing rule
  useEffect(() => {
    if (baselines.ae04 === "spinning" || baselines.ae04 === "failed") setExpandedId("ae04");
    else if (baselines.ae03 === "spinning" || baselines.ae03 === "failed") setExpandedId("ae03");
    else if (baselines.ae02 === "spinning" || baselines.ae02 === "failed") setExpandedId("ae02");
    else if (baselines.ae01 === "spinning" || baselines.ae01 === "failed") setExpandedId("ae01");
    else setExpandedId(null);
  }, [baselines]);

  // Dynamic fluid HSL color interpolation for the risk bar
  // Risk 0 = 130 hue (Green), Risk 100 = 0 hue (Red)
  const hue = 130 - (aggregatedRisk / 100) * 130;
  const barColor = `hsl(${hue}, 85%, 50%)`;

  return (
    <div className="flex h-full flex-col p-4 pointer-events-auto">
      <div className="mb-4 flex items-center gap-2.5 border-b border-slate-200/50 pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20">
          <ShieldAlert className="h-4 w-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-slate-900">AEGIS Platform</h1>
          <p className="text-[10px] font-medium text-slate-400">Zero Trust Engine</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <RuleItem
          id="AE-01"
          title="Root Execution Prohibition"
          state={baselines.ae01}
          isExpanded={expandedId === "ae01"}
          onToggle={() => setExpandedId(expandedId === "ae01" ? null : "ae01")}
        />
        <RuleItem
          id="AE-02"
          title="Immutable RootFS Check"
          state={baselines.ae02}
          isExpanded={expandedId === "ae02"}
          onToggle={() => setExpandedId(expandedId === "ae02" ? null : "ae02")}
        />
        <RuleItem
          id="AE-03"
          title="Host Filesystem Mounts"
          state={baselines.ae03}
          isExpanded={expandedId === "ae03"}
          onToggle={() => setExpandedId(expandedId === "ae03" ? null : "ae03")}
        />
        <RuleItem
          id="AE-04"
          title="Identity Masquerading"
          state={baselines.ae04}
          isExpanded={expandedId === "ae04"}
          onToggle={() => setExpandedId(expandedId === "ae04" ? null : "ae04")}
        />
      </div>

      <div className="mt-auto pt-6">
        <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100/50 p-4 shadow-sm ring-1 ring-inset ring-slate-200/50">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Aggregated Risk Index
            </span>
            <span className="text-xs font-bold" style={{ color: barColor }}>
              {Math.round(aggregatedRisk)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full transition-all duration-75 ease-linear"
              style={{ width: `${aggregatedRisk}%`, backgroundColor: barColor }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
