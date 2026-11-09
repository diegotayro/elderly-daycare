const PUBLIC_ROUTES = ["/login", "/activate-account"];
const LOGIN_ROUTE = "/login";
const HOME_ROUTE = "/";

// Devuelve la ruta destino, o null si la petición puede continuar.
export function resolveRouteRedirect(
  pathname: string,
  hasSession: boolean,
): string | null {
  if (!hasSession) {
    return PUBLIC_ROUTES.includes(pathname) ? null : LOGIN_ROUTE;
  }
  return pathname === LOGIN_ROUTE ? HOME_ROUTE : null;
}
