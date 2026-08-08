import { useRef, useState } from "react";

// Through Kong in docker-compose; overridable for standalone dev against
// svc-agent directly (see .env.example).
const AGENT_CHAT_URL =
  import.meta.env.VITE_AGENT_CHAT_URL ?? "http://localhost:8000/api/agent/chat";

interface Message {
  role: "user" | "vik";
  text: string;
}

/**
 * FastAPI's /chat streams over a POST request, not a GET, so the browser's
 * native EventSource (GET-only) can't be used here — this reads the
 * `text/event-stream` body manually via fetch()'s ReadableStream instead.
 */
async function streamChat(
  message: string,
  onToken: (token: string) => void,
): Promise<void> {
  const response = await fetch(AGENT_CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const event of events) {
      const line = event.trim();
      if (!line.startsWith("data:")) continue;
      const payload = JSON.parse(line.slice("data:".length).trim());
      if (payload.token) onToken(payload.token);
    }
  }
}

export function VikChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "vik",
      text: "Hi, I'm Vik — ask me about Hrithik's experience, projects, or skills.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const vikMessageIndex = useRef<number | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { role: "user", text }, { role: "vik", text: "" }]);
    vikMessageIndex.current = messages.length + 1;
    setInput("");
    setSending(true);

    try {
      await streamChat(text, (token) => {
        setMessages((prev) => {
          const next = [...prev];
          const idx = vikMessageIndex.current!;
          next[idx] = { role: "vik", text: next[idx].text + token };
          return next;
        });
      });
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        const idx = vikMessageIndex.current!;
        next[idx] = {
          role: "vik",
          text: "Sorry, I couldn't reach the agent service just now.",
        };
        return next;
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="vik-chat">
      <div className="vik-chat__messages">
        {messages.map((m, i) => (
          <div key={i} className={`vik-chat__bubble vik-chat__bubble--${m.role}`}>
            {m.text}
          </div>
        ))}
      </div>
      <form
        className="vik-chat__input-row"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Vik about Hrithik's work..."
          disabled={sending}
        />
        <button type="submit" disabled={sending || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
