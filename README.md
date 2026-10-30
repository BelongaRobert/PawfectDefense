# Pawfect Shelter

A portrait deckbuilder about a kennel lead. Fights use health, energy, block, and a telegraphed enemy intent. One character, Pack Lead, drafts toward Strength, Block, or Vulnerable across three acts.

**Play:** [https://belongarobert.github.io/PawfectDefense/](https://belongarobert.github.io/PawfectDefense/)

> GitHub Pages must publish the **`/docs` folder** on `main` (Settings → Pages → Deploy from a branch → `main` / `/docs`). That folder is the built site; it does not appear in the URL. Do not pick `/ (root)`.

> The old Unity card list remains under `Assets/` as legacy. The playable game is `web/` (source) and `docs/` (GitHub Pages build).

## Play

```bash
cd web
npm install
npm run dev
```

### On iPhone
1. Open the game in **Safari**
2. Share → **Add to Home Screen**
3. Launch from the icon

See [`web/MOBILE.md`](./web/MOBILE.md) for Capacitor / TestFlight.

### A fight
Pack Lead starts at 72 HP, 3 energy, and a draw of 5. Block stops damage and lasts through the enemy turn. Weak is 0.75 and Vulnerable is 1.5, applied per hit and floored. Enemies show the attack, including their Strength, before they take it.

The starter deck is 5 Nip, 4 Brace, and 1 Bark. The starter relic Warm Kennel heals 6 after a win. You draft the rest of the deck from rewards, the shop, and events.

Win the City Pound at the end of act 3. At 0 HP the run is over.

### Map
Each act is seven rows plus a boss. Row 1 is a fight. Elites show up on the middle rows. A rest never sits on top of another rest. Hallway fights offer a card and gold. Elites add a relic. Bosses offer one of three relics and heal 30% of max HP.

### Saves
**Guests** play in this tab only. Refresh and the visit is gone.

**Accounts** (username + password, no email) keep XP, levels, unlocks, and Continue on this device. Copy a backup code to move the save. An older shelter-sim save does not continue; the profile does.

## Docs
See [PLAN.md](./PLAN.md) for the combat rules, card list, and acts.
