import { cardCost, cardEffects, getCard } from './cards';
import { enemyPattern, getEncounter, getEnemy, type Intent } from './encounters';
import { shuffle } from './rng';
import type {
  CardInstance,
  CombatState,
  EnemyState,
  LogLine,
  PotionId,
  StatusBody,
} from './types';

const HAND_LIMIT = 10;

export function scaledDamage(
  base: number,
  attacker: { strength: number; weak: number },
  defender: { vulnerable: number },
): number {
  const raw = base + attacker.strength;
  const weak = attacker.weak > 0 ? 0.75 : 1;
  const vuln = defender.vulnerable > 0 ? 1.5 : 1;
  return Math.max(0, Math.floor(raw * weak * vuln));
}

export function gainBlock(fighter: StatusBody, base: number): number {
  const amount = Math.max(0, base + fighter.dexterity);
  fighter.block += amount;
  return amount;
}

/** Poison ignores Block, then drops by 1. */
export function applyPoisonTick(fighter: StatusBody): number {
  if (fighter.poison <= 0) return 0;
  const dmg = fighter.poison;
  fighter.hp -= dmg;
  fighter.poison -= 1;
  return dmg;
}

function heal(fighter: StatusBody, amount: number): number {
  const before = fighter.hp;
  fighter.hp = Math.min(fighter.maxHp, fighter.hp + Math.max(0, amount));
  return fighter.hp - before;
}

function log(combat: CombatState, text: string, tone: LogLine['tone'] = 'neutral'): void {
  combat.log.unshift({ text, tone });
  if (combat.log.length > 16) combat.log.pop();
}

function living(combat: CombatState): EnemyState[] {
  return combat.enemies.filter((e) => e.hp > 0);
}

export function currentIntent(enemy: EnemyState): Intent {
  const pattern = enemyPattern(getEnemy(enemy.defId), enemy.form);
  return pattern[enemy.intentIndex % pattern.length]!;
}

export function intentView(enemy: EnemyState, player: StatusBody): { label: string; value: string; tone: 'bad' | 'good' | 'neutral' } {
  const intent = currentIntent(enemy);
  if (intent.kind === 'attack') {
    const dmg = scaledDamage(intent.amount, enemy, player);
    const hits = intent.hits ?? 1;
    return { label: 'Attack', value: hits > 1 ? `${dmg}×${hits}` : `${dmg}`, tone: 'bad' };
  }
  if (intent.kind === 'block') return { label: 'Block', value: `${intent.amount}`, tone: 'good' };
  if (intent.kind === 'weak') return { label: 'Weak', value: `${intent.amount}`, tone: 'neutral' };
  if (intent.kind === 'vulnerable') return { label: 'Vulnerable', value: `${intent.amount}`, tone: 'neutral' };
  if (intent.kind === 'strength') return { label: 'Strength', value: `+${intent.amount}`, tone: 'bad' };
  return { label: 'Poison', value: `${intent.amount}`, tone: 'bad' };
}

function checkEnd(combat: CombatState): boolean {
  if (combat.over) return true;
  if (combat.player.hp <= 0) {
    combat.player.hp = 0;
    combat.over = true;
    combat.victory = false;
    combat.pending = null;
    log(combat, 'You fall.', 'bad');
    return true;
  }
  if (combat.enemies.every((e) => e.hp <= 0)) {
    combat.over = true;
    combat.victory = true;
    combat.pending = null;
    log(combat, 'The yard is clear.', 'good');
    return true;
  }
  return false;
}

function spawn(combat: CombatState, defId: string, name?: string): void {
  const def = getEnemy(defId);
  combat.seq += 1;
  combat.enemies.push({
    uid: `e${combat.seq}`,
    defId,
    name: name ?? def.name,
    emoji: def.emoji,
    hp: def.hp,
    maxHp: def.hp,
    block: 0,
    strength: 0,
    dexterity: 0,
    weak: 0,
    vulnerable: 0,
    poison: 0,
    form: 0,
    intentIndex: 0,
    phaseTriggered: false,
    pendingForm: false,
  });
}

