import { cardCost, cardName, getCard, rewardPool } from './cards';
import {
  cardPlayable,
  chooseExhaust,
  confirmTarget,
  drinkPendingPotion,
  endTurn,
  playCard,
  startCombat,
  usePotion,
} from './combat';
import { generateAct } from './map';
import { bossRelicPool, getRelic, shopRelicPool, type RelicDef } from './relics';
import { hasUnlock } from './progression';
import { nextRand, pick, shuffle } from './rng';
import {
  applyRunXp,
  clearLastReward,
  clearRun,
  defaultProfile,
  isLoggedIn,
  loadProfile,
  loadRun,
  recordSeasonEnd,
  recordSeasonStart,
  registerAccount,
  restoreAccount,
  saveProfile,
  saveRun,
  setProfileName,
  signInAccount,
  unlockAccountBackup,
  type UserProfile,
} from './save';
import {
  exportRestoreCode,
  getSessionPassword,
  getSessionUsername,
  listUsernames,
  logout,
} from './account';
import type { CardInstance, LogLine, PotionId, RunState } from './types';

type Listener = () => void;

const POTION_IDS: PotionId[] = ['block', 'strike', 'strength', 'heal'];

export const POTIONS: Record<PotionId, { name: string; text: string; emoji: string }> = {
  block: { name: 'Block Tonic', text: 'Gain 12 Block.', emoji: '🛡️' },
  strike: { name: 'Snap Bite', text: 'Deal 12 damage.', emoji: '🦷' },
  strength: { name: 'Bully Stick', text: 'Gain 2 Strength this combat.', emoji: '💪' },
  heal: { name: 'Broth', text: 'Heal 10 HP.', emoji: '🥣' },
};

function blankRun(): RunState {
  return {
    phase: 'title',
    seed: 1,
    rng: 1,
    act: 1,
    hp: 72,
    maxHp: 72,
    gold: 0,
    deck: [],
    relics: [],
    potion: null,
    map: { act: 1, nodes: [] },
    currentNodeId: null,
    cleared: [],
    reachable: [],
    combat: null,
    reward: null,
    shop: null,
    eventId: null,
    picker: null,
    relicChoices: [],
    combatSource: 'map',
    log: [],
    fightsWon: 0,
    elitesWon: 0,
    floors: 0,
    perks: { turnEnergy: 0, combatHeal: 0, cheapRemove: false, extraCards: [] },
    xpAwarded: 0,
    recorded: false,
    idCounter: 1,
  };
}

let state: RunState = blankRun();
let profile: UserProfile = loadProfile();
let saveFlash = '';
let accountNotice = '';
const listeners = new Set<Listener>();

export function getState(): RunState {
  return state;
}

export function getProfile(): UserProfile {
  return profile;
}

export function getSaveFlash(): string {
  return saveFlash;
}

export function getAccountNotice(): string {
  return accountNotice;
}

export function getSignedInUsername(): string | null {
  return getSessionUsername();
}

export { isLoggedIn };

export function hasBackupPassword(): boolean {
  return !!getSessionPassword();
}

