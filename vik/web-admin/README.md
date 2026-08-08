# web-admin

Admin dashboard — Vite + React + TypeScript. Keycloak-gated view of leads
captured via svc-crm's GraphQL API.

## Status

| Piece | Status |
|---|---|
| Manual OIDC redirect to Keycloak (`src/auth.ts`) | Functional as a redirect flow |
| Real token exchange + Bearer-authenticated GraphQL requests | Not implemented — Phase 3 TODO. Today, successfully returning from the Keycloak redirect (i.e. the URL contains a `code` param) is treated as "authenticated" so the dashboard is reachable for demo purposes; no token is actually validated or attached to requests yet. |
| `<Dashboard/>` querying svc-crm's `/graphql` for leads | Functional against a running svc-crm |

## Run locally

```
npm install
cp .env.example .env
npm run dev   # http://localhost:5174
```

Requires a Keycloak instance with a `vik` realm and a public `vik-admin`
client (see `../gateway/keycloak/realm-export.json`) for the login redirect
to resolve; svc-crm can be queried directly without Keycloak running.
