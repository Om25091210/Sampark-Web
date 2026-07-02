import Topbar from "@/components/layout/Topbar";
import Container from "@/components/ui/Container";
import StatCard from "@/components/dashboard/StatCard";
import BarChart from "@/components/dashboard/BarChart";
import CSPPerformance from "@/components/dashboard/CSPPerformance";
import RecentReportsTable from "@/components/dashboard/RecentReportsTable";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import { STAT_CARDS } from "@/lib/constants";

export default function DashboardPage() {
  return (
    <>
      <Topbar
        title="प्रदर्शन डैशबोर्ड"
        subtitle="बीजापुर पुलिस — आज का अवलोकन"
      />

      <div style={{ paddingBlock: "var(--space-8)" }}>
        <Container>
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>

            {/* Metric cards */}
            <div className="stat-grid">
              {STAT_CARDS.map((card) => (
                <StatCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  delta={card.delta}
                  color={card.color as "accent" | "orange" | "success" | "danger"}
                  icon={card.icon}
                />
              ))}
            </div>

            {/* Body: main column (chart + reports) + right rail (CSP + activity) */}
            <div className="dash-columns">
              <div className="dash-col">
                <BarChart />
                <RecentReportsTable />
              </div>
              <div className="dash-col">
                <CSPPerformance />
                <ActivityFeed />
              </div>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
