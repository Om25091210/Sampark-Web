"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import JailTab from "./JailTab";
import OverviewTab from "./OverviewTab";
import ProfileTab from "./ProfileTab";
import RegionTab from "./RegionTab";
import ReportingTab from "./ReportingTab";
import SurrenderTab from "./SurrenderTab";
import WorkflowTab from "./WorkflowTab";

const TABS = [
  { key: "overview", label: "अवलोकन" },
  { key: "reporting", label: "रिपोर्टिंग" },
  { key: "region", label: "क्षेत्र और अधिकारी" },
  { key: "profile", label: "कैडर प्रोफ़ाइल" },
  { key: "surrenders", label: "समर्पण रुझान" },
  { key: "jail", label: "जेल/जमानत" },
  { key: "workflow", label: "कार्यप्रवाह" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// The whole view state lives in the URL (?tab=&from=&to=&sd=&thana=&sort=&cat=), so a filtered
// view can be shared or bookmarked and the back button walks through it. Only the active
// tab is mounted, so each tab fetches its own data lazily.
export default function StatsView() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const requested = params.get("tab");
  const tab: TabKey = TABS.find((t) => t.key === requested)?.key ?? "overview";

  const update = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === "") next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  // Filters belong to a tab; carrying one over would apply it to a view that never showed it.
  function selectTab(key: TabKey) {
    router.replace(key === "overview" ? pathname : `${pathname}?tab=${key}`, { scroll: false });
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div className="seg-tabs" role="tablist" aria-label="आंकड़ों के भाग" style={{ maxWidth: 980 }}>
        {TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={t.key === tab} className="seg-tab" data-active={t.key === tab} onClick={() => selectTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "reporting" && <ReportingTab params={params} update={update} />}
      {tab === "region" && <RegionTab params={params} update={update} />}
      {tab === "profile" && <ProfileTab params={params} update={update} />}
      {tab === "surrenders" && <SurrenderTab params={params} update={update} />}
      {tab === "jail" && <JailTab params={params} update={update} />}
      {tab === "workflow" && <WorkflowTab />}
    </div>
  );
}
