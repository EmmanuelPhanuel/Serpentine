# Serpentine

A browser Snake arcade game built with React, TypeScript, Vite and Tailwind CSS v4. The game uses a 21 × 21 canvas board with fixed-step movement and interpolated rendering.

## Run locally

Requires **Node.js 22.13+** and npm.

```bash
npm ci
npm run dev
```

Open **http://127.0.0.1:3000**. The development server listens locally and requires port 3000 to be available. To use another port: `npm run dev -- --port 3001`.

On Windows PowerShell, use `npm.cmd` instead of `npm` if script execution policy blocks npm.ps1.

## Checks and production build

```bash
npm test          # regression tests using Node's built-in test runner
npm run typecheck # TypeScript checking only
npm run build     # type checking, then production output in dist/
npm run preview   # serve dist/ locally; follow the printed URL
```

GitHub Actions runs tests and the build on pushes and pull requests. Tests cover movement, turn buffering, scoring, collisions, full-board victory, HUD notifications, reduced-motion effects, saved preferences and keyboard filtering. Renderer tests check execution with a stub canvas; they do not replace visual browser testing.

## How to play

Eat apples to grow and score points. Hitting a wall or your body ends the run. Moving into the cell the tail is leaving is allowed when not eating. Fill all 441 cells to win.

| Pace | Points per apple | Starting steps per second |
| --- | --- | --- |
| Chill (Garden) | 10 | 6.1 |
| Classic | 20 | 8.5 |
| Turbo | 30 | 11.9 |

Every apple increases speed up to the pace's limit. Switching pace resets the run.

## Levels, worlds and snake colors

There are **30 named stages across 10 environments**, followed by endless expeditions. Each stage advances when you reach **either its score target or snake-length target**, without interrupting the run. Starting from length 3, each level adds 100 points to the score target and 6 segments to the length target.

For example, level 2 unlocks at **100 points OR length 9**; level 3 at **200 points OR length 15**. The HUD shows both targets and how much remains. This means the first level-up takes 6 apples on Chill (length), 5 on Classic (points), or 4 on Turbo (points).

| Level | Score to enter | Environment |
| --- | --- | --- |
| 1 | 0 | Emerald Garden: forest canopy and leaves |
| 2 | 100 | Amber Dunes: desert sands and dunes |
| 3 | 200 | Frostpeak: snowy peaks and ice crystals |
| 4 | 300 | Tidal Lagoon: ocean waves and bubbles |
| 5 | 400 | Ember Caldera: volcanic stone and lava |
| 6 | 500 | Starlight Drift: planets and stars |

Levels 7–10 introduce Jade Jungle, Copper Canyon, Prism Cavern and Moonlit Marsh. Levels 11–20 revisit the environments at golden hour with new names and palettes; levels 21–30 take the journey into the night. Each stage has a distinct name and appearance. After level 30, further expeditions continue with increasing targets. Level 30 is reachable at 2,900 points OR length 177, before the board fills.

Environments change the page colors, scenery and board texture, while collision rules remain the same. Restarting or changing difficulty returns to level 1. Scroll the World Journey panel to browse all 30 destinations and their targets.

Collect **18 distinct snake styles**, with stronger colors, tiger stripes, panda spots, diamonds, lightning marks and actual rainbow body segments. The Snake Color panel shows previews, names and unlock requirements. It sits on the left on large screens or below the controls on smaller screens.

| Level reached | Style unlocked |
| --- | --- |
| 1 | Classic Lime |
| 2 | Electric Blue |
| 3 | Royal Gold |
| 4 | Crimson |
| 5 | Ultraviolet |
| 6 | Panda |
| 7 | Neon Mint |
| 8 | Arctic |
| 10 | Candy |
| 12 | Sunset |
| 14 | Volt |
| 16 | Nebula |
| 18 | Tiger |
| 20 | Lava |
| 22 | Aurora |
| 24 | Emerald |
| 27 | Rainbow |
| 30 | Chrome |

Only earned styles can be equipped. Unlocks use your **highest level ever reached on this device** and remain available after restarting, changing difficulty, or reloading. Existing best scores are converted to progression when migrating an older save. A saved style that has not been earned falls back to Classic Lime. You can change an unlocked style during a run without losing progress, and your selection stays the same across environments. Reduced-motion preferences also apply to environmental animation and level notifications.

The layout adapts to portrait and landscape screens. Smaller screens use a single column; the board and overlays fit their available space, and color controls keep a minimum 44px target. The D-pad appears on smaller screens and devices with a coarse pointer, including large touchscreens. Pointer presses act immediately, keyboard activation remains available, and swipe thresholds scale with board size. Arrow/WASD keys never repeat turns or scroll the page while held. Focused form fields, buttons and the scrollable World Journey retain their normal keyboard controls.

- **Arrows / WASD:** steer; also start from the ready screen.
- **Space / P:** start, pause or resume.
- **Enter:** start or retry after a loss or win.
- **R:** restart. **M:** toggle sound.
- **Touch:** swipe on the board or use the D-pad.
- **Keyboard navigation:** Tab to buttons, then Enter or Space to activate.

Held keys do not repeat game shortcuts. Editing fields and browser modifier shortcuts retain their normal behavior. Gameplay pauses when the tab becomes hidden or the window loses focus.

## Preferences and accessibility

Best scores per pace, selected pace and sound preference are saved in browser localStorage. Play remains available if storage is blocked. There is no backend or cross-device score synchronization.

Focus indicators, status announcements and keyboard-operable controls are included. The system's reduced-motion preference disables decorative animations, screen shake, particles and score popups; essential snake movement remains visible.

Sound effects are synthesized with Web Audio. Graphics use canvas, CSS and inline SVG. **Fonts are fetched from Google Fonts**; system fallbacks are used when unavailable.

## Project structure

```text
src/
  App.tsx                  Page layout and shared HUD
  components/ui.tsx        Panels, icons, difficulty controls and D-pad
  hooks/usePreferences.ts  React preference state and persistence effects
  preferences.ts           Save validation and storage access
  game/
    SnakeGame.tsx          React integration, input, overlays and animation loop
    engine.ts              Simulation, scoring, collisions and effects
    renderer.ts            Canvas drawing and interpolation
    worlds.ts              Score thresholds, world themes and snake palettes
    terrain.ts             Decorative canvas scenery for each environment
    input.ts               Keyboard shortcut filtering
    audio.ts               Web Audio effects
  index.css                Theme, layout utilities and motion preferences
tests/                     Engine, renderer, input and persistence regressions
```

## License

MIT