function maybePhase(combat: CombatState, enemy: EnemyState): void {
  const phase = getEnemy(enemy.defId).phase;
  if (!phase || enemy.phaseTriggered || enemy.hp <= 0 || enemy.hp > phase.atHp) return;
  enemy.phaseTriggered = true;
  if (phase.gainStrength) {
    enemy.strength += phase.gainStrength;
    log(combat, `${enemy.name} gains ${phase.gainStrength} Strength.`, 'bad');
  }
  if (phase.applyWeak) {
    combat.player.weak += phase.applyWeak;
    log(combat, `${enemy.name} howls. You are Weak (${combat.player.weak}).`, 'bad');
  }
  if (phase.summon) {
    spawn(combat, phase.summon);
    log(combat, `${enemy.name} calls backup.`, 'bad');
  }
  if (phase.pattern) {
    if (combat.inEnemyTurn) enemy.pendingForm = true;
    else {
      enemy.form = 1;
      enemy.intentIndex = 0;
    }
    log(combat, `${enemy.name} changes tack.`, 'bad');
  }
}

function hitEnemy(
  combat: CombatState,
  enemy: EnemyState,
  base: number,
  attacker: { strength: number; weak: number } = combat.player,
): void {
  if (enemy.hp <= 0) return;
  const amount = scaledDamage(base, attacker, enemy);
  const blocked = Math.min(enemy.block, amount);
  enemy.block -= blocked;
  const hpLoss = amount - blocked;
  enemy.hp -= hpLoss;
  const blockedNote = blocked ? ` (${blocked} blocked)` : '';
  log(combat, `${enemy.name} takes ${hpLoss}${blockedNote}.`, hpLoss > 0 ? 'good' : 'neutral');
  if (enemy.hp <= 0) {
    enemy.hp = 0;
    log(combat, `${enemy.name} is down.`, 'good');
    return;
  }
  maybePhase(combat, enemy);
}

function applyVulnerable(combat: CombatState, enemy: EnemyState, amount: number): void {
  if (enemy.hp <= 0 || amount <= 0) return;
  enemy.vulnerable += amount;
  log(combat, `${enemy.name} is Vulnerable (${enemy.vulnerable}).`, 'good');
  if (combat.relics.includes('collar_bell')) {
    hitEnemy(combat, enemy, 4, { strength: 0, weak: combat.player.weak });
  }
}

function hurtPlayer(combat: CombatState, amount: number, source: string): void {
  const blocked = Math.min(combat.player.block, amount);
  combat.player.block -= blocked;
  const hpLoss = amount - blocked;
  combat.player.hp -= hpLoss;
  const via = blocked ? ` Blocked ${blocked}.` : '';
  const taken = hpLoss > 0 ? ` You take ${hpLoss}.` : ' Fully blocked.';
  log(combat, `${source} hits for ${amount}.${via}${taken}`, hpLoss > 0 ? 'bad' : 'good');
  if (combat.player.hp <= 0) checkEnd(combat);
}

function drawCards(combat: CombatState, count: number, rng: () => number): void {
  for (let i = 0; i < count; i++) {
    if (combat.hand.length >= HAND_LIMIT) break;
    if (combat.draw.length === 0) {
      if (combat.discard.length === 0) break;
      combat.draw = shuffle(combat.discard, rng);
      combat.discard = [];
      log(combat, 'Shuffle the discard into the draw.');
    }
    const next = combat.draw.pop();
    if (next) combat.hand.push(next);
  }
}

function exhaustCard(combat: CombatState, card: CardInstance): void {
  if (!combat.carrierUsed && combat.relics.includes('carrier')) {
    combat.carrierUsed = true;
    card.costOverride = 0;
    combat.hand.push(card);
    log(combat, `${nameOf(card)} returns to your hand and costs 0.`, 'good');
    return;
  }
  combat.exhaustPile.push(card);
}

