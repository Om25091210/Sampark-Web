"use client";

import { useEffect } from "react";
import { hasSession, refreshOnce } from "@/lib/api";

// The access-token cookie is deliberately short-lived (15 min -- matches the
// backend's real JWT TTL, see lib/api.ts's ACCESS_TTL_SECONDS), and `proxy.ts`
// gates every route purely on that cookie's presence server-side, before any
// client JS runs. apiFetch's reactive "refresh on 401" only fires from an
// actual API call -- someone who just leaves a page open (reading a long list,
// writing up a rejection reason) for 15+ minutes without one gets the cookie
// deleted out from under them, and their very next click bounces straight to
// /login even though the 30-day refresh token sitting in the next cookie over
// is still perfectly valid. This is that missing piece: refresh well inside
// the access token's window, for as long as a dashboard page stays mounted, so
// a real logout only ever comes from an expired refresh token or signing out.
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export default function SessionKeepAlive() {
  useEffect(() => {
    if (!hasSession()) return;
    const id = setInterval(() => {
      refreshOnce();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return null;
}
