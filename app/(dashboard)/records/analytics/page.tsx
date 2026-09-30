import { redirect } from "next/navigation";

// This page was mock data (hardcoded arrays and raw hex). The real analytics live at /stats;
// the route stays only so old links and bookmarks land somewhere useful.
export default function AnalyticsRedirect() {
  redirect("/stats");
}
