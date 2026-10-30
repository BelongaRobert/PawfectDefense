import type { CardInstance, CardTarget, CardType, Effect, Rarity } from './types';

export interface CardDef {
  id: string;
  name: string;
  type: CardType;
  rarity: Rarity;
  cost: number;
  upgradedCost?: number;
  emoji: string;
  target: CardTarget;
  exhaust: boolean;
  text: string;
  upgradedText: string;
  effects: Effect[];
  upgradedEffects: Effect[];
  /** Hidden from rewards until the matching unlock is on the run. */
  unlock?: 'flutter' | 'ferret_bite';
}

function card(def: CardDef): CardDef {
  return def;
}

export const CARDS: CardDef[] = [
  card({
    id: 'nip',
    name: 'Nip',
    type: 'attack',
    rarity: 'starter',
    cost: 1,
    emoji: '🦷',
    target: 'enemy',
    exhaust: false,
    text: 'Deal 6 damage.',
    upgradedText: 'Deal 9 damage.',
    effects: [{ op: 'damage', amount: 6 }],
    upgradedEffects: [{ op: 'damage', amount: 9 }],
  }),
  card({
    id: 'brace',
    name: 'Brace',
    type: 'skill',
    rarity: 'starter',
    cost: 1,
    emoji: '🛡️',
    target: 'self',
    exhaust: false,
    text: 'Gain 5 Block.',
    upgradedText: 'Gain 8 Block.',
    effects: [{ op: 'block', amount: 5 }],
    upgradedEffects: [{ op: 'block', amount: 8 }],
  }),
  card({
    id: 'bark',
    name: 'Bark',
    type: 'attack',
    rarity: 'starter',
    cost: 2,
    emoji: '📣',
    target: 'enemy',
    exhaust: false,
    text: 'Deal 8 damage. Apply 2 Vulnerable.',
    upgradedText: 'Deal 10 damage. Apply 3 Vulnerable.',
    effects: [
      { op: 'damage', amount: 8 },
      { op: 'vulnerable', amount: 2 },
    ],
    upgradedEffects: [
      { op: 'damage', amount: 10 },
      { op: 'vulnerable', amount: 3 },
    ],
  }),
  card({
    id: 'pack_leader',
    name: 'Pack Leader',
    type: 'power',
    rarity: 'rare',
    cost: 1,
    emoji: '🐺',
    target: 'self',
    exhaust: true,
    text: 'Gain 2 Strength.',
    upgradedText: 'Gain 3 Strength.',
    effects: [{ op: 'strength', amount: 2 }],
    upgradedEffects: [{ op: 'strength', amount: 3 }],
  }),
  card({
    id: 'bouncy_corgi',
    name: 'Bouncy Corgi',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    emoji: '🐕',
    target: 'enemy',
    exhaust: false,
    text: 'Deal 4 damage twice.',
    upgradedText: 'Deal 6 damage twice.',
    effects: [{ op: 'hits', amount: 4, times: 2 }],
    upgradedEffects: [{ op: 'hits', amount: 6, times: 2 }],
  }),
  card({
    id: 'howl',
    name: 'Howl',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    emoji: '🌕',
    target: 'self',
    exhaust: false,
    text: 'Gain 1 Strength. Draw 1 card.',
    upgradedText: 'Gain 2 Strength. Draw 1 card.',
    effects: [
      { op: 'strength', amount: 1 },
      { op: 'draw', amount: 1 },
    ],
    upgradedEffects: [
      { op: 'strength', amount: 2 },
      { op: 'draw', amount: 1 },
    ],
  }),
  card({
    id: 'rally',
    name: 'Rally the Kennel',
    type: 'attack',
    rarity: 'uncommon',
    cost: 1,
    emoji: '🐾',
    target: 'all',
    exhaust: false,
    text: 'Deal 5 damage to ALL enemies.',
    upgradedText: 'Deal 8 damage to ALL enemies.',
    effects: [{ op: 'damageAll', amount: 5 }],
    upgradedEffects: [{ op: 'damageAll', amount: 8 }],
  }),
  card({
    id: 'alpha_lunge',
    name: 'Alpha Lunge',
    type: 'attack',
    rarity: 'rare',
    cost: 2,
    emoji: '💥',
    target: 'enemy',
    exhaust: false,
    text: 'Deal 14 damage.',
    upgradedText: 'Deal 20 damage.',
    effects: [{ op: 'damage', amount: 14 }],
    upgradedEffects: [{ op: 'damage', amount: 20 }],
  }),
  card({
    id: 'guard_dog',
    name: 'Guard Dog',
    type: 'skill',
    rarity: 'common',
    cost: 2,
    emoji: '🐕‍🦺',
    target: 'self',
    exhaust: false,
    text: 'Gain 12 Block.',
    upgradedText: 'Gain 16 Block.',
    effects: [{ op: 'block', amount: 12 }],
    upgradedEffects: [{ op: 'block', amount: 16 }],
  }),
  card({
    id: 'shepherd',
    name: 'Shepherd',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    emoji: '🦮',
    target: 'enemy',
    exhaust: false,
    text: 'Deal 5 damage. Gain 5 Block.',
    upgradedText: 'Deal 8 damage. Gain 8 Block.',
    effects: [
      { op: 'damage', amount: 5 },
      { op: 'block', amount: 5 },
    ],
    upgradedEffects: [
      { op: 'damage', amount: 8 },
      { op: 'block', amount: 8 },
    ],
  }),
  card({
    id: 'play_bow',
    name: 'Play Bow',
    type: 'skill',
    rarity: 'uncommon',
    cost: 0,
    emoji: '🎀',
    target: 'self',
    exhaust: true,
    text: 'Gain 4 Block. Draw 1 card. Exhaust.',
    upgradedText: 'Gain 7 Block. Draw 1 card. Exhaust.',
    effects: [
      { op: 'block', amount: 4 },
      { op: 'draw', amount: 1 },
    ],
    upgradedEffects: [
      { op: 'block', amount: 7 },
      { op: 'draw', amount: 1 },
    ],
  }),
  card({
    id: 'night_watch',
    name: 'Night Watch',
    type: 'power',
    rarity: 'uncommon',
    cost: 2,
    emoji: '🌙',
    target: 'self',
    exhaust: true,
    text: 'Whenever you play a Skill, gain 3 Block.',
    upgradedText: 'Whenever you play a Skill, gain 4 Block.',
    effects: [{ op: 'powerBlockOnSkill', amount: 3 }],
    upgradedEffects: [{ op: 'powerBlockOnSkill', amount: 4 }],
  }),
  card({
    id: 'bed_down',
    name: 'Bed Down',
    type: 'power',
    rarity: 'rare',
    cost: 3,
    upgradedCost: 2,
    emoji: '🛏️',
    target: 'self',
    exhaust: true,
    text: 'Block no longer expires.',
    upgradedText: 'Block no longer expires.',
    effects: [{ op: 'powerRetainBlock' }],
    upgradedEffects: [{ op: 'powerRetainBlock' }],
  }),
  card({
    id: 'herding_nudge',
    name: 'Herding Nudge',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    emoji: '🐕',
    target: 'enemy',
    exhaust: false,
    text: 'Deal 7 damage. Apply 1 Vulnerable.',
    upgradedText: 'Deal 10 damage. Apply 2 Vulnerable.',
    effects: [
      { op: 'damage', amount: 7 },
      { op: 'vulnerable', amount: 1 },
    ],
    upgradedEffects: [
      { op: 'damage', amount: 10 },
      { op: 'vulnerable', amount: 2 },
    ],
  }),
  card({
    id: 'clicker',
    name: 'Clicker',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    emoji: '📣',
    target: 'enemy',
    exhaust: false,
    text: 'Apply 2 Vulnerable. Draw 1 card.',
    upgradedText: 'Apply 3 Vulnerable. Draw 1 card.',
    effects: [
      { op: 'vulnerable', amount: 2 },
      { op: 'draw', amount: 1 },
    ],
    upgradedEffects: [
      { op: 'vulnerable', amount: 3 },
      { op: 'draw', amount: 1 },
    ],
  }),
  card({
    id: 'fence_run',
    name: 'Fence Run',
    type: 'attack',
    rarity: 'uncommon',
    cost: 1,
    emoji: '🏃',
    target: 'enemy',
    exhaust: false,
    text: 'Deal 12 damage if the target is Vulnerable, otherwise 6.',
    upgradedText: 'Deal 16 damage if the target is Vulnerable, otherwise 8.',
    effects: [{ op: 'ifVulnerable', yes: 12, no: 6 }],
    upgradedEffects: [{ op: 'ifVulnerable', yes: 16, no: 8 }],
  }),
  card({
    id: 'double_walk',
    name: 'Double Walk',
    type: 'skill',
    rarity: 'rare',
    cost: 1,
    upgradedCost: 0,
    emoji: '✌️',
    target: 'self',
    exhaust: true,
    text: 'This turn, your next Attack plays twice. Exhaust.',
    upgradedText: 'This turn, your next Attack plays twice. Exhaust.',
    effects: [{ op: 'doubleNextAttack' }],
    upgradedEffects: [{ op: 'doubleNextAttack' }],
  }),
  card({
    id: 'fetch',
    name: 'Fetch',
    type: 'skill',
    rarity: 'common',
    cost: 1,
    emoji: '🎾',
    target: 'self',
    exhaust: false,
    text: 'Draw 2 cards.',
    upgradedText: 'Draw 3 cards.',
    effects: [{ op: 'draw', amount: 2 }],
    upgradedEffects: [{ op: 'draw', amount: 3 }],
  }),
  card({
    id: 'shake',
    name: 'Shake',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    emoji: '💦',
    target: 'self',
    exhaust: true,
    text: 'Exhaust a card in your hand. Draw 1 card.',
    upgradedText: 'Exhaust a card in your hand. Draw 2 cards.',
    effects: [{ op: 'exhaustHand', draw: 1 }],
    upgradedEffects: [{ op: 'exhaustHand', draw: 2 }],
  }),
  card({
    id: 'treat',
    name: 'Treat',
    type: 'skill',
    rarity: 'common',
    cost: 1,
    emoji: '🦴',
    target: 'self',
    exhaust: true,
    text: 'Heal 6 HP. Exhaust.',
    upgradedText: 'Heal 9 HP. Exhaust.',
    effects: [{ op: 'heal', amount: 6 }],
    upgradedEffects: [{ op: 'heal', amount: 9 }],
  }),
  card({
    id: 'flea',
    name: 'Flea',
    type: 'curse',
    rarity: 'curse',
    cost: 0,
    emoji: '🪲',
    target: 'self',
    exhaust: false,
    text: 'Unplayable.',
    upgradedText: 'Unplayable.',
    effects: [],
    upgradedEffects: [],
  }),
  card({
    id: 'flutter',
    name: 'Flutter',
    type: 'attack',
    rarity: 'uncommon',
    cost: 1,
    emoji: '🐦',
    target: 'enemy',
    exhaust: false,
    text: 'Deal 3 damage 3 times.',
    upgradedText: 'Deal 4 damage 3 times.',
    effects: [{ op: 'hits', amount: 3, times: 3 }],
    upgradedEffects: [{ op: 'hits', amount: 4, times: 3 }],
    unlock: 'flutter',
  }),
  card({
    id: 'ferret_bite',
    name: 'Ferret Bite',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    emoji: '🦡',
    target: 'enemy',
    exhaust: false,
    text: 'Apply 5 Poison.',
    upgradedText: 'Apply 7 Poison.',
    effects: [{ op: 'poison', amount: 5 }],
    upgradedEffects: [{ op: 'poison', amount: 7 }],
    unlock: 'ferret_bite',
  }),
];