export function deviceUsernames(): string[] {
  return listUsernames();
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(opts?: { persist?: boolean; flash?: string }): void {
  if (opts?.flash) saveFlash = opts.flash;
  if (state.combat && state.phase === 'combat') state.hp = Math.max(0, state.combat.player.hp);
  if (opts?.persist !== false && state.phase !== 'title' && isLoggedIn()) {
    if (state.phase === 'ended') clearRun();
    else {
      saveRun(state);
      if (!opts?.flash) saveFlash = 'Progress saved';
    }
  }
  for (const fn of listeners) fn();
}

function note(text: string, tone: LogLine['tone'] = 'neutral'): void {
  state.log.unshift({ text, tone });
  if (state.log.length > 14) state.log.pop();
}

function rng(): number {
  return nextRand(state);
}

function makeCard(defId: string): CardInstance {
  state.idCounter += 1;
  return { uid: `c${state.idCounter}`, defId, upgraded: false };
}

function currentNode() {
  return state.map.nodes.find((n) => n.id === state.currentNodeId) ?? null;
}

function healRun(amount: number): number {
  const before = state.hp;
  state.hp = Math.min(state.maxHp, state.hp + Math.max(0, amount));
  return state.hp - before;
}

function closeRun(won: boolean, reason: string): void {
  state.won = won;
  state.endReason = reason;
  state.phase = won ? 'victory' : 'ended';
  state.combat = null;
  state.picker = null;
  if (!state.recorded) {
    state.recorded = true;
    if (isLoggedIn()) {
      profile = recordSeasonEnd(profile, state);
      const applied = applyRunXp(profile, state);
      profile = applied.profile;
    }
  }
  emit({ flash: won ? 'Season won' : 'Run over' });
}

function lose(reason: string): void {
  state.hp = 0;
  closeRun(false, reason);
}

function hurt(amount: number, reason: string): boolean {
  state.hp -= amount;
  if (state.hp <= 0) {
    lose(reason);
    return true;
  }
  return false;
}

export function canUpgrade(card: CardInstance): boolean {
  if (card.upgraded) return false;
  const def = getCard(card.defId);
  return !!def && def.type !== 'curse';
}

function rollRarity(): 'common' | 'uncommon' | 'rare' {
  const n = rng();
  if (n < 0.6) return 'common';
  if (n < 0.9) return 'uncommon';
  return 'rare';
}

function rollCardIds(count: number): string[] {
  const pool = rewardPool(state.perks.extraCards, state.deck);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const rarity = rollRarity();
    const bucket = pool.filter((c) => c.rarity === rarity);
    const choice = bucket.length ? bucket : pool;
    if (!choice.length) break;
    out.push(pick(rng, choice).id);
  }
  return out;
}

function unusedRelicIds(pool: RelicDef[]): string[] {
  return shuffle(
    pool.filter((r) => !state.relics.includes(r.id)).map((r) => r.id),
    rng,
  );
}

function markFloor(): void {
  const node = currentNode();
  if (!node || state.cleared.includes(node.id)) return;
  state.cleared.push(node.id);
  state.floors += 1;
}

function completeRoom(): void {
  const node = currentNode();
  markFloor();
  state.reachable = node ? [...node.next] : [];
  state.currentNodeId = null;
  state.shop = null;
  state.reward = null;
  state.eventId = null;
  state.picker = null;
  state.combat = null;
  state.phase = 'map';
  emit();
}

function afterBoss(): void {
  markFloor();
  state.combat = null;
  state.relicChoices = [];
  state.picker = null;
  if (state.act >= 3) {
    closeRun(true, 'The City Pound stands down. The kennel holds.');
    return;
  }
  state.act += 1;
  state.map = generateAct(state.act, rng);
  state.cleared = [];
  state.currentNodeId = null;
  state.reachable = state.map.nodes.filter((n) => n.row === 0).map((n) => n.id);
  state.phase = 'map';
  note(`Act ${state.act} begins.`, 'good');
  emit({ flash: `Act ${state.act}` });
}

function kennelHeal(): void {
  if (!state.relics.includes('warm_kennel')) return;
  const gained = healRun(6);
  if (gained > 0) note(`Warm Kennel heals ${gained}.`, 'good');
}

function onWin(): void {
  const combat = state.combat;
  if (!combat) return;
  state.hp = Math.max(0, combat.player.hp);
  state.fightsWon += 1;
  kennelHeal();
  const node = currentNode();
  const boss = state.combatSource === 'map' && node?.kind === 'boss';
  const elite = state.combatSource === 'map' && node?.kind === 'elite';
  if (elite) state.elitesWon += 1;
  state.combat = null;
  if (boss) {
    const gained = healRun(Math.floor(state.maxHp * 0.3));
    note(`You catch your breath (+${gained} HP).`, 'good');
    state.relicChoices = unusedRelicIds(bossRelicPool()).slice(0, 3);
    state.phase = state.relicChoices.length ? 'relic' : 'map';
    if (!state.relicChoices.length) afterBoss();
    else emit({ flash: 'Boss down' });
    return;
  }
  const gold =
    state.combatSource === 'event' ? 12 + Math.floor(rng() * 7) : elite ? 25 + Math.floor(rng() * 11) : 10 + Math.floor(rng() * 11);
  state.gold += gold;
  note(`Found ${gold} gold.`, 'good');
  let relicId: string | null = null;
  if (elite) {
    relicId = unusedRelicIds(shopRelicPool())[0] ?? null;
    if (relicId) {
      state.relics.push(relicId);
      note(`Relic: ${getRelic(relicId)?.name ?? relicId}.`, 'good');
    }
  }
  const cards = rollCardIds(3);
  state.reward = {
    gold,
    cards,
    cardDone: cards.length === 0,
    relicId,
    relicDone: true,
  };
  state.phase = 'reward';
  emit({ flash: 'Victory' });
}

