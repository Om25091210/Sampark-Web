import { Suspense } from "react";
import Topbar from "@/components/layout/Topbar";
import Container from "@/components/ui/Container";
import StatsView from "@/components/stats/StatsView";

// useSearchParams (view state lives in the URL) needs a Suspense boundary so the rest of
// the route can still prerender -- see node_modules/next/dist/docs/01-app/03-api-reference/
// 04-functions/use-search-params.md.
export default function StatsPage() {
  return (
    <>
      <Topbar title="आंकड़े और विश्लेषण" subtitle="रिपोर्टिंग, क्षेत्र और कैडर रजिस्टर का विश्लेषण" showSearch={false} />

      <div style={{ paddingBlock: "var(--space-8)" }}>
        <Container>
          <Suspense fallback={<p className="t-caption">लोड हो रहा है...</p>}>
            <StatsView />
          </Suspense>
        </Container>
      </div>
    </>
  );
}
