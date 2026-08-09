import Sidebar from "@/components/layout/Sidebar";

// Route gating is now `middleware.ts` (server-enforced, reads the access-token
// cookie before this layout ever renders) -- the old client-side sessionStorage
// check + "checking/denied" spinner state is gone, since there is nothing left
// for it to guard against.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      <Sidebar />
      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}
