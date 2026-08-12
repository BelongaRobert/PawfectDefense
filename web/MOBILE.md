# Pawfect Shelter — Mobile App

Same game as the web prototype, packaged for phones in two layers:

| Layer | What it is | When to use |
|-------|------------|-------------|
| **PWA** | Safari → Share → Add to Home Screen | Play like an app today, no Mac/Xcode |
| **Capacitor** | Native iOS / Android shell around `web/` | TestFlight / App Store / Play Store |

Mechanics stay in TypeScript under `web/src/game/` — tweak once, ship everywhere.

## Quick: Home Screen app (iPhone)

1. Open the live site / tunnel in **Safari** (not Chrome).
2. Tap Share → **Add to Home Screen**.
3. Launch from the icon (standalone, portrait).

## Native app (Capacitor)

Requires a Mac with Xcode for iOS builds. Android Studio works on Mac/Windows/Linux.

```bash
cd web
npm install
npm run build:app          # vite build + cap sync
npm run open:ios           # opens Xcode (Mac only)
npm run open:android       # opens Android Studio
```

First-time platform add (already done in repo when present):

```bash
npx cap add ios
npx cap add android
```

### Suggested iOS flow
1. `npm run build:app && npm run open:ios`
2. Select your Team / signing in Xcode
3. Run on a connected iPhone or Simulator
4. Later: Archive → TestFlight

### Live reload while designing mechanics
Point the native shell at your Vite server (same Wi‑Fi):

```ts
// capacitor.config.ts — temporary for local device testing
server: { url: 'http://YOUR_LAN_IP:5173', cleartext: true }
```

Then `npm run dev` + `npx cap sync` / reload app.

## Tweaking mechanics

Edit files in `web/src/game/` (`game.ts`, `match.ts`, `generators.ts`, `content.ts`), then:

- Web / PWA: refresh (or rebuild Pages)
- Native: `npm run build:app` and re-run from Xcode / Android Studio
