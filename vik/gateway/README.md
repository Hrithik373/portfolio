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

## Dockerfile.cloudrun / kong.template.yml / cloudrun-entrypoint.sh

Cloud Run's deployment of Kong (see `.github/workflows/ci.yml`'s `deploy`
job). Local docker-compose keeps using the plain `kong:3.7` image with
`kong.yml` bind-mounted (see `infra/docker-compose.yml`) — Cloud Run has no
bind mounts and doesn't know each upstream service's real URL until that
service's own first deploy, so this build instead bakes in
`kong.template.yml` and substitutes the real URLs (captured by the CI job
from each service's deploy output, passed in via `--set-env-vars`) via
`envsubst` at container start (`cloudrun-entrypoint.sh`), which also binds
Kong's proxy to Cloud Run's `$PORT` and disables the admin API
(`KONG_ADMIN_LISTEN=off` — shouldn't be publicly reachable on a real
deployment, unlike local dev's `:8001`). Unlike a fixed-hostname platform,
there are no fallback default URLs here — the entrypoint fails loudly if
any required `SVC_*_URL` is missing rather than guess.

## Status

| Piece | Status |
|---|---|
| Kong routing + CORS + rate limiting (local docker-compose) | Functional once services are up |
| Keycloak realm/client seed | Functional; real JWT validation on svc-crm's write routes is Phase 3 TODO (see `web-admin/src/auth.ts`) |
| Cloud Run deploy config (`Dockerfile.cloudrun` + template + entrypoint) | Builds locally and the `envsubst` substitution has been verified against fake env vars (both explicit values and the missing-var failure path); not yet confirmed against a real `gcloud run deploy` — see `vik/README.md`'s Cloud Run section |