function nameOf(card: CardInstance): string {
  return getCard(card.defId)?.name ?? 'Card';
}

function onSkill(combat: CombatState): void {
  if (combat.powers.blockOnSkill > 0) {
    const gained = gainBlock(combat.player, combat.powers.blockOnSkill);
    log(combat, `Night Watch grants ${gained} Block.`, 'good');
  }
  if (combat.relics.includes('pantry')) {
    const gained = heal(combat.player, 1);
    if (gained > 0) log(combat, 'Pantry heals 1.', 'good');
  }
}

function applyEffect(
  combat: CombatState,
  card: CardInstance,
  effect: ReturnType<typeof cardEffects>[number],
  target: EnemyState | null,
  rng: () => number,
): 'pause' | 'ok' {
  switch (effect.op) {
    case 'damage':
      if (target) hitEnemy(combat, target, effect.amount);
      return 'ok';
    case 'damageAll':
      for (const enemy of living(combat)) hitEnemy(combat, enemy, effect.amount);
      return 'ok';
    case 'hits':
      if (!target) return 'ok';
      for (let i = 0; i < effect.times; i++) {
        if (target.hp <= 0 || combat.over) break;
        hitEnemy(combat, target, effect.amount);
      }
      return 'ok';
    case 'block': {
      const gained = gainBlock(combat.player, effect.amount);
      log(combat, `You gain ${gained} Block.`, 'good');
      return 'ok';
    }
    case 'draw':
      drawCards(combat, effect.amount, rng);
      return 'ok';
    case 'strength':
      combat.player.strength += effect.amount;
      log(combat, `You gain ${effect.amount} Strength.`, 'good');
      return 'ok';
    case 'vulnerable':
      if (target) applyVulnerable(combat, target, effect.amount);
      else for (const enemy of living(combat)) applyVulnerable(combat, enemy, effect.amount);
      return 'ok';
    case 'poison':
      if (target && target.hp > 0) {
        target.poison += effect.amount;
        log(combat, `${target.name} is Poisoned (${target.poison}).`, 'good');
      }
      return 'ok';
    case 'heal': {
      const gained = heal(combat.player, effect.amount);
      log(combat, gained > 0 ? `Heal ${gained}.` : 'Already full.', 'good');
      return 'ok';
    }
    case 'doubleNextAttack':
      combat.doubleNextAttack = true;
      log(combat, 'Your next Attack plays twice.', 'good');
      return 'ok';
    case 'ifVulnerable':
      if (target) hitEnemy(combat, target, target.vulnerable > 0 ? effect.yes : effect.no);
      return 'ok';
    case 'powerBlockOnSkill':
      combat.powers.blockOnSkill += effect.amount;
      log(combat, 'Night Watch is set.', 'good');
      return 'ok';
    case 'powerRetainBlock':
      combat.powers.retainBlock = true;
      log(combat, 'Block will not expire.', 'good');
      return 'ok';
    case 'exhaustHand': {
      if (combat.hand.length === 0) {
        drawCards(combat, effect.draw, rng);
        exhaustCard(combat, card);
        return 'ok';
      }
      combat.pending = { type: 'exhaust', source: card, draw: effect.draw };
      return 'pause';
    }
    default:
      return 'ok';
  }
}

function finishAttackExtras(combat: CombatState, defTarget: 'enemy' | 'all' | 'self', target: EnemyState | null): void {
  const victims = defTarget === 'all' ? living(combat) : target && target.hp > 0 ? [target] : [];
  if (!combat.clickerUsed && combat.relics.includes('clicker_charm')) {
    combat.clickerUsed = true;
    for (const enemy of victims) applyVulnerable(combat, enemy, 1);
  }
  if (combat.relics.includes('leash')) {
    const still = defTarget === 'all' ? living(combat) : target && target.hp > 0 ? [target] : [];
    for (const enemy of still) {
      hitEnemy(combat, enemy, 1, { strength: 0, weak: combat.player.weak });
    }
  }
}

