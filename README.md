## Gorstaks AI

**Free · Unlimited · Your Hardware**

→ **[Try it live](https://gorstak-zadar.github.io/GorstaksAI/)**

A ChatGPT-like web interface where **all inference runs in the user's browser via WebGPU**. No cloud GPUs, no API keys, no limits, no installs.

### How it works

- Runs entirely in the user's browser using [WebLLM](https://webllm.mlc.ai/).
- **4 models** to choose from via dropdown:

| Model | Description |
|-------|-------------|
| **Llama 3.2 3B** | General purpose (default) |
| **Hermes 3 3B** | Creative, less filtered |
| **Qwen 3 4B** | Smarter reasoning |
| **Phi 3.5 Vision** | Understands images (shows a camera button to attach photos) |
- Uses the user's GPU via WebGPU. Requires a compatible browser (Chrome, Edge, or other Chromium-based).

## Development

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:5173` in a WebGPU-capable browser (Chrome, Edge, or other Chromium-based).

## Deployment

Hosted on GitHub Pages. Every push to `master` triggers an automatic build and deploy via GitHub Actions.

## Notes

- The first time a user opens the app, WebLLM will **download the model weights** in the background (a few GB). Subsequent loads are much faster thanks to caching.
- All prompts and responses stay in the browser. Nothing is sent to any server.

