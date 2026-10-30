/**
 * Headless checks for the combat formula, powers, and map rules.
 * Run from web/: npx tsx scripts/combat-check.ts
 */
import { currentIntent, endTurn, intentView, playCard, scaledDamage, startCombat, applyPoisonTick } from '../src/game/combat';
import { generateAct, mapProblems } from '../src/game/map';
import { nextRand } from '../src/game/rng';
import type { CardInstance, CombatState } from '../src/game/types';

let failed = 0;

function assert(cond: unknown, message: string): void {
  if (!cond) {
    failed += 1;
    console.error('FAIL', message);
  }
}

function card(uid: string, defId: string): CardInstance {
  return { uid, defId, upgraded: false };
}

function rngFrom(seed: number): () => number {
  const box = { rng: seed || 1 };
  return () => nextRand(box);
}

function fight(deck: CardInstance[], relics: string[] = [], encounter = 'raccoon'): CombatState {
  return startCombat({
    encounterId: encounter,
    hp: 72,
    maxHp: 72,
    deck,
    relics,
    bonusTurnEnergy: 0,
    combatHeal: 0,
    rng: rngFrom(3),
  });
}

function forceHand(combat: CombatState, uids: string[]): void {
  const all = [...combat.hand, ...combat.draw, ...combat.discard, ...combat.exhaustPile];
  combat.hand = [];
  combat.draw = [];
  combat.discard = [];
  combat.exhaustPile = [];
  for (const uid of uids) {
    const index = all.findIndex((c) => c.uid === uid);
    if (index < 0) throw new Error(`missing ${uid}`);
    const [found] = all.splice(index, 1);
    if (found) combat.hand.push(found);
  }
  combat.draw = all;
  combat.player.energy = combat.player.maxEnergy;
}

const quiet = () => 0.2;

// Both hits of Bouncy Corgi pick up Pack Leader's Strength.
{
  const combat = fight([card('lead', 'pack_leader'), card('corgi', 'bouncy_corgi')]);
  forceHand(combat, ['lead', 'corgi']);
  playCard(combat, 'lead', quiet);
  playCard(combat, 'corgi', quiet);
  assert(combat.player.strength === 2, `strength ${combat.player.strength}`);
  assert(combat.enemies[0]?.hp === 14, `corgi hp ${combat.enemies[0]?.hp} (want 14)`);
}

// Fence Run reads Vulnerable at hit time. Clicker Charm applies after that hit.
{
  const combat = fight([card('fence', 'fence_run')], ['clicker_charm']);
  forceHand(combat, ['fence']);
  playCard(combat, 'fence', quiet);
  assert(combat.enemies[0]?.hp === 20, `fence plain hp ${combat.enemies[0]?.hp}`);
  assert(combat.enemies[0]?.vulnerable === 1, 'charm applied after the hit');
  forceHand(combat, ['fence']);
  playCard(combat, 'fence', quiet);
  assert(combat.enemies[0]?.hp === 2, `fence vuln hp ${combat.enemies[0]?.hp} (want 2)`);
}

// Weak is 0.75, floored.
{
  assert(scaledDamage(6, { strength: 0, weak: 1 }, { vulnerable: 0 }) === 4, 'weak nip');
  assert(scaledDamage(6, { strength: 0, weak: 0 }, { vulnerable: 1 }) === 9, 'vuln nip');
}

// Leash is one extra hit per Attack card, not per hit of a multi-hit.
{
  const combat = fight([card('corgi', 'bouncy_corgi')], ['leash']);
  forceHand(combat, ['corgi']);
  playCard(combat, 'corgi', quiet);
  assert(combat.enemies[0]?.hp === 17, `leash corgi hp ${combat.enemies[0]?.hp} (want 17)`);
}

// Flea is unplayable.
{
  const combat = fight([card('flea', 'flea'), card('nip', 'nip')]);
  forceHand(combat, ['flea', 'nip']);
  playCard(combat, 'flea', quiet);
  assert(combat.player.energy === 3, 'flea spent energy');
  assert(combat.hand.some((c) => c.defId === 'flea'), 'flea left the hand');
}