function resolvePlayed(combat: CombatState, card: CardInstance, target: EnemyState | null, rng: () => number): void {
  const def = getCard(card.defId);
  if (!def) return;
  if (def.type === 'skill') onSkill(combat);
  const effects = cardEffects(card);
  if (effects.some((e) => e.op === 'exhaustHand')) {
    for (const effect of effects) {
      if (effect.op === 'exhaustHand') {
        applyEffect(combat, card, effect, target, rng);
        return;
      }
    }
  }
  const times = def.type === 'attack' && combat.doubleNextAttack ? 2 : 1;
  if (def.type === 'attack') combat.doubleNextAttack = false;
  for (let n = 0; n < times; n++) {
    for (const effect of effects) {
      applyEffect(combat, card, effect, target, rng);
      if (combat.over) return;
    }
    if (target && target.hp <= 0 && def.target === 'enemy') break;
  }
  if (def.type === 'attack') finishAttackExtras(combat, def.target, target);
  if (combat.over) return;
  if (def.exhaust || def.type === 'power') exhaustCard(combat, card);
  else combat.discard.push(card);
  checkEnd(combat);
}

function targetFor(combat: CombatState, defTarget: 'enemy' | 'all' | 'self', targetId?: string): EnemyState | null {
  if (defTarget !== 'enemy') return null;
  const alive = living(combat);
  if (targetId) return alive.find((e) => e.uid === targetId) ?? null;
  if (alive.length === 1) return alive[0]!;
  return null;
}

export function cardPlayable(combat: CombatState, card: CardInstance): boolean {
  const def = getCard(card.defId);
  if (!def || def.type === 'curse' || combat.over) return false;
  if (combat.pending?.type === 'exhaust' || combat.pending?.type === 'potion') return false;
  if (combat.pending?.type === 'target') return combat.pending.cardUid === card.uid;
  return combat.player.energy >= cardCost(card);
}

export function playCard(combat: CombatState, uid: string, rng: () => number, targetId?: string): void {
  if (combat.over || combat.pending?.type === 'exhaust' || combat.pending?.type === 'potion') return;
  if (combat.pending?.type === 'target') {
    if (!targetId) {
      if (combat.pending.cardUid === uid) combat.pending = null;
      return;
    }
    uid = combat.pending.cardUid;
    combat.pending = null;
  }
  const index = combat.hand.findIndex((c) => c.uid === uid);
  if (index < 0) return;
  const card = combat.hand[index]!;
  const def = getCard(card.defId);
  if (!def || def.type === 'curse') return;
  const cost = cardCost(card);
  if (combat.player.energy < cost) return;
  if (def.target === 'enemy' && living(combat).length > 1 && !targetId) {
    combat.pending = { type: 'target', cardUid: uid };
    return;
  }
  const target = targetFor(combat, def.target, targetId);
  if (def.target === 'enemy' && !target) return;
  combat.player.energy -= cost;
  combat.hand.splice(index, 1);
  log(combat, `Play ${nameOf(card)}.`);
  resolvePlayed(combat, card, target, rng);
}

export function chooseExhaust(combat: CombatState, uid: string, rng: () => number): void {
  if (combat.pending?.type !== 'exhaust' || combat.over) return;
  const { source, draw } = combat.pending;
  const index = combat.hand.findIndex((c) => c.uid === uid);
  if (index < 0) return;
  combat.pending = null;
  const [card] = combat.hand.splice(index, 1);
  if (card) exhaustCard(combat, card);
  drawCards(combat, draw, rng);
  exhaustCard(combat, source);
  checkEnd(combat);
}

export function confirmTarget(combat: CombatState, enemyId: string, rng: () => number): void {
  if (combat.pending?.type === 'target') playCard(combat, combat.pending.cardUid, rng, enemyId);
}

