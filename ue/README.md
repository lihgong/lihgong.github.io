# UE Speaker Controller

## Local development

Run these commands from this directory:

```powershell
npm install
npm run dev
```

Open the `/ue/` local URL printed by Vite. `localhost` is a secure browser
context for Web Bluetooth during development.

## TypeScript and production build

```powershell
npm run typecheck
npm run build
```

The build is written to `dist/`. The Vite base path is configured for the
GitHub Pages URL `https://lihgong.github.io/ue/`.
