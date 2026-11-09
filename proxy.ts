import { NextResponse, type NextRequest } from "next/server";
import { resolveRouteRedirect } from "@/auth/route-access";
import { updateSession } from "@/shared/supabase/proxy";

const INTERNAL_HEADER_PREFIX = "x-middleware-";

// Conserva las cookies refrescadas y los headers de caché de la sesión
function redirectKeepingSession(
  request: NextRequest,
  destination: string,
  sessionResponse: NextResponse,
) {
  const redirectResponse = NextResponse.redirect(
    new URL(destination, request.url),
  );

  sessionResponse.cookies
    .getAll()
    .forEach((cookie) => redirectResponse.cookies.set(cookie));
  sessionResponse.headers.forEach((value, key) => {
    if (!key.startsWith(INTERNAL_HEADER_PREFIX)) {
      redirectResponse.headers.set(key, value);
    }
  });

  return redirectResponse;
}

export async function proxy(request: NextRequest) {
  const { response, hasSession } = await updateSession(request);

  const destination = resolveRouteRedirect(
    request.nextUrl.pathname,
    hasSession,
  );
  if (!destination) return response;

  return redirectKeepingSession(request, destination, response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
