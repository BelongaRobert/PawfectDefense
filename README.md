# Pawfect Shelter

Roguelike pet-adoption shelter sim. Take in animals, manage kennels/supplies/staff energy, and match pets to the right adopters.

**Play:** [https://belongarobert.github.io/PawfectDefense/docs/](https://belongarobert.github.io/PawfectDefense/docs/)

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
XP, levels, and unlocks are stored in the browser on this device. Optional **username + password** (no email) encrypts a backup you can paste on another phone as a restore code. Forgotten passwords cannot be reset.

### Day flow
1. **Intake** — accept or turn away arrivals  
2. **Care** — feed / play / train / treat (spend energy & supplies)  
3. **Adoption** — match pets to visitors  
4. **Events & relics** — procedural pressure and upgrades  

## Docs
See [PLAN.md](./PLAN.md) for full design.
