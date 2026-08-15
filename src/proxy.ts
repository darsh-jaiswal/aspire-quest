import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * First gate only. (Next 16 renamed this convention from `middleware` to
 * `proxy`; the behaviour is unchanged.)
 *
 * This keeps anonymous traffic off the console, but it is NOT the
 * authorization boundary — it knows nothing about roles or company
 * membership. Every protected page and Server Action re-checks via
 * `src/lib/auth.ts`. If a route is added here and nowhere else, it is unsafe.
 */
const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/portal(.*)",
  "/api/resume/download(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Everything except Next internals and static files, unless it has a query.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