function settle(): void {
  const combat = state.combat;
  if (!combat?.over) {
    emit();
    return;
  }
  if (combat.victory) onWin();
  else lose('Your pack could not hold the line.');
}

function beginFight(encounterId: string, source: 'map' | 'event'): void {
  state.combatSource = source;
  state.picker = null;
  state.combat = startCombat({
    encounterId,
    hp: state.hp,
    maxHp: state.maxHp,
    deck: state.deck,
    relics: state.relics,
    bonusTurnEnergy: state.perks.turnEnergy,
    combatHeal: state.perks.combatHeal,
    rng,
  });
  state.phase = 'combat';
  emit();
}

function rollShop() {
  const cards = rollCardIds(5).map((id) => ({
    item: id,
    price: getCard(id)?.rarity === 'rare' ? 150 : getCard(id)?.rarity === 'uncommon' ? 75 : 50,
    sold: false,
  }));
  const relics = unusedRelicIds(shopRelicPool())
    .slice(0, 2)
    .map((id) => ({ item: id, price: getRelic(id)?.price ?? 150, sold: false }));
  const potion = state.potion
    ? null
    : { item: pick(rng, POTION_IDS), price: 50, sold: false };
  return {
    cards,
    relics,
    potion,
    removePrice: state.perks.cheapRemove ? 50 : 75,
  };
}

export function bootToTitle(): void {
  if (isLoggedIn()) profile = loadProfile();
  state = blankRun();
  saveFlash = '';
  emit({ persist: false });
}

export function updatePlayerName(name: string): void {
  profile = setProfileName(profile, name);
}

export async function createShelterAccount(username: string, password: string): Promise<boolean> {
  const liveRun = state.phase !== 'title' && state.phase !== 'ended' ? state : null;
  const result = await registerAccount(username, password, profile, liveRun);
  if (!result.ok) {
    accountNotice = result.error;
    emit({ persist: false });
    return false;
  }
  profile = loadProfile();
  accountNotice = `Signed in as ${result.username}.`;
  emit({ persist: false, flash: 'Account ready' });
  return true;
}

export async function loginShelterAccount(username: string, password: string): Promise<boolean> {
  const result = await signInAccount(username, password);
  if (!result.ok) {
    accountNotice = result.error;
    emit({ persist: false });
    return false;
  }
  profile = loadProfile();
  accountNotice = `Welcome back, ${getSessionUsername()}.`;
  emit({ persist: false, flash: 'Loaded' });
  return true;
}

export function logoutShelterAccount(): void {
  logout();
  profile = defaultProfile();
  state = blankRun();
  accountNotice = 'Signed out.';
  emit({ persist: false });
}

export function nudgeLoginToSave(): void {
  emit({
    persist: false,
    flash: 'Guest runs vanish. Menu → Log in to save keeps XP.',
  });
}

export async function restoreShelterAccount(code: string, password: string): Promise<boolean> {
  const result = await restoreAccount(code, password);
  if (!result.ok) {
    accountNotice = result.error;
    emit({ persist: false });
    return false;
  }
  profile = loadProfile();
  accountNotice = `Restored ${result.username}.`;
  emit({ persist: false, flash: 'Restored' });
  return true;
}

export async function unlockShelterBackup(password: string): Promise<boolean> {
  const result = await unlockAccountBackup(password);
  if (!result.ok) {
    accountNotice = result.error;
    emit({ persist: false });
    return false;
  }
  accountNotice = 'Backup unlocked.';
  emit({ persist: false });
  return true;
}

export function copyRestoreCode(): string | null {
  if (getSessionPassword()) saveProfile(profile);
  const code = exportRestoreCode();
  if (!code) {
    accountNotice = 'Sign in first.';
    emit({ persist: false });
    return null;
  }
  return code;
}