function performIntent(combat: CombatState, enemy: EnemyState): void {
  if (enemy.hp <= 0 || combat.over) return;
  const intent = currentIntent(enemy);
  if (intent.kind === 'attack') {
    const hits = intent.hits ?? 1;
    for (let i = 0; i < hits; i++) {
      if (combat.player.hp <= 0) break;
      const dmg = scaledDamage(intent.amount, enemy, combat.player);
      hurtPlayer(combat, dmg, enemy.name);
    }
    return;
  }
  if (intent.kind === 'block') {
    enemy.block += intent.amount;
    log(combat, `${enemy.name} gains ${intent.amount} Block.`);
    return;
  }
  if (intent.kind === 'weak') {
    combat.player.weak += intent.amount;
    log(combat, `${enemy.name} applies ${intent.amount} Weak.`, 'bad');
    return;
  }
  if (intent.kind === 'vulnerable') {
    combat.player.vulnerable += intent.amount;
    log(combat, `${enemy.name} applies ${intent.amount} Vulnerable.`, 'bad');
    return;
  }
  if (intent.kind === 'strength') {
    enemy.strength += intent.amount;
    log(combat, `${enemy.name} gains ${intent.amount} Strength.`, 'bad');
    return;
  }
  combat.player.poison += intent.amount;
  log(combat, `${enemy.name} applies ${intent.amount} Poison.`, 'bad');
}

function advanceIntent(enemy: EnemyState): void {
  if (enemy.pendingForm) {
    enemy.form = 1;
    enemy.pendingForm = false;
    enemy.intentIndex = 0;
    return;
  }
  const pattern = enemyPattern(getEnemy(enemy.defId), enemy.form);
  enemy.intentIndex = (enemy.intentIndex + 1) % pattern.length;
}

function enemyTurn(combat: CombatState): void {
  combat.inEnemyTurn = true;
  for (let i = 0; i < combat.enemies.length; i++) {
    const enemy = combat.enemies[i]!;
    if (enemy.hp <= 0) continue;
    enemy.block = 0;
    const poisoned = applyPoisonTick(enemy);
    if (poisoned > 0) log(combat, `${enemy.name} takes ${poisoned} poison.`, 'good');
    if (enemy.hp <= 0) {
      enemy.hp = 0;
      log(combat, `${enemy.name} is down.`, 'good');
      if (checkEnd(combat)) {
        combat.inEnemyTurn = false;
        return;
      }
      continue;
    }
    maybePhase(combat, enemy);
    performIntent(combat, enemy);
    if (checkEnd(combat)) {
      combat.inEnemyTurn = false;
      return;
    }
    if (enemy.weak > 0) enemy.weak -= 1;
    if (enemy.vulnerable > 0) enemy.vulnerable -= 1;
    advanceIntent(enemy);
  }
  combat.inEnemyTurn = false;
}

function beginPlayerTurn(combat: CombatState, rng: () => number, first: boolean): void {
  combat.turn += 1;
  if (!first && !combat.powers.retainBlock) combat.player.block = 0;
  combat.player.energy = combat.player.maxEnergy;
  if (combat.relics.includes('warden_badge')) combat.player.energy += 1;
  if (combat.turn === 1 && combat.relics.includes('treat_bowl')) combat.player.energy += 1;
  if (combat.turn === 1) combat.player.energy += combat.bonusTurnEnergy;
  combat.clickerUsed = false;
  const poisoned = applyPoisonTick(combat.player);
  if (poisoned > 0) log(combat, `Poison deals ${poisoned}.`, 'bad');
  if (checkEnd(combat)) return;
  const extra = combat.turn === 1 && combat.relics.includes('spare_leash') ? 2 : 0;
  drawCards(combat, 5 + extra, rng);
  log(combat, `Turn ${combat.turn}.`);
}

export function endTurn(combat: CombatState, rng: () => number): void {
  if (combat.over || combat.pending) return;
  combat.discard.push(...combat.hand);
  combat.hand = [];
  if (combat.player.weak > 0) combat.player.weak -= 1;
  if (combat.player.vulnerable > 0) combat.player.vulnerable -= 1;
  combat.doubleNextAttack = false;
  enemyTurn(combat);
  if (!combat.over) beginPlayerTurn(combat, rng, false);
}

