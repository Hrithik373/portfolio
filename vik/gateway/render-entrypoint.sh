#!/bin/sh
# Render entrypoint: substitutes each upstream's full URL (set directly as
# literal env var values in render.yaml, e.g. SVC_AGENT_URL=https://vik-svc-agent.onrender.com)
# into kong.template.yml, binds Kong's proxy to Render's $PORT, then hands
# off to Kong's normal startup. Defaults below match render.yaml's planned
# service names — if Render appended a collision suffix to any of them,
# override the corresponding env var in the Render dashboard instead of
# relying on these fallbacks.
set -e

: "${SVC_AGENT_URL:=https://vik-svc-agent.onrender.com}"
: "${SVC_RAG_URL:=https://vik-svc-rag.onrender.com}"
: "${SVC_GUARD_URL:=https://vik-svc-guard.onrender.com}"
: "${SVC_CRM_URL:=https://vik-svc-crm.onrender.com}"
: "${SVC_VOICE_URL:=https://vik-svc-voice.onrender.com}"
: "${SVC_TRANSLATE_URL:=https://vik-svc-translate.onrender.com}"
: "${SVC_VISION_URL:=https://vik-svc-vision.onrender.com}"
: "${FRONTEND_ORIGIN:=https://hrithikghosh.vercel.app}"
export SVC_AGENT_URL SVC_RAG_URL SVC_GUARD_URL SVC_CRM_URL SVC_VOICE_URL SVC_TRANSLATE_URL SVC_VISION_URL FRONTEND_ORIGIN

envsubst \
  '${SVC_AGENT_URL} ${SVC_RAG_URL} ${SVC_GUARD_URL} ${SVC_CRM_URL} ${SVC_VOICE_URL} ${SVC_TRANSLATE_URL} ${SVC_VISION_URL} ${FRONTEND_ORIGIN}' \
  < /kong.template.yml > /tmp/kong.yml

export KONG_PROXY_LISTEN="0.0.0.0:${PORT:-8000}"

exec /docker-entrypoint.sh kong docker-start
