"use client";

import { useState } from "react";
import Header from "./Header";
import { useStore } from "@/lib/store";
import type { TabId } from "@/lib/tabs";
import ImportTab from "./tabs/ImportTab";
import StatoPatrimonialeTab from "./tabs/StatoPatrimonialeTab";
import ContoEconomicoTab from "./tabs/ContoEconomicoTab";
import BepTab from "./tabs/BepTab";
import IndiciTab from "./tabs/IndiciTab";
import RendicontoTab from "./tabs/RendicontoTab";
import ScostamentiTab from "./tabs/ScostamentiTab";
import KpiTab from "./tabs/KpiTab";
import MappaturaTab from "./tabs/MappaturaTab";
import RettificheTab from "./tabs/RettificheTab";
import BusinessPlanTab from "./tabs/BusinessPlanTab";
import RelazioneTab from "./tabs/RelazioneTab";

export default function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>("import");
  const hydrated = useStore((s) => s.hydrated);

  if (!hydrated) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-3 text-sm">
        Caricamento…
      </div>
    );
  }

  return (
    <>
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-[1400px] mx-auto px-6 py-5 w-full flex-1">
        {activeTab === "import" && <ImportTab />}
        {activeTab === "sp" && <StatoPatrimonialeTab />}
        {activeTab === "ce" && <ContoEconomicoTab />}
        {activeTab === "bep" && <BepTab />}
        {activeTab === "idx" && <IndiciTab />}
        {activeTab === "rf" && <RendicontoTab />}
        {activeTab === "scost" && <ScostamentiTab />}
        {activeTab === "kpi" && <KpiTab />}
        {activeTab === "map" && <MappaturaTab />}
        {activeTab === "rett" && <RettificheTab />}
        {activeTab === "bp" && <BusinessPlanTab />}
        {activeTab === "rel" && <RelazioneTab />}

      </main>
      <footer className="max-w-[1400px] mx-auto px-6 py-2.5 text-[11.5px] text-text-3 text-center no-print">
        Analisi di Bilancio — tutti i dati restano nel tuo browser.
      </footer>
    </>
  );
}
