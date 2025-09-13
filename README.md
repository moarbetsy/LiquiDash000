<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/14sjHxmSf8e6r10ODiBHmreB_jlcedxWB

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Structure

```
.
├── src/
│   ├── components/       # UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Data and utilities
│   ├── App.tsx           # App root
│   ├── index.tsx         # Entrypoint
│   └── types.ts          # Shared types
├── index.html            # Vite HTML entry
├── vite.config.ts        # Vite config (with manualChunks + alias)
├── tsconfig.json         # TS config (with @/* -> src/* path alias)
└── ...
```

## Build optimizations

- Added Rollup `manualChunks` to split vendor and heavy libraries (`recharts`, `framer-motion`, `lucide-react`) into separate chunks for faster first load and better browser caching.
- Set `@` alias to `src/` for cleaner imports.

