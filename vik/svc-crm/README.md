# svc-crm

Spring Boot lead/CRM microservice — REST + GraphQL. Mirrors the Amdocs
CRM/OMS (Java + Spring) résumé line, now serving Vik's recruiter-lead capture
instead of telecom billing.

## Status

| Piece | Status |
|---|---|
| `/actuator/health`, `/actuator/prometheus` | Functional |
| `POST /leads`, `GET /leads` (REST) | Functional, backed by JPA. Defaults to an in-memory H2 database locally/in tests; `docker-compose` points it at Postgres via `DB_URL`. |
| `POST /graphql` (`leads`, `lead(id)` queries) | Functional |
| svc-agent's `capture_lead` tool actually calling this | Not wired yet — Phase 3 TODO |
| Keycloak-gated write access | Not implemented — Phase 3 TODO |

## Run locally

Requires a JDK (21) + Maven, or just build/run via Docker if neither is installed locally:

```
mvn spring-boot:run
# or
docker build -t vik-svc-crm . && docker run -p 8016:8016 vik-svc-crm
```

## API

- `GET /actuator/health`
- `POST /leads` — `{"name": "...", "email": "...", "note": "...", "source": "..."}`
- `GET /leads`
- `POST /graphql` — `{ leads { id name email createdAt } }` (GraphiQL UI at `/graphiql`)
