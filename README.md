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

### 5. Start the worker (user's machine)

```bash
cd worker
npm start
```

The worker will fetch a session and print a URL. **Open that URL in your browser** — the web app will use the same session and connect to your local worker.

- **Production:** URL will be `http://localhost:3000?session=...` (or your deployed host).
- **Development (Vite):** Use `http://localhost:5173?session=...` instead — replace the port with 5173 and keep the `?session=...` part.

## Model mapping

The web UI shows models from `model-catalog.json`. The worker maps these to Ollama model names. Pull a model first: `ollama pull llama3.2:3b`
</think>
