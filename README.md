# Pawfect Shelter

A portrait deckbuilder about a kennel. Fights use health, energy, block, and a telegraphed enemy intent. Pick Pack Lead (Strength, Block, Vulnerable) or Barn Cat (Poison) and draft across three acts.

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
Both leads start with 3 energy and a draw of 5. Pack Lead has 72 HP. Barn Cat has 58. Block stops damage and lasts through the enemy turn. Weak is 0.75 and Vulnerable is 1.5, applied per hit and floored. Poison ignores block, then drops by 1. Enemies show the attack, including their Strength, before they take it.

Pack Lead's starter deck is 5 Nip, 4 Brace, and 1 Bark. Barn Cat's is 5 Scratch, 4 Perch, and 1 Pounce. Both start with Warm Kennel, which heals 6 after a win. Each lead drafts only their own cards, plus a few shared unlocks.

Win the City Pound at the end of act 3. At 0 HP the run is over.

### Map
Each act starts by topping you up to at least 75% HP, then The Offer: one good deal, one bad deal, and one amazing deal. Look at the map, take one, then path. The map is seven rows plus a boss. Row 1 is a fight. Elites show up on the middle rows. A rest never sits on top of another rest. Hallway fights offer a card and gold. Elites add a relic. Bosses offer one of three relics and heal 30% of max HP before the next act's offer.

### Saves
**Guests** play in this tab only. Refresh and the visit is gone.

**Accounts** (username + password, no email) keep XP, levels, unlocks, and Continue on this device. Copy a backup code to move the save. An older shelter-sim save does not continue; the profile does.

## Docs
See [PLAN.md](./PLAN.md) for the combat rules, card list, and acts.