const BY_ID = new Map(CARDS.map((c) => [c.id, c]));

export function getCard(id: string): CardDef | undefined {
  return BY_ID.get(id);
}

export function cardEffects(card: CardInstance): Effect[] {
  const def = getCard(card.defId);
  if (!def) return [];
  return card.upgraded ? def.upgradedEffects : def.effects;
}

export function cardCost(card: CardInstance): number {
  if (card.costOverride !== undefined) return card.costOverride;
  const def = getCard(card.defId);
  if (!def) return 0;
  if (card.upgraded && def.upgradedCost !== undefined) return def.upgradedCost;
  return def.cost;
}

export function cardText(card: CardInstance): string {
  const def = getCard(card.defId);
  if (!def) return '';
  return card.upgraded ? def.upgradedText : def.text;
}

export function cardName(card: CardInstance): string {
  const def = getCard(card.defId);
  if (!def) return card.defId;
  return card.upgraded ? `${def.name}+` : def.name;
}

export function rewardPool(extraCards: readonly string[], deck: readonly CardInstance[]): CardDef[] {
  const hasBed = deck.some((c) => c.defId === 'bed_down');
  return CARDS.filter((c) => {
    if (c.rarity !== 'common' && c.rarity !== 'uncommon' && c.rarity !== 'rare') return false;
    if (c.unlock && !extraCards.includes(c.unlock)) return false;
    if (c.id === 'bed_down' && hasBed) return false;
    return true;
  });
}