export function usePotion(combat: CombatState, potion: PotionId, targetId?: string): 'ok' | 'need-target' {
  if (combat.over || combat.pending) return 'need-target';
  if (potion === 'strike') {
    const alive = living(combat);
    if (alive.length === 0) return 'ok';
    if (alive.length > 1 && !targetId) {
      combat.pending = { type: 'potion' };
      return 'need-target';
    }
    const target = targetId ? alive.find((e) => e.uid === targetId) : alive[0];
    if (!target) return 'need-target';
    combat.pending = null;
    hitEnemy(combat, target, 12, { strength: 0, weak: combat.player.weak });
    log(combat, 'Strike potion.');
    checkEnd(combat);
    return 'ok';
  }
  if (potion === 'block') {
    const gained = gainBlock(combat.player, 12);
    log(combat, `Block potion grants ${gained} Block.`, 'good');
    return 'ok';
  }
  if (potion === 'strength') {
    combat.player.strength += 2;
    log(combat, 'Strength potion. +2 Strength.', 'good');
    return 'ok';
  }
  const gained = heal(combat.player, 10);
  log(combat, `Heal potion restores ${gained}.`, 'good');
  return 'ok';
}

export function drinkPendingPotion(combat: CombatState, enemyId: string): boolean {
  if (combat.pending?.type !== 'potion') return false;
  combat.pending = null;
  return usePotion(combat, 'strike', enemyId) === 'ok';
}

export function startCombat(opts: {
  encounterId: string;
  hp: number;
  maxHp: number;
  deck: readonly CardInstance[];
  relics: readonly string[];
  bonusTurnEnergy: number;
  combatHeal: number;
  rng: () => number;
}): CombatState {
  const encounter = getEncounter(opts.encounterId);
  const combat: CombatState = {
    player: {
      hp: opts.hp,
      maxHp: opts.maxHp,
      block: 0,
      energy: 0,
      maxEnergy: 3,
      strength: 0,
      dexterity: 0,
      weak: 0,
      vulnerable: 0,
      poison: 0,
    },
    hand: [],
    draw: [],
    discard: [],
    exhaustPile: [],
    enemies: [],
    relics: [...opts.relics],
    powers: { retainBlock: false, blockOnSkill: 0 },
    doubleNextAttack: false,
    carrierUsed: false,
    clickerUsed: false,
    bonusTurnEnergy: opts.bonusTurnEnergy,
    turn: 0,
    seq: 0,
    inEnemyTurn: false,
    pending: null,
    log: [],
    over: false,
    victory: false,
  };
  for (const slot of encounter.enemies) spawn(combat, slot.defId, slot.name);
  if (combat.relics.includes('blanket')) {
    combat.player.dexterity += 1;
    log(combat, 'Blanket grants 1 Dexterity.', 'good');
  }
  if (combat.relics.includes('whistle')) {
    combat.player.strength += 1;
    log(combat, 'Whistle grants 1 Strength.', 'good');
  }
  if (combat.relics.includes('old_collar')) {
    const gained = gainBlock(combat.player, 4);
    log(combat, `Old Collar grants ${gained} Block.`, 'good');
  }
  if (opts.combatHeal > 0) {
    const gained = heal(combat.player, opts.combatHeal);
    if (gained > 0) log(combat, `Morning delivery heals ${gained}.`, 'good');
  }
  const copies = opts.deck.map((c) => ({ uid: c.uid, defId: c.defId, upgraded: c.upgraded }));
  combat.draw = shuffle(copies, opts.rng);
  const names = combat.enemies.map((e) => e.name).join(' and ');
  log(combat, `${names} draws near.`, 'bad');
  beginPlayerTurn(combat, opts.rng, true);
  return combat;
}
