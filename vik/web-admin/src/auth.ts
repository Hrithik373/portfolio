/**
 * Manual OIDC redirect against Keycloak — no @react-keycloak/web dependency,
 * to keep this scaffold's dependency surface small.
 *
 * Phase 0: `completeLogin()` only checks that Keycloak redirected back with
 * an authorization `code` and treats that as "authenticated" so the
 * dashboard is reachable for demo purposes. Phase 3 TODO: actually exchange
 * the code for a token at Keycloak's token endpoint, store it, and attach
 * it as a Bearer token on GraphQL requests to svc-crm instead of gating
 * only on the code's presence.
 */
const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL ?? "http://localhost:8080";
const REALM = import.meta.env.VITE_KEYCLOAK_REALM ?? "vik";
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "vik-admin";

const SESSION_KEY = "vik-admin-authenticated";

export function buildLoginUrl(): string {
  const redirectUri = window.location.origin;
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid",
  });
  return `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/auth?${params}`;
}

export function completeLoginFromUrl(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.has("code")) {
    sessionStorage.setItem(SESSION_KEY, "true");
    window.history.replaceState({}, "", window.location.pathname);
    return true;
  }
  return sessionStorage.getItem(SESSION_KEY) === "true";
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.reload();
}
