"use client";

import { PanelLeft, PanelRight, X } from "lucide-react";
import type { ReactNode } from "react";

type MobileDrawerProps = {
  side: "left" | "right";
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export function MobileDrawer({
  side,
  open,
  onClose,
  title,
  children,
}: MobileDrawerProps) {
  const slide =
    side === "left"
      ? open
        ? "translate-x-0"
        : "-translate-x-full"
      : open
        ? "translate-x-0"
        : "translate-x-full";

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close panel"
          className="pointer-events-auto fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px] md:hidden"
          onClick={onClose}
        />
      ) : null}
      <aside
        className={`pointer-events-auto fixed top-0 z-50 flex h-dvh w-[min(100%,20rem)] flex-col border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-out md:hidden ${
          side === "left" ? "left-0 border-r" : "right-0 border-l"
        } ${slide}`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </aside>
    </>
  );
}

export function MobileDrawerToggle({
  side,
  onClick,
  label,
}: {
  side: "left" | "right";
  onClick: () => void;
  label: string;
}) {
  const Icon = side === "left" ? PanelLeft : PanelRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-slate-900/75 text-white shadow-lg backdrop-blur-md transition hover:bg-slate-800"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
