# Pawfect Shelter

Roguelike pet-adoption shelter sim. Take in animals, manage kennels/supplies/staff energy, and match pets to the right adopters.

**Play:** [https://belongarobert.github.io/PawfectDefense/](https://belongarobert.github.io/PawfectDefense/)

> GitHub Pages must publish the **`/docs` folder** on `main` (Settings → Pages → Deploy from a branch → `main` / `/docs`). That folder is only the source; it does not appear in the URL. Do not pick `/ (root)` — that is what put `/docs/` on the end of the address.

> The old Unity combat deck-builder remains under `Assets/` as legacy. The playable game is in `web/` (source) and `docs/` (GitHub Pages build).

## Play

```bash
cd web
npm install
npm run dev
```

### On iPhone — app-style (no install store needed)
1. Open the game in **Safari**
2. Share → **Add to Home Screen**
3. Launch from your home screen icon

See [`web/MOBILE.md`](./web/MOBILE.md) for **Capacitor / TestFlight / App Store** setup (same codebase).

### Goal
Survive **10 days** with **≥ 6 adoptions** and **≥ 40 reputation**.

Pocket pets (**chameleons, hamsters, ferrets**) share a habitat: **4 of the same species = 1 kennel**. A bonded group of 3–4 arriving together counts as that one kennel, not four dog-sized spots.

### Saves
**Guests** can play in this browser tab only. Refresh or close the game and that visit is gone — no Continue, no XP.

**Accounts** (username + password, no email) keep XP, levels, unlocks, and Continue on this device. Copy a restore code to move the save to another phone. Forgotten passwords cannot be reset.

### Day flow
1. **Intake** — accept or turn away arrivals  
2. **Care** — feed / play / train / treat (spend energy & supplies)  
3. **Adoption** — match pets to visitors  
4. **Events & relics** — procedural pressure and upgrades  

## Docs
See [PLAN.md](./PLAN.md) for full design.
