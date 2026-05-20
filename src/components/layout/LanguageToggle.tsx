"use client";

import { useLanguage } from "@/context/LanguageContext";

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      className={`inline-flex rounded-full border border-white/25 bg-slate-900/70 p-0.5 shadow-lg backdrop-blur-md ${
        compact ? "" : ""
      }`}
    >
      {(["en", "tr"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase transition ${
            locale === code ? "bg-white text-slate-900" : "text-slate-300"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
