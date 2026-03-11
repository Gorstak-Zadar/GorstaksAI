# Local AI Platform

**Free · Unlimited · Your Hardware**

A ChatGPT-like web interface where prompts are entered on your website, but **all inference runs on the user's machine**. No cloud GPUs, no API keys, no limits.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Web app (your server) — chat UI, prompts               │
└─────────────────────────────┬───────────────────────────┘
                              │ WebSocket relay
                              ▼
┌─────────────────────────────────────────────────────────┐
│  User's PC — Worker + Ollama (local inference)          │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Install Ollama (user's machine)

[Download Ollama](https://ollama.com) and install. Then pull a model:

```bash
ollama pull llama3.2:3b
```

### 2. Install dependencies

```bash
cd local-ai-platform
npm install
cd server && npm install
cd ../web && npm install
cd ../worker && npm install
```

### 3. Start the server

```bash
cd server
npm run dev
```

Server runs at `http://localhost:3000`.

### 4. Build & serve the web app (or run dev)

**Development:**
```bash
cd web
npm run dev
```
Open `http://localhost:5173` (proxies API to 3000).

**Production:** Build and let the server serve static files:
```bash
cd web
npm run build
cd ../server
npm start
```
Open `http://localhost:3000`.

### 5. Start (automatic)

**Option A — One click (recommended)**  
Double‑click **launcher.bat** (Windows) or run `node launcher.js` (Mac/Linux).  
The launcher will fetch a session, start the worker, and open your browser.

**Option B — Manual**  
```bash
cd worker
npm start
```
Then open the URL it prints in your browser.

## Model mapping

The web UI shows models from `model-catalog.json`. The worker maps these to Ollama model names. Pull a model first: `ollama pull llama3.2:3b`
</think>
