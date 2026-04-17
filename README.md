# ChordStrut

A guitar and piano chord reference, smart-voicing engine, and practice web app.

## Features

- **Chord browser** — guitar chord diagrams with multiple voicings
- **Smart Voicing Engine** — given a progression, picks voicings that minimize hand movement
- **Piano chords** — piano chord diagrams
- **Song sheets** — chord sheets for practice
- **Tab editor** — write and view guitar tabs
- **Progression builder** — build and analyze chord progressions
- **Quiz** — test your chord recognition
- **Scales** — fretboard scale visualizer
- Audio playback, custom chords, favorites, left-handed mode, and light/dark themes

## Tech stack

Vite + React 18 + TypeScript + Tailwind CSS + shadcn-ui.

## Development

```bash
npm install
npm run dev          # start dev server
npm run build        # production build
npm run preview      # preview the production build
npm run lint         # ESLint
npm run test         # run tests (Vitest)
```

## Project structure

See `CLAUDE.md` for an overview of the routing, data layer, engine, audio, and persistence.
