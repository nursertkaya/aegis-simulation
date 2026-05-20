"use client";

import { useEffect, useRef } from "react";
import { Activity, Shield, ShieldBan, Clock } from "lucide-react";
import { useSimulationStore } from "@/store/simulationStore";

export function TelemetryPanel() {
  const telemetryLogs = useSimulationStore((s) => s.telemetryLogs);
  const metrics = useSimulationStore((s) => s.metrics);
  const clearTelemetryLogs = useSimulationStore((s) => s.clearLogs);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [telemetryLogs]);

  return (
    <div className="flex h-full flex-col p-6 pointer-events-auto">
      <div className="mb-6 flex items-center justify-between shrink-0">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900">
            <Activity className="h-4 w-4 text-cyan-500" />
            Hubble CNI Telemetry
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            eBPF Data Plane & Audit Stream
          </p>
        </div>
        <button
          onClick={clearTelemetryLogs}
          className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
        >
          CLEAR
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 shrink-0">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-1 flex items-center gap-1.5 text-slate-500">
            <Shield className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Allowed
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900">{metrics.allowed.toString()}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-1 flex items-center gap-1.5 text-slate-500">
            <ShieldBan className="h-3.5 w-3.5 text-red-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Blocked
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900">{metrics.blocked.toString()}</div>
        </div>
        <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-1 flex items-center gap-1.5 text-slate-500">
            <Clock className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Webhook Latency
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-lg font-bold text-slate-900">{metrics.latency}ms</div>
            <div className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              [Cache Hit]
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col rounded-xl border border-slate-200 bg-slate-900 shadow-inner max-h-[250px] md:max-h-[350px]">
        <div className="border-b border-slate-800 bg-slate-950 px-4 py-2 shrink-0 rounded-t-xl">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Audit Stream
          </span>
        </div>
        <div className="overflow-y-auto p-4 custom-scrollbar">
          <div className="flex flex-col gap-2">
            {telemetryLogs.map((log, i) => (
              <div
                key={i}
                className="font-mono text-[11px] leading-relaxed tracking-tight text-slate-300 animate-in slide-in-from-bottom-2 fade-in duration-300"
              >
                {log.startsWith("[APPROVED]") ? (
                  <span className="text-emerald-400 font-bold">{log}</span>
                ) : log.startsWith("[DENIED]") ? (
                  <span className="text-red-400 font-bold">{log}</span>
                ) : log.startsWith("[CRITICAL]") ? (
                  <span className="text-red-500 font-bold">{log}</span>
                ) : log.startsWith("[WARNING]") ? (
                  <span className="text-amber-400">{log}</span>
                ) : log.startsWith("[KERNEL DROP]") ? (
                  <span className="text-orange-500 font-bold">{log}</span>
                ) : (
                  <span className="text-slate-300">{log}</span>
                )}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
