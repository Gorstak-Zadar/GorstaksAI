import express from "express";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());

// Serve static web app from ../web/dist (after build)
const webDist = join(__dirname, "..", "web", "dist");
app.use(express.static(webDist));

// Serve model catalog
app.get("/api/catalog", (req, res) => {
  try {
    const catalog = JSON.parse(
      readFileSync(join(__dirname, "..", "model-catalog.json"), "utf-8")
    );
    res.json(catalog);
  } catch (err) {
    res.status(500).json({ error: "Failed to load catalog" });
  }
});

// Generate a new session ID for pairing browser + worker
app.get("/api/session", (req, res) => {
  const sessionId = uuidv4();
  sessions.set(sessionId, { browser: null, worker: null, createdAt: Date.now() });
  res.json({ sessionId });
});

// SPA fallback (must be last)
app.get("*", (req, res) => {
  res.sendFile(join(webDist, "index.html"));
});

const sessions = new Map();
const PORT = process.env.PORT || 3000;
const wss = new WebSocketServer({ server });

function cleanupSession(sessionId) {
  const s = sessions.get(sessionId);
  if (s) {
    if (s.browser) s.browser.close();
    if (s.worker) s.worker.close();
    sessions.delete(sessionId);
  }
}

wss.on("connection", (ws, req) => {
  const url = new URL(req.url || "", `http://${req.headers.host}`);
  const role = url.searchParams.get("role"); // "browser" | "worker"
  const sessionId = url.searchParams.get("sessionId");

  if (!role || !sessionId) {
    ws.close(4000, "Missing role or sessionId");
    return;
  }

  let s = sessions.get(sessionId);
  if (!s) {
    s = { browser: null, worker: null, createdAt: Date.now() };
    sessions.set(sessionId, s);
  }

  if (role === "browser") {
    if (s.browser) s.browser.close();
    s.browser = ws;
    ws.on("message", (data) => {
      if (s.worker && s.worker.readyState === 1) {
        s.worker.send(data);
      }
    });
  } else if (role === "worker") {
    if (s.worker) s.worker.close();
    s.worker = ws;
    ws.on("message", (data) => {
      if (s.browser && s.browser.readyState === 1) {
        s.browser.send(data);
      }
    });
  }

  ws.on("close", () => {
    if (role === "browser") s.browser = null;
    if (role === "worker") s.worker = null;
    if (!s.browser && !s.worker) cleanupSession(sessionId);
  });

  ws.on("error", () => ws.close());
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
