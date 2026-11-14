"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/shared/supabase/client";

const INVALID_LINK_ROUTE = "/login?error=invalid_invitation_link";
const CREATE_PASSWORD_ROUTE = "/create-password";

type SessionTokens = { accessToken: string; refreshToken: string };

// El link de Supabase devuelve la sesión en el fragmento (#access_token=…),
// que el servidor no puede leer.
function readSessionTokens(hash: string): SessionTokens | null {
  const params = new URLSearchParams(hash.slice(1));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (params.has("error") || params.has("error_code")) return null;
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export function AcceptInvite() {
  // En desarrollo React monta el efecto dos veces; el token solo se usa una
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function acceptInvite() {
      const tokens = readSessionTokens(window.location.hash);
      if (!tokens) {
        window.location.replace(INVALID_LINK_ROUTE);
        return;
      }

      const { error } = await createClient().auth.setSession({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });
      // Los tokens no deben quedar en el historial del navegador
      window.history.replaceState(null, "", window.location.pathname);

      // Navegación completa para que el servidor lea las cookies nuevas
      window.location.replace(
        error ? INVALID_LINK_ROUTE : CREATE_PASSWORD_ROUTE,
      );
    }

    void acceptInvite();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <p role="status" className="m-0 text-[15px] text-muted-strong">
        Preparando tu cuenta…
      </p>
    </main>
  );
}
