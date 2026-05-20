"use client";

import { Shield } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export function MobileNav() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <header className="flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-md lg:hidden">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
          <Shield className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-slate-900">
            AEGIS
          </p>
          <p className="truncate text-[10px] text-slate-500">{t("tagline")}</p>
        </div>
      </div>
      <div className="inline-flex shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
        {(["en", "tr"] as const).map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase ${
              locale === code
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500"
            }`}
          >
            {code}
          </button>
        ))}
      </div>
    </header>
  );
}
