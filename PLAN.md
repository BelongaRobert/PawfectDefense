# Pawfect Shelter

A combat deckbuilder in the kennel. Pack Lead climbs three acts. Fights are turn-based: health, energy, block, draw and discard piles, and an enemy intent you can read before it lands.

The playable game is **`web/`**. Unity files under `Assets/` are the old prototype and are not wired up.

## Combat

Pack Lead starts at 72 HP, 3 energy, draw 5. Max energy and the turn-1 draw can change from relics and unlocks.

- Turn start clears your block (unless Bed Down is in play), refills energy, then draws. Poison on you ticks here, ignores block, then drops by 1.
- Cards spend energy. End turn discards the hand and ticks your Weak and Vulnerable down by 1.
- Each living enemy then performs the intent you already saw, and chooses the next one.
- Block lasts through the enemy turn. It does not stack into your next turn unless Bed Down is up.
- Damage per hit is `floor((base + Strength) * weak * vulnerable)`. Weak is 0.75. Vulnerable is 1.5. Strength applies to every hit of a multi-hit. Block gained is `base + Dexterity`.
- Powers and Strength and Dexterity last the combat. Exhaust removes a card until the combat ends.
- Curses are unplayable and sit in hand until the turn ends.
- One enemy is the automatic target. Two or more: tap the card, then the enemy. Area cards skip targeting.
- The attack number on an intent is the damage that will land, including Strength, Weak, and your Vulnerable, before your block.
- Win the fight when every enemy hits 0. Lose the run at 0 HP.

## Pack Lead

Starter relic **Warm Kennel**: heal 6 after each combat you win. Starter deck: 5 Nip (6, upgrade 9), 4 Brace (5 block, upgrade 8), 1 Bark (8 damage and 2 Vulnerable, upgrade 10 and 3).

Drafts push the deck toward one of three lines. Cards can splash.

**Strength / multi-hit.** Pack Leader, Bouncy Corgi, Howl, Rally the Kennel, Alpha Lunge.

**Block.** Guard Dog, Shepherd, Play Bow, Night Watch, Bed Down. Bed Down is the rare that stops block from expiring, and a deck can hold one.

**Vulnerable.** Herding Nudge, Clicker, Fence Run, Double Walk.

**Utility.** Fetch, Shake, Treat. Flea is a curse with no play.

Upgrades change the printed number or the cost. Commons are the role-players, uncommons the enablers, rares the build keys. Later level unlocks add Flutter (a bird multi-hit) and Ferret Bite (poison) to the same reward pool. Cat and reptile leads are future characters, not this pass.

## Enemies

Intents are cycles, so a turn has a right answer.

Act 1 hallways are a Raccoon, a Stray, two Kits, or a Goose. Elites are the Control Van and the Coyote. The boss is The Warden (125 HP). At 60 HP the Warden gains 3 Strength and switches pattern.

Act 2 raises the same roles and adds an Officer pair and a Flea Swarm. The elite is the Pound Truck. The boss is Night Coyote, who gains Strength on a cycle and howls Weak at half health.

Act 3 hallways are the Act 2 elites. The elite is the Warden's Squad. The final boss is the City Pound (200 HP). At 100 HP it calls a backup van and attacks twice.

## The map

Three acts. Each act is 7 rows, up to 3 rooms wide, paths only to the same column or a neighbor, then one boss row.

- Row 1 is always a normal fight.
- Elites only on rows 4–6.
- A rest never links directly to another rest.
- Each act has at least one shop, one rest, and one elite.

Hallway rewards are 3 cards (skip allowed) and 10–20 gold. Elites grant a relic, a card, and 25–35 gold. Bosses offer 3 relics and heal 30% of max HP.

Rest is one choice: heal 30% of max HP, or upgrade one card. The shop sells 5 cards (50 / 75 / 150 by rarity), a remove for 75 gold, 2 relics, and a potion if the slot is empty. You hold one potion: Block 12, deal 12, 2 Strength this combat, or heal 10.

Starting gold is 99.

Relics are simple triggers: Warm Kennel, Treat Bowl, Old Collar, Whistle, Collar Bell, Pantry, Leash, Spare Leash, Carrier, Clicker Charm, Blanket, and the boss relic Warden's Badge.

Events are trades: Donation jar, Training yard, Fence stray, Sleepover, Storm, Treat pile.

## Code

Combat state is data, separate from the DOM, so a fight can be stepped without the page.

- `web/src/game/combat.ts` — piles, energy, block, the damage formula, powers, exhaust, potions
- `web/src/game/cards.ts` — the card list. Every printed line resolves
- `web/src/game/encounters.ts` — enemies and act tables
- `web/src/game/map.ts` — act generation
- `web/src/game/relics.ts` — relic defs
- `web/src/game/game.ts` — the run: map, reward, shop, rest, event, boss relic, defeat, victory

Save version is 2. An in-progress shelter-sim run cannot continue. Profile, XP, and unlocks stay. `web/scripts/combat-check.ts` walks the formula, Bed Down, Flea, and the map rules.

## How to run

```bash
cd web
npm install
npm run dev
```