// Bed Down keeps leftover block through the next turn start.
{
  const kept = fight([card('bed', 'bed_down')]);
  forceHand(kept, ['bed']);
  kept.player.energy = 3;
  playCard(kept, 'bed', quiet);
  kept.player.block = 10;
  endTurn(kept, quiet);
  assert(kept.player.block === 2, `retain block ${kept.player.block}`);

  const dropped = fight([card('nip', 'nip')]);
  dropped.player.block = 10;
  endTurn(dropped, quiet);
  assert(dropped.player.block === 0, `expired block ${dropped.player.block}`);
}

// Carrier returns the first Exhaust to hand at cost 0.
{
  const combat = fight([card('bow', 'play_bow')], ['carrier']);
  forceHand(combat, ['bow']);
  playCard(combat, 'bow', quiet);
  const back = combat.hand.find((c) => c.defId === 'play_bow');
  assert(!!back && back.costOverride === 0, 'carrier return');
  assert(combat.exhaustPile.length === 0, 'carrier should not exhaust the first card');
}

// Poison ignores block.
{
  const body = {
    hp: 20,
    maxHp: 20,
    block: 8,
    strength: 0,
    dexterity: 0,
    weak: 0,
    vulnerable: 0,
    poison: 5,
  };
  const dealt = applyPoisonTick(body);
  assert(dealt === 5 && body.hp === 15 && body.block === 8 && body.poison === 4, 'poison vs block');
}

// Clicker Charm: first Nip is unboosted, the second sees Vulnerable.
{
  const combat = fight([card('a', 'nip'), card('b', 'nip')], ['clicker_charm']);
  forceHand(combat, ['a', 'b']);
  playCard(combat, 'a', quiet);
  assert(combat.enemies[0]?.hp === 20, `first nip ${combat.enemies[0]?.hp}`);
  playCard(combat, 'b', quiet);
  assert(combat.enemies[0]?.hp === 11, `second nip ${combat.enemies[0]?.hp}`);
}

// Warden crosses 60 during the player turn and shows the new hit, including Strength.
{
  const combat = fight([card('nip', 'nip')], [], 'warden');
  const warden = combat.enemies[0]!;
  warden.hp = 61;
  forceHand(combat, ['nip']);
  playCard(combat, 'nip', quiet);
  assert(warden.hp === 55, `warden hp ${warden.hp}`);
  assert(warden.strength === 3 && warden.form === 1, 'warden phase');
  const intent = currentIntent(warden);
  assert(intent.kind === 'attack' && intent.amount === 18, 'warden new pattern');
  assert(intentView(warden, combat.player).value === '21', `shown ${intentView(warden, combat.player).value}`);
}

// City Pound summons on the way through 100, and a killing blow does not.
{
  const combat = fight([card('nip', 'nip')], [], 'pound');
  const pound = combat.enemies[0]!;
  pound.hp = 101;
  forceHand(combat, ['nip']);
  playCard(combat, 'nip', quiet);
  assert(combat.enemies.some((e) => e.defId === 'pound_van'), 'pound summon');
  assert(pound.form === 1, 'pound form');
  assert(intentView(pound, combat.player).value === '16×2', `pound intent ${intentView(pound, combat.player).value}`);

  const dead = fight([card('nip', 'nip')], [], 'pound');
  dead.enemies[0]!.hp = 6;
  forceHand(dead, ['nip']);
  playCard(dead, 'nip', quiet);
  assert(dead.victory && dead.enemies.length === 1, 'killing blow skips the add');
}

{
  const box = { rng: 99 };
  const roll = () => nextRand(box);
  for (let act = 1; act <= 3; act++) {
    for (let i = 0; i < 40; i++) {
      const problems = mapProblems(generateAct(act, roll));
      assert(problems.length === 0, `act ${act} seed ${i}: ${problems.join(',')}`);
    }
  }
}

if (failed) {
  console.error(`${failed} checks failed`);
  process.exit(1);
}
console.log('combat checks passed');