export function startRun(): void {
  if (!profile.name.trim()) {
    profile = setProfileName(profile, isLoggedIn() ? 'Shelter Manager' : 'Guest');
  }
  if (profile.lastReward) profile = clearLastReward(profile);
  profile = recordSeasonStart(profile);
  if (isLoggedIn()) clearRun();
  const unlocks = profile.unlocks || [];
  state = blankRun();
  const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
  state.seed = seed || 1;
  state.rng = state.seed;
  state.maxHp = 72;
  if (hasUnlock(unlocks, 'start_reputation')) state.maxHp += 6;
  if (hasUnlock(unlocks, 'start_kennel')) state.maxHp += 4;
  state.hp = state.maxHp;
  state.gold = 99;
  if (hasUnlock(unlocks, 'start_supplies')) state.gold += 15;
  if (hasUnlock(unlocks, 'start_gold')) state.gold += 12;
  state.relics = ['warm_kennel'];
  state.perks.turnEnergy = hasUnlock(unlocks, 'start_energy') ? 1 : 0;
  state.perks.combatHeal = hasUnlock(unlocks, 'morning_delivery') ? 3 : 0;
  state.perks.cheapRemove = hasUnlock(unlocks, 'species_chameleon');
  if (hasUnlock(unlocks, 'species_bird')) state.perks.extraCards.push('flutter');
  if (hasUnlock(unlocks, 'species_ferret')) state.perks.extraCards.push('ferret_bite');
  if (hasUnlock(unlocks, 'species_hamster')) state.potion = 'heal';
  const starters = ['nip', 'nip', 'nip', 'nip', 'nip', 'brace', 'brace', 'brace', 'brace', 'bark'];
  if (hasUnlock(unlocks, 'species_rabbit')) starters.push('treat');
  state.deck = starters.map((id) => makeCard(id));
  state.map = generateAct(1, rng);
  state.act = 1;
  state.reachable = state.map.nodes.filter((n) => n.row === 0).map((n) => n.id);
  state.phase = 'map';
  note('Act 1. The yard is open.', 'good');
  emit({ flash: isLoggedIn() ? 'Run started' : 'Guest run — not saved' });
}

export function continueRun(): boolean {
  if (!isLoggedIn()) return false;
  const saved = loadRun();
  if (!saved) return false;
  state = saved;
  note('Welcome back.', 'good');
  emit({ flash: 'Continue save loaded' });
  return true;
}

export function abandonRun(): void {
  clearRun();
  bootToTitle();
}

export function chooseNode(id: string): void {
  if (state.phase !== 'map' || !state.reachable.includes(id)) return;
  const node = state.map.nodes.find((n) => n.id === id);
  if (!node) return;
  state.currentNodeId = id;
  state.picker = null;
  if (node.kind === 'combat' || node.kind === 'elite' || node.kind === 'boss') {
    if (!node.encounterId) return;
    beginFight(node.encounterId, 'map');
    return;
  }
  if (node.kind === 'rest') {
    state.phase = 'rest';
    emit();
    return;
  }
  if (node.kind === 'shop') {
    state.shop = rollShop();
    state.phase = 'shop';
    emit();
    return;
  }
  state.eventId = node.eventId ?? 'donation';
  state.phase = 'event';
  emit();
}

export function playHandCard(uid: string): void {
  const combat = state.combat;
  if (!combat || state.phase !== 'combat') return;
  playCard(combat, uid, rng);
  settle();
}

export function aimEnemy(uid: string): void {
  const combat = state.combat;
  if (!combat || state.phase !== 'combat') return;
  if (combat.pending?.type === 'potion') {
    const ok = drinkPendingPotion(combat, uid);
    if (ok) state.potion = null;
    settle();
    return;
  }
  confirmTarget(combat, uid, rng);
  settle();
}

export function exhaustChoice(uid: string): void {
  const combat = state.combat;
  if (!combat) return;
  chooseExhaust(combat, uid, rng);
  settle();
}

export function finishTurn(): void {
  const combat = state.combat;
  if (!combat) return;
  endTurn(combat, rng);
  settle();
}

export function drinkPotion(): void {
  const combat = state.combat;
  if (!combat || !state.potion || combat.pending) return;
  const held = state.potion;
  const result = usePotion(combat, held);
  if (result === 'ok') state.potion = null;
  settle();
}

export function takeRewardCard(defId: string): void {
  const reward = state.reward;
  if (state.phase !== 'reward' || !reward || reward.cardDone) return;
  if (!reward.cards.includes(defId)) return;
  state.deck.push(makeCard(defId));
  reward.cardDone = true;
  note(`Added ${getCard(defId)?.name ?? 'a card'} to the deck.`, 'good');
  emit();
}

export function skipRewardCard(): void {
  const reward = state.reward;
  if (state.phase !== 'reward' || !reward || reward.cardDone) return;
  reward.cardDone = true;
  note('Skipped the card.');
  emit();
}

