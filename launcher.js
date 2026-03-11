/**
 * One-click launcher: fetches session, starts worker, opens browser.
 * Run from project root: node launcher.js
 */

import { spawn, exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SERVER = process.env.SERVER_URL || "https://local-ai-platform-production.up.railway.app";
const SERVER_WS = SERVER.replace("https://", "wss://").replace("http://", "ws://");

function openBrowser(url) {
  if (process.platform === "win32") {
    exec(`start "" "${url}"`);
  } else if (process.platform === "darwin") {
    exec(`open "${url}"`);
  } else {
    exec(`xdg-open "${url}"`);
  }
}

async function main() {
  console.log("Connecting...");
  const r = await fetch(`${SERVER}/api/session`);
  const { sessionId } = await r.json();

  const workerPath = path.join(__dirname, "worker", "worker.js");
  const worker = spawn("node", [workerPath], {
    env: { ...process.env, SERVER_URL: SERVER_WS, SESSION_ID: sessionId },
    cwd: __dirname,
    stdio: "inherit",
  });

  await new Promise((r) => setTimeout(r, 1500));
  console.log("Opening browser...");
  openBrowser(`${SERVER}?session=${sessionId}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
