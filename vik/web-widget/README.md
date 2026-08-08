# web-widget

The `<VikChat/>` chat widget — Vite + React + TypeScript.

## Status

| Piece | Status |
|---|---|
| `<VikChat/>` (message list, input, POST-based SSE streaming) | Functional against a running svc-agent (directly, or through Kong) |
| Embedding this as a widget on the actual portfolio site | Not implemented — Phase 3/4 TODO. Today this runs as its own standalone page; embedding it into `hrithikghportfolio`'s own React app (as an iframe or a published component) is future work. |

## Run locally

```
npm install
cp .env.example .env       # point at svc-agent directly or through Kong
npm run dev                 # http://localhost:5173
```

## Notes

`streamChat()` in `src/VikChat.tsx` reads `POST /chat`'s `text/event-stream`
body manually via `fetch()` + `ReadableStream`, since the browser's native
`EventSource` only supports GET requests.
