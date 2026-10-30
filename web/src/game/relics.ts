import type { Rarity } from './types';

export interface RelicDef {
  id: string;
  name: string;
  description: string;
  emoji: string;
  rarity: Rarity;
  price: number;
}

export const RELICS: RelicDef[] = [
  {
    id: 'warm_kennel',
    name: 'Warm Kennel',
    description: 'Heal 6 HP after each combat you win.',
    emoji: '🏠',
    rarity: 'starter',
    price: 0,
  },
  {
    id: 'treat_bowl',
    name: 'Treat Bowl',
    description: 'Gain 1 Energy on turn 1.',
    emoji: '🥣',
    rarity: 'common',
    price: 150,
  },
  {
    id: 'old_collar',
    name: 'Old Collar',
    description: 'Gain 4 Block at the start of each combat.',
    emoji: '📿',
    rarity: 'common',
    price: 150,
  },
  {
    id: 'whistle',
    name: 'Whistle',
    description: 'Gain 1 Strength at the start of each combat.',
    emoji: '📯',
    rarity: 'common',
    price: 150,
  },
  {
    id: 'leash',
    name: 'Leash',
    description: 'Attacks deal 1 more damage. Once per card, not once per hit.',
    emoji: '🪢',
    rarity: 'common',
    price: 150,
  },
  {
    id: 'pantry',
    name: 'Pantry',
    description: 'Whenever you play a Skill, heal 1 HP.',
    emoji: '🥫',
    rarity: 'common',
    price: 150,
  },
  {
    id: 'collar_bell',
    name: 'Collar Bell',
    description: 'Whenever you apply Vulnerable, deal 4 damage to that enemy.',
    emoji: '🔔',
    rarity: 'uncommon',
    price: 200,
  },
  {
    id: 'spare_leash',
    name: 'Spare Leash',
    description: 'Draw 2 extra cards on turn 1.',
    emoji: '🦮',
    rarity: 'uncommon',
    price: 200,
  },
  {
    id: 'blanket',
    name: 'Blanket',
    description: 'Gain 1 Dexterity at the start of each combat.',
    emoji: '🛏️',
    rarity: 'uncommon',
    price: 200,
  },
  {
    id: 'clicker_charm',
    name: 'Clicker Charm',
    description: 'The first Attack each turn applies 1 Vulnerable.',
    emoji: '📣',
    rarity: 'uncommon',
    price: 200,
  },
  {
    id: 'carrier',
    name: 'Carrier',
    description: 'The first card you Exhaust each combat returns to your hand and costs 0.',
    emoji: '📦',
    rarity: 'rare',
    price: 250,
  },
  {
    id: 'warden_badge',
    name: "Warden's Badge",
    description: 'Gain 1 Energy at the start of each turn.',
    emoji: '🎖️',
    rarity: 'boss',
    price: 0,
  },
];

const BY_ID = new Map(RELICS.map((r) => [r.id, r]));

export function getRelic(id: string): RelicDef | undefined {
  return BY_ID.get(id);
}

export function shopRelicPool(): RelicDef[] {
  return RELICS.filter((r) => r.rarity === 'common' || r.rarity === 'uncommon' || r.rarity === 'rare');
}

export function bossRelicPool(): RelicDef[] {
  return RELICS.filter((r) => r.rarity !== 'starter');
}
