# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A browser-based Winamp 2.x-style music player. Pure HTML/CSS/JS — no build step, no bundler, no npm. Open `index.html` directly in any modern browser.

## Running

Open `index.html` in a browser. For local file playback, any browser works. For streams/CORS scenarios, run a local server:

```bash
python -m http.server 8080
# or
npx serve .
```

## Architecture

Four JS modules loaded in order via `<script>` tags (no ES modules):

| File | Class | Responsibility |
|------|-------|----------------|
| `js/visualizer.js` | `Visualizer` | Canvas spectrum analyzer using Web Audio `AnalyserNode`. Peak-decay bars drawn per `requestAnimationFrame`. |
| `js/playlist.js` | `Track`, `Playlist` | Track data model + ordered list with shuffle (Fisher-Yates), repeat modes, M3U parse/export. |
| `js/player.js` | `Player` | Wraps `<audio id="audio-el">` + Web Audio API graph. Lazy-init `AudioContext` on first `play()` to satisfy browser autoplay policy. |
| `js/app.js` | (IIFE) | Wires everything: event listeners, UI sync, drag-and-drop, keyboard shortcuts, window dragging. |

### Web Audio graph

```
MediaElementSource → AnalyserNode → GainNode → StereoPannerNode → destination
```

Initialized lazily in `Player._ensureAudioCtx()`. If CORS blocks `createMediaElementSource`, the error is caught and audio plays natively without visualizer data.

### Communication pattern

`Player` and `Playlist` expose callback properties (`onTrackChange`, `onChange`, `onEnded`, etc.) that `app.js` assigns. No event bus or custom events.

### File loading flow

1. File input / drag-drop → `handleFiles()` in `app.js`
2. Audio files → `URL.createObjectURL()` → `Track` with `type: 'file'`
3. `.m3u` / `.pls` → `Playlist.parseM3U()` → array of `Track` with `type: 'url'`
4. URL dialog → direct HTTP URLs → `Track` with `type: 'url'`
5. `playlist.add(tracks)` fires `onChange` → `renderPlaylist()`
6. `playlist.jumpTo(idx)` fires `onTrackChange` → `loadAndPlay()` in `app.js`

### Stream vs file distinction

`Track.isStream` (`type === 'url'`) disables the seekbar and shows "LIVE" in the kbps field. The `Player` sets `audio.crossOrigin = 'anonymous'` for streams.

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| Space | Play / Pause |
| S | Stop |
| Z / B | Prev / Next |
| Alt+← / Alt+→ | Prev / Next track |
| ← / → | Seek −5s / +5s |
| ↑ / ↓ | Volume +5 / −5 |
| R | Cycle repeat (none → all → one) |
| Shift+Z | Toggle shuffle |
| L | Open URL/stream dialog |
