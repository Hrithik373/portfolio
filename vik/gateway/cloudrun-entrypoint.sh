#!/bin/sh
# Cloud Run entrypoint: substitutes each upstream's real URL (captured by
# the CI workflow from that service's own `gcloud run deploy` output — see
# .github/workflows/ci.yml's deploy job — and passed in via --set-env-vars)
# into kong.template.yml, binds Kong's proxy to Cloud Run's $PORT, then
# hands off to Kong's normal startup.
#
# Unlike the earlier Render attempt, there are NO fallback defaults here:
# Cloud Run assigns each service a random-hash URL only known after its
# first deploy, so a hardcoded guess would just be wrong. Every SVC_*_URL
# below is required — fail loudly and immediately if one's missing rather
# than boot Kong with a broken route silently.
set -e

for var in SVC_AGENT_URL SVC_RAG_URL SVC_GUARD_URL SVC_VOICE_URL SVC_TRANSLATE_URL SVC_VISION_URL; do
  eval "val=\$$var"
  if [ -z "$val" ]; then
    echo "FATAL: $var is not set — Kong cannot start without every upstream URL. See .github/workflows/ci.yml's deploy job." >&2
    exit 1
  fi
done

: "${FRONTEND_ORIGIN:=https://hrithikgh.vercel.app}"
export FRONTEND_ORIGIN

envsubst \
  '${SVC_AGENT_URL} ${SVC_RAG_URL} ${SVC_GUARD_URL} ${SVC_VOICE_URL} ${SVC_TRANSLATE_URL} ${SVC_VISION_URL} ${FRONTEND_ORIGIN}' \
  < /kong.template.yml > /tmp/kong.yml

export KONG_PROXY_LISTEN="0.0.0.0:${PORT:-8000}"

exec /docker-entrypoint.sh kong docker-start
