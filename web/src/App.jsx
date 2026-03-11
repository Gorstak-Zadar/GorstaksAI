import React, { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

const API_BASE = import.meta.env.DEV ? "http://localhost:3000" : "";
const WS_BASE = import.meta.env.DEV ? "ws://localhost:3000" : (() => {
  const u = new URL(window.location.href);
  return `${u.protocol === "https:" ? "wss:" : "ws:"}//${u.host}`;
})();

function App() {
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | no-worker | error
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const wsRef = useRef(null);
  const streamBufferRef = useRef("");
  const streamMsgRef = useRef(null);

  const fetchSession = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("session");
    if (fromUrl) {
      setSessionId(fromUrl);
      return fromUrl;
    }
    try {
      const r = await fetch(`${API_BASE}/api/session`);
      const { sessionId: sid } = await r.json();
      setSessionId(sid);
      return sid;
    } catch (e) {
      setStatus("error");
      return null;
    }
  }, []);

  const fetchCatalog = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/catalog`);
      const { models: m } = await r.json();
      setModels(m || []);
      if (m?.length && !selectedModel) setSelectedModel(m[0].id);
    } catch {
      setModels([]);
    }
  }, [selectedModel]);

  useEffect(() => {
    fetchSession();
    fetchCatalog();
  }, [fetchSession, fetchCatalog]);

  const connectBrowser = useCallback(
    (sid) => {
      if (!sid) return;
      const ws = new WebSocket(
        `${WS_BASE}/?role=browser&sessionId=${sid}`
      );
      ws.onopen = () => setStatus("ready");
      ws.onclose = () => {
        setStatus("no-worker");
        setStreaming(false);
      };
      ws.onerror = () => setStatus("error");
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === "token") {
            streamBufferRef.current += msg.text || "";
            setStreaming(true);
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant" && last.streaming) {
                return prev.slice(0, -1).concat({
                  ...last,
                  content: streamBufferRef.current,
                });
              }
              return prev.concat({
                role: "assistant",
                content: streamBufferRef.current,
                streaming: true,
              });
            });
          } else if (msg.type === "done") {
            setStreaming(false);
            streamBufferRef.current = "";
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant" && last.streaming) {
                return prev.slice(0, -1).concat({
                  ...last,
                  content: last.content,
                  streaming: false,
                });
              }
              return prev;
            });
          } else if (msg.type === "error") {
            setStreaming(false);
            setMessages((prev) =>
              prev.concat({
                role: "assistant",
                content: `Error: ${msg.error || "Unknown error"}`,
                error: true,
              })
            );
          }
        } catch {}
      };
      wsRef.current = ws;
    },
    []
  );

  useEffect(() => {
    if (sessionId && status === "loading") connectBrowser(sessionId);
  }, [sessionId, status, connectBrowser]);

  const sendPrompt = () => {
    const text = input.trim();
    if (!text || streaming) return;
    if (status !== "ready") return;

    setMessages((prev) => prev.concat({ role: "user", content: text }));
    setInput("");
    streamBufferRef.current = "";

    wsRef.current?.send(
      JSON.stringify({
        type: "prompt",
        prompt: text,
        modelId: selectedModel,
        history: messages
          .filter((m) => m.role === "user" || (m.role === "assistant" && !m.streaming))
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content })),
      })
    );
  };

  return (
    <div className="app">
      <header>
        <h1>Local AI</h1>
        <p>Free · Unlimited · Your Hardware</p>
        <div className="status">
          {status === "loading" && <span className="dot pulse" />}
          {status === "ready" && <span className="dot ok" />}
          {status === "no-worker" && <span className="dot warn" />}
          {status === "error" && <span className="dot err" />}
          <span>
            {status === "loading" && "Connecting…"}
            {status === "ready" && "Worker connected — Ready"}
            {status === "no-worker" && "Worker disconnected — Start the worker app"}
            {status === "error" && "Connection error"}
          </span>
        </div>
        {sessionId && status !== "ready" && (
          <div className="session-hint">
            Session: <code>{sessionId}</code> — Run the worker with this session ID
          </div>
        )}
      </header>

      <div className="controls">
        <select
          value={selectedModel || ""}
          onChange={(e) => setSelectedModel(e.target.value)}
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="chat">
        {messages.length === 0 && (
          <div className="empty">
            <p>Type anything. No limits. Your machine does the work.</p>
            <p className="sub">Code, essays, ideas, analysis — all local.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role} ${m.error ? "error" : ""}`}>
            <span className="role">{m.role}</span>
            <div className="content">
              {m.content}
              {m.streaming && <span className="cursor" />}
            </div>
          </div>
        ))}
      </div>

      <div className="input-row">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendPrompt();
            }
          }}
          placeholder="Type your prompt…"
          rows={2}
          disabled={streaming || status !== "ready"}
        />
        <button
          onClick={sendPrompt}
          disabled={!input.trim() || streaming || status !== "ready"}
        >
          {streaming ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}

export default App;
