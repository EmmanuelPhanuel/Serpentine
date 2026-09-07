# Dependencies — Serpentine

Requires **Node.js 22.13+**. Install the exact locked dependency tree with `npm ci`.

| Package | Purpose |
| --- | --- |
| react / react-dom | UI, HUD, overlays and DOM rendering |
| @vercel/analytics | Existing Vercel Web Analytics integration |
| tailwindcss / @tailwindcss/vite | Styling and Vite integration |
| @vitejs/plugin-react | JSX transformation and development refresh |
| vite | Development server and production bundler |
| typescript | Static type checking |
| @types/react / @types/react-dom | React TypeScript definitions |

React, React DOM and Vercel Analytics are runtime package dependencies. Unused routing, charting, animation, database and drag-and-drop packages have been removed.

Tests use [Node's built-in TypeScript support](https://nodejs.org/api/typescript.html) and test runner. No additional test framework is required. `npm run build` also runs the TypeScript checker; type stripping alone does not check types.

Graphics are drawn locally with canvas, CSS and SVG. Audio is synthesized with Web Audio. Fonts are the external asset dependency: Silkscreen and Chakra Petch load from Google Fonts at runtime, with local system fallbacks.

See package.json for allowed version ranges and package-lock.json for exact resolved versions.