export function leaveReward(): void {
  if (state.phase !== 'reward' || !state.reward?.cardDone) return;
  completeRoom();
}

export function chooseBossRelic(id: string): void {
  if (state.phase !== 'relic' || !state.relicChoices.includes(id)) return;
  if (!state.relics.includes(id)) state.relics.push(id);
  note(`Took ${getRelic(id)?.name ?? 'a relic'}.`, 'good');
  afterBoss();
}

export function restHeal(): void {
  if (state.phase !== 'rest') return;
  const gained = healRun(Math.floor(state.maxHp * 0.3));
  note(`Rested. Healed ${gained}.`, 'good');
  completeRoom();
}

export function openUpgradePicker(): void {
  if (state.phase !== 'rest' && state.phase !== 'event') return;
  if (!state.deck.some(canUpgrade)) return;
  state.picker = 'upgrade';
  emit();
}

export function openRemovePicker(): void {
  if (state.phase !== 'event' || state.deck.length <= 1) return;
  state.picker = 'remove';
  emit();
}

export function cancelPicker(): void {
  if (!state.picker) return;
  state.picker = null;
  emit();
}

export function confirmUpgrade(uid: string): void {
  if (state.picker !== 'upgrade') return;
  if (state.phase !== 'rest' && state.phase !== 'event') return;
  const card = state.deck.find((c) => c.uid === uid);
  if (!card || !canUpgrade(card)) return;
  card.upgraded = true;
  note(`Upgraded ${cardName(card)}.`, 'good');
  state.picker = null;
  completeRoom();
}

export function confirmRemove(uid: string): void {
  if (state.picker !== 'remove' || state.phase !== 'event' || state.deck.length <= 1) return;
  const index = state.deck.findIndex((c) => c.uid === uid);
  if (index < 0) return;
  const [card] = state.deck.splice(index, 1);
  note(`Removed ${card ? cardName(card) : 'a card'}.`);
  state.picker = null;
  completeRoom();
}

export function buyShopCard(index: number): void {
  const shop = state.shop;
  if (state.phase !== 'shop' || !shop) return;
  const slot = shop.cards[index];
  if (!slot || slot.sold || state.gold < slot.price) return;
  state.gold -= slot.price;
  slot.sold = true;
  state.deck.push(makeCard(slot.item));
  note(`Bought ${getCard(slot.item)?.name ?? 'a card'}.`, 'good');
  emit();
}

export function buyShopRelic(index: number): void {
  const shop = state.shop;
  if (state.phase !== 'shop' || !shop) return;
  const slot = shop.relics[index];
  if (!slot || slot.sold || state.gold < slot.price || state.relics.includes(slot.item)) return;
  state.gold -= slot.price;
  slot.sold = true;
  state.relics.push(slot.item);
  note(`Bought ${getRelic(slot.item)?.name ?? 'a relic'}.`, 'good');
  emit();
}

export function buyShopPotion(): void {
  const shop = state.shop;
  if (state.phase !== 'shop' || !shop?.potion || shop.potion.sold || state.potion) return;
  if (state.gold < shop.potion.price) return;
  state.gold -= shop.potion.price;
  shop.potion.sold = true;
  state.potion = shop.potion.item;
  note(`Bought ${POTIONS[state.potion].name}.`, 'good');
  emit();
}

export function shopRemove(uid: string): void {
  const shop = state.shop;
  if (state.phase !== 'shop' || !shop || state.deck.length <= 1) return;
  if (state.gold < shop.removePrice) return;
  const index = state.deck.findIndex((c) => c.uid === uid);
  if (index < 0) return;
  state.gold -= shop.removePrice;
  const [card] = state.deck.splice(index, 1);
  note(`Removed ${card ? cardName(card) : 'a card'}.`);
  emit();
}

export function leaveShop(): void {
  if (state.phase !== 'shop') return;
  completeRoom();
}

export interface EventChoiceView {
  id: string;
  label: string;
}

