"use client";

import { useSimulationStore, type RuleState } from "@/store/simulationStore";
import { ShieldCheck, ShieldAlert, Loader2, Shield } from "lucide-react";

function RuleItem({
  id,
  title,
  state,
}: {
  id: string;
  title: string;
  state: RuleState;
}) {
  return (
    <div className={`relative flex items-start gap-3 rounded-xl border p-3 transition-colors duration-300 ${
      state === "passed" ? "border-emerald-200 bg-emerald-50/50" : 
      state === "failed" ? "border-red-200 bg-red-50/50" : 
      state === "spinning" ? "border-blue-200 bg-blue-50/30" : 
      "border-slate-100 bg-slate-50/50"
    }`}>
      <div className="mt-0.5 flex-shrink-0">
        {state === "idle" && <Shield className="h-4 w-4 text-slate-400" />}
        {state === "spinning" && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
        {state === "passed" && <ShieldCheck className="h-4 w-4 text-emerald-500" />}
        {state === "failed" && <ShieldAlert className="h-4 w-4 text-red-500" />}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className={`text-[10px] font-bold tracking-wider uppercase ${
          state === "passed" ? "text-emerald-700" : 
          state === "failed" ? "text-red-700" : 
          state === "spinning" ? "text-blue-700" : 
          "text-slate-500"
        }`}>
          {id}
        </span>
        <span className="text-xs font-medium leading-snug text-slate-700">
          {title}
        </span>
      </div>
    </div>
  );
}

export function Sidebar() {
  const baselines = useSimulationStore((s) => s.baselines);
  const aggregatedRisk = useSimulationStore((s) => s.aggregatedRisk);

  // Dynamic fluid HSL color interpolation for the risk bar
  // Risk 0 = 130 hue (Green), Risk 100 = 0 hue (Red)
  const hue = 130 - (aggregatedRisk / 100) * 130;
  const barColor = `hsl(${hue}, 85%, 50%)`;

  return (
    <div className="flex h-full flex-col p-6 pointer-events-auto">
      <div className="mb-6 flex items-center justify-between border-b border-slate-200/50 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
            <ShieldAlert className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-slate-900">
              AEGIS Platform
            </h1>
            <p className="text-[11px] font-medium text-slate-500">
              v2.5.0 • Zero Trust Engine
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <RuleItem
          id="AE-01 (NIST SP 800-190)"
          title="Root Execution Prohibition"
          state={baselines.ae01}
        />
        <RuleItem
          id="AE-02 (NIST SP 800-190)"
          title="Immutable RootFS Check"
          state={baselines.ae02}
        />
        <RuleItem
          id="AE-03 (MITRE ATT&CK T1611)"
          title="Host Filesystem Mounts"
          state={baselines.ae03}
        />
        <RuleItem
          id="AE-04 (MITRE ATT&CK T1036)"
          title="Identity Masquerading"
          state={baselines.ae04}
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
