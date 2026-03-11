/**
 * Local AI Worker
 * Connects to the server, receives prompts, runs inference via Ollama (local),
 * streams tokens back. Uses user's hardware only.
 *
 * Requires Ollama: https://ollama.com — run: ollama pull llama3.2:3b
 */

import WebSocket from "ws";
import fetch from "node-fetch";

const CONFIG = {
  serverUrl: process.env.SERVER_URL || "ws://localhost:3000",
  sessionId: process.env.SESSION_ID || null,
  ollamaHost: process.env.OLLAMA_HOST || "http://localhost:11434",
};

async function main() {
  let sessionId = CONFIG.sessionId;
  const base = CONFIG.serverUrl.replace("ws://", "http://").replace("wss://", "https://");
  if (!sessionId) {
    const r = await fetch(`${base}/api/session`);
    const data = await r.json();
    sessionId = data.sessionId;
    console.log("\n>>> Open this URL in your browser <<<\n  " + base + "?session=" + sessionId + "\n");
  }

  const ws = new WebSocket(`${CONFIG.serverUrl}/?role=worker&sessionId=${sessionId}`);
  ws.on("open", () => console.log("Connected to server. Ready for prompts."));
  ws.on("close", () => {
    console.log("Disconnected");
    process.exit(0);
  });
  ws.on("error", (e) => {
    console.error("WebSocket error:", e.message);
    process.exit(1);
  });

  ws.on("message", async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type !== "prompt") return;

      const modelId = msg.modelId || "llama3.2:3b";
      const model = mapModelIdToOllama(modelId);
      const messages = (msg.history || []).concat({ role: "user", content: msg.prompt });

      const res = await fetch(`${CONFIG.ollamaHost}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          options: { num_predict: 0 }, // no limit
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        ws.send(JSON.stringify({ type: "error", error: `Ollama: ${err}` }));
        return;
      }

      const reader = res.body;
      let buffer = "";
      for await (const chunk of reader) {
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const obj = JSON.parse(line);
            const text = obj.message?.content;
            if (text && ws.readyState === 1) {
              ws.send(JSON.stringify({ type: "token", text }));
            }
          } catch {}
        }
      }
      if (ws.readyState === 1) ws.send(JSON.stringify({ type: "done" }));
    } catch (e) {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ type: "error", error: String(e.message) }));
      }
    }
  });
}

function mapModelIdToOllama(modelId) {
  const map = {
    "llama-3.2-3b": "llama3.2:3b",
    "phi-3-mini": "phi3:mini",
    "mistral-7b": "mistral:7b",
    "qwen2-7b": "qwen2:7b",
  };
  return map[modelId] || "llama3.2:3b";
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
