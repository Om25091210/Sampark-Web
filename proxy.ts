import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Real, server-enforced route gating (replaces the old client-side sessionStorage
// check in `(dashboard)/layout.tsx`, which no proxy/middleware could ever see). This
// only checks that an access-token cookie is present -- it does not verify the JWT
// signature (no JWT_SECRET belongs on the web tier). Per-role authorization is still
// the backend's job (every route CLAUDE.md rule: API-enforced, never UI-only); this
// is just "logged in or not" so an unauthenticated visitor never sees a dashboard
// shell flash before the client-side redirect used to kick in.
//
// Next.js 16 renamed the `middleware.ts` file convention to `proxy.ts` (the exported
// function is now named `proxy`, not `middleware`) -- see
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md.
const PUBLIC_PATHS = ["/login", "/"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.includes(pathname);
  const hasSession = request.cookies.has("sampark_access_token");

  if (!isPublic && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico)$).*)"],
};