export function eventPresentation(): { title: string; emoji: string; body: string; choices: EventChoiceView[] } | null {
  if (state.phase !== 'event' || !state.eventId) return null;
  const upgradeable = state.deck.some(canUpgrade);
  switch (state.eventId) {
    case 'donation':
      return {
        title: 'Donation jar',
        emoji: '🪙',
        body: 'A full jar sits on the step. It is heavier than it looks.',
        choices: [
          { id: 'donate', label: 'Lose 8 HP. Gain 90 gold.' },
          { id: 'leave', label: 'Leave it.' },
        ],
      };
    case 'training': {
      const choices: EventChoiceView[] = [];
      if (upgradeable) choices.push({ id: 'upgrade', label: 'Upgrade a card.' });
      if (!state.relics.includes('whistle')) {
        choices.push({ id: 'whistle', label: 'Lose 6 HP. Gain Whistle.' });
      }
      if (!choices.length) choices.push({ id: 'leave', label: 'Nothing here for you. Leave.' });
      return {
        title: 'Training yard',
        emoji: '📣',
        body: 'The clicker is still on the fence post.',
        choices,
      };
    }
    case 'fence':
      return {
        title: 'Fence stray',
        emoji: '🦝',
        body: 'Something is in the bins. You can take the fleas, or chase it off.',
        choices: [
          { id: 'flea', label: 'Add a Flea to your deck.' },
          { id: 'fight', label: 'Fight a Raccoon for a card reward.' },
        ],
      };
    case 'sleepover':
      return {
        title: 'Sleepover',
        emoji: '🛏️',
        body: 'A quiet night. Send one card home, or just sleep.',
        choices: [
          ...(state.deck.length > 1 ? [{ id: 'remove', label: 'Remove a card.' }] : []),
          { id: 'heal', label: 'Heal 10 HP.' },
        ],
      };
    case 'storm':
      return {
        title: 'Storm',
        emoji: '🌧️',
        body: 'The kennel roof bucks. You brace, or you pick up what the wind drops.',
        choices: [
          { id: 'hp', label: 'Lose 7 HP.' },
          { id: 'flea', label: 'Add a Flea to your deck.' },
        ],
      };
    case 'treats':
      return {
        title: 'Treat pile',
        emoji: '🦴',
        body: 'Someone left a sack by the gate.',
        choices: [
          { id: 'heal', label: 'Heal 14 HP.' },
          { id: 'card', label: 'Add Treat to your deck.' },
        ],
      };
    default:
      return null;
  }
}

export function chooseEvent(choice: string): void {
  if (state.phase !== 'event' || state.picker) return;
  const id = state.eventId;
  if (id === 'donation') {
    if (choice === 'leave') {
      completeRoom();
      return;
    }
    if (choice === 'donate') {
      if (hurt(8, 'The donation cost more than you had left.')) return;
      state.gold += 90;
      note('The jar was full. +90 gold.', 'good');
      completeRoom();
    }
    return;
  }
  if (id === 'training') {
    if (choice === 'upgrade') {
      openUpgradePicker();
      return;
    }
    if (choice === 'leave') {
      completeRoom();
      return;
    }
    if (choice === 'whistle' && !state.relics.includes('whistle')) {
      if (hurt(6, 'The yard took the last of your strength.')) return;
      state.relics.push('whistle');
      note('You keep the Whistle.', 'good');
      completeRoom();
    }
    return;
  }
  if (id === 'fence') {
    if (choice === 'flea') {
      state.deck.push(makeCard('flea'));
      note('A Flea hitches a ride.', 'bad');
      completeRoom();
      return;
    }
    if (choice === 'fight') {
      beginFight(state.act === 1 ? 'raccoon' : 'raccoon2', 'event');
    }
    return;
  }
  if (id === 'sleepover') {
    if (choice === 'heal') {
      const gained = healRun(10);
      note(`Slept. Healed ${gained}.`, 'good');
      completeRoom();
      return;
    }
    if (choice === 'remove') openRemovePicker();
    return;
  }
  if (id === 'storm') {
    if (choice === 'hp') {
      if (hurt(7, 'The storm was too much.')) return;
      note('You rode out the storm.', 'bad');
      completeRoom();
      return;
    }
    if (choice === 'flea') {
      state.deck.push(makeCard('flea'));
      note('The wind left you a Flea.', 'bad');
      completeRoom();
    }
    return;
  }
  if (id === 'treats') {
    if (choice === 'heal') {
      const gained = healRun(14);
      note(`Treats. Healed ${gained}.`, 'good');
      completeRoom();
      return;
    }
    if (choice === 'card') {
      state.deck.push(makeCard('treat'));
      note('Treat joins the deck.', 'good');
      completeRoom();
    }
  }
}

export function cardEnergy(card: CardInstance): number {
  return cardCost(card);
}

export { cardPlayable };
