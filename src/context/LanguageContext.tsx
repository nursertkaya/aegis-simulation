"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Locale = "en" | "tr";

const dictionary = {
  en: {
    tagline: "Adaptive Enterprise Guard & Intelligence System",
    language: "Language",
    scenarios: "Scenarios",
    simulation: "Simulation",
    telemetry: "Telemetry",
    metrics: "Metrics",
    riskScore: "Risk Score",
    currentStep: "Phase",
    camera: "Camera",
    alerts: "Alerts",
    noAlerts: "No active alerts",
    canvasPlaceholder: "3D simulation canvas",
    canvasHint: "Scene rendering will mount here",
    play: "Play",
    pause: "Pause",
    stop: "Stop",
    scan: "Scan",
    reset: "Reset",
    state: "State",
    scenario: "Scenario",
    logs: "Live logs",
    clearLogs: "Clear",
    dismiss: "Dismiss",
    idle: "Idle",
    secureAdmission: "Secure Admission",
    shadowAi: "Shadow AI",
    multiTenant: "Multi-Tenant",
    circuitBreaker: "Circuit Breaker",
    supplyChain: "Supply Chain",
    orbit: "Orbit",
    cinematic: "Cinematic",
    focusAegis: "Focus AEGIS",
    focusPod: "Focus Pod",
    stopped: "Stopped",
    playing: "Playing",
    paused: "Paused",
    scanning: "Scanning",
    completed: "Completed",
    navPlatform: "Platform",
    navStatus: "Status",
    low: "Low",
    elevated: "Elevated",
    critical: "Critical",
    degradedMode: "Degraded mode — cluster availability preserved",
    cpu: "CPU",
    memory: "Memory",
    allowed: "Allowed",
    blocked: "Blocked",
  },
  tr: {
    tagline: "Uyarlanabilir Kurumsal Koruma ve Zeka Sistemi",
    language: "Dil",
    scenarios: "Senaryolar",
    simulation: "Simülasyon",
    telemetry: "Telemetri",
    metrics: "Metrikler",
    riskScore: "Risk Skoru",
    currentStep: "Faz",
    camera: "Kamera",
    alerts: "Uyarılar",
    noAlerts: "Aktif uyarı yok",
    canvasPlaceholder: "3B simülasyon tuvali",
    canvasHint: "Sahne oluşturma buraya bağlanacak",
    play: "Oynat",
    pause: "Duraklat",
    stop: "Durdur",
    scan: "Tara",
    reset: "Sıfırla",
    state: "Durum",
    scenario: "Senaryo",
    logs: "Canlı kayıtlar",
    clearLogs: "Temizle",
    dismiss: "Kapat",
    idle: "Boşta",
    secureAdmission: "Güvenli Kabul",
    shadowAi: "Gölge Yapay Zeka",
    multiTenant: "Çok Kiracılı",
    circuitBreaker: "Devre Kesici",
    supplyChain: "Tedarik Zinciri",
    orbit: "Yörünge",
    cinematic: "Sinematik",
    focusAegis: "AEGIS Odak",
    focusPod: "Pod Odak",
    stopped: "Durduruldu",
    playing: "Oynatılıyor",
    paused: "Duraklatıldı",
    scanning: "Taranıyor",
    completed: "Tamamlandı",
    navPlatform: "Platform",
    navStatus: "Durum",
    low: "Düşük",
    elevated: "Yükselmiş",
    critical: "Kritik",
    degradedMode: "Düşürülmüş mod — küme erişilebilirliği korunuyor",
    cpu: "CPU",
    memory: "Bellek",
    allowed: "İzinli",
    blocked: "Engelli",
  },
} as const;

export type DictionaryKey = keyof (typeof dictionary)["en"];

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: DictionaryKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  const toggleLocale = useCallback(() => {
    setLocale((current) => (current === "en" ? "tr" : "en"));
  }, []);

  const t = useCallback(
    (key: DictionaryKey) => dictionary[locale][key],
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, toggleLocale, t }),
    [locale, toggleLocale, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export function useLocalizedAlertMessage(
  messageEN: string,
  messageTR: string,
): string {
  const { locale } = useLanguage();
  return locale === "tr" ? messageTR : messageEN;
}
