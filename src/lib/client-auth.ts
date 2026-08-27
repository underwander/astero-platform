"use client";

export type CurrentSession = {
  id: string;
  email: string;
  role: string;
  isBlocked: boolean;
  balance: number;
};

let sessionRequest: Promise<CurrentSession | null> | null = null;

export function clearClientAuthState() {
  localStorage.removeItem("userId");
  localStorage.removeItem("email");
  localStorage.removeItem("role");
  localStorage.removeItem("isBlocked");
  sessionStorage.removeItem("astero.auth.session");
  sessionRequest = null;
}

export function storeClientAuthState(session: CurrentSession) {
  localStorage.setItem("userId", session.id);
  localStorage.setItem("email", session.email);
  localStorage.setItem("role", session.role);
  localStorage.setItem("isBlocked", String(session.isBlocked));
  localStorage.setItem("astero.auth.event", `login:${Date.now()}`);
}

export function getCurrentSession({ force = false }: { force?: boolean } = {}) {
  if (force) sessionRequest = null;
  sessionRequest ??= fetch("/api/session", {
    cache: "no-store",
    credentials: "same-origin",
  })
    .then(async (response) => {
      if (response.status === 401) {
        clearClientAuthState();
        return null;
      }
      if (!response.ok) throw new Error(`Session initialization failed: ${response.status}`);
      const session = (await response.json()) as CurrentSession;
      storeClientAuthState(session);
      return session;
    })
    .catch((error) => {
      sessionRequest = null;
      throw error;
    });

  return sessionRequest;
}
