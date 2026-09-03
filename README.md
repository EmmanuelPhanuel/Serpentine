# 🐍 Serpentine

A modern arcade take on the classic Snake game. Built with **React + TypeScript + Vite**, rendered on a **HTML5 canvas** with a fixed-timestep game loop, and styled with **Tailwind CSS v4**.

![Status](https://img.shields.io/badge/status-playable-brightgreen)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20TS-blue)

## ✨ Features

- **Smooth movement** — fixed-step tick logic with frame-interpolated rendering, silky on any refresh rate
- **Juice** — particle bursts, floating score popups, screen shake, snake tongue flicks, pulsing apples
- **Three difficulties** — Garden 🌿 (chill), Classic ⚡, Turbo 🚀 (increasing speed, ramp, and score multipliers ×1/×2/×3)
- **High scores** — persisted per difficulty in `localStorage`, with live "NEW BEST" detection
- **Controls**
  - ⌨️ Keyboard: Arrows / WASD to steer · Space = start/pause · Enter = play again · R = restart · M = mute
  - 📱 Touch: swipe anywhere on the board, plus an on-screen D-pad on mobile
- **Auto-pause** when the tab is hidden or the window loses focus
- **Sound effects** via a tiny WebAudio synth (no assets) — fully mutable

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Type-check
npm run typecheck

# Build for production
npm run build
```

## 🎮 How to Play

Steer the snake, eat apples to grow and score points. Speed increases with every apple — hit a wall or your own tail and it's game over. Pick a pace before you start; harder paces multiply every point earned.

## 🧩 Project Structure

```
src/
├── App.tsx                  # Layout, HUD, difficulty & score persistence
├── game/
│   ├── engine.ts            # Core game engine (loop, physics, rendering)
│   ├── SnakeGame.tsx        # React wrapper: input, overlays, HUD callbacks
│   └── audio.ts             # WebAudio synth for SFX
└── components/
    └── ui.tsx               # Panels, buttons, D-pad, icons (inline SVG)
```

## License

MIT
