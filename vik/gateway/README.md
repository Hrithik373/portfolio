# gateway

Kong (declarative, DB-less) + Keycloak realm config — the single edge for
every service.

## kong.yml

Routes `/api/<service>/...` to each backend service, strips the prefix, and
applies per-route CORS + rate limiting on the public-facing routes
(`svc-agent`, `svc-rag`) to protect the eventual Anthropic spend budget
(architecture doc §9's go-live checklist).

## keycloak/realm-export.json

Seeds a `vik` realm with one public client (`vik-admin`, standard OIDC
redirect flow, no client secret since it's a browser SPA) for web-admin's
login. Deliberately does **not** seed any user/password — after Keycloak
starts (see `infra/docker-compose.yml`, which sets `KEYCLOAK_ADMIN` /
`KEYCLOAK_ADMIN_PASSWORD` from your own `.env`, never committed), create an
admin-console user for yourself via `http://localhost:8080/admin`.

## Dockerfile.render / kong.template.yml / render-entrypoint.sh

Render's deployment of Kong (see repo-root `render.yaml`). Local
docker-compose keeps using the plain `kong:3.7` image with `kong.yml`
bind-mounted (see `infra/docker-compose.yml`) — Render has no bind mounts
and doesn't know each upstream service's real URL until deploy time, so
this build instead bakes in `kong.template.yml` and substitutes real
`https://vik-<service>.onrender.com` URLs via `envsubst` at container
start (`render-entrypoint.sh`), which also binds Kong's proxy to Render's
`$PORT` and disables the admin API (`KONG_ADMIN_LISTEN=off` — shouldn't be
publicly reachable on a real deployment, unlike local dev's `:8001`).

## Status

| Piece | Status |
|---|---|
| Kong routing + CORS + rate limiting (local docker-compose) | Functional once services are up |
| Keycloak realm/client seed | Functional; real JWT validation on svc-crm's write routes is Phase 3 TODO (see `web-admin/src/auth.ts`) |
| Render deploy config (`Dockerfile.render` + template + entrypoint) | Builds locally and the `envsubst` substitution has been verified against fake env vars; not yet confirmed against Render's actual networking — see `vik/README.md`'s Render section |
