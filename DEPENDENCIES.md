# Dependencies — Serpentine

## What the game actually needs

| Package | Version | Role |
| --- | --- | --- |
| `react` | ^18.2.0 | UI layer (HUD, overlays, panels) |
| `react-dom` | ^18.2.0 | Renders React into the DOM |
| `tailwindcss` | ^4.1.7 | Styling system (utility classes + theme tokens) |
| `@tailwindcss/vite` | ^4.1.7 | Tailwind v4 Vite plugin |
| `@vitejs/plugin-react` | ^4.3.4 | React fast-refresh/JSX for Vite |
| `vite` | ^6.3.5 | Dev server + production bundler |
| `typescript` | ^5.7.0 | Type checking (game engine is fully typed) |
| `@types/react` / `@types/react-dom` | ^18.2.0 | TS definitions for React |

## Not needed / zero external assets

- **No images, sprites, or fonts to download** — fonts (`Silkscreen`, `Chakra Petch`) load from Google Fonts CDN at runtime; all icons are inline SVG.
- **No audio files** — sound effects are synthesized at runtime with the WebAudio API (`src/game/audio.ts`).
- The whole game logic (`src/game/engine.ts`) is plain TypeScript + Canvas 2D — no game libraries.

## Extras in package.json (installed in this sandbox, unused by the game)

`@dnd-kit/*`, `@supabase/supabase-js`, `canvas-confetti`, `date-fns`, `framer-motion`, `lucide-react`, `react-router-dom`, `recharts`, `uuid` — safe to ignore (or remove if you trim the manifest).

## Install everything in one command

```bash
npm install        # reads package.json + package-lock.json, downloads the full tree
```

Requires **Node.js 18+** (20+ recommended). Then `npm run dev` to play locally.
