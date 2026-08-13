import type { Species } from './types';

export type UnlockId =
  | 'species_rabbit'
  | 'species_bird'
  | 'species_chameleon'
  | 'species_hamster'
  | 'species_ferret'
  | 'start_supplies'
  | 'start_kennel'
  | 'start_reputation'
  | 'start_energy'
  | 'start_gold'
  | 'morning_delivery';

export interface UnlockDef {
  id: UnlockId;
  level: number;
  name: string;
  description: string;
  emoji: string;
  kind: 'species' | 'bonus';
  species?: Species;
}

/** Shelter level thresholds (cumulative XP to reach that level). */
export const LEVEL_XP = [0, 0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200];

export const UNLOCKS: UnlockDef[] = [
  {
    id: 'species_rabbit',
    level: 2,
    name: 'Rabbits',
    description: 'Rabbits can arrive at intake.',
    emoji: '🐇',
    kind: 'species',
    species: 'rabbit',
  },
  {
    id: 'start_supplies',
    level: 2,
    name: 'Stocked Pantry',
    description: 'Start each season with +3 supplies.',
    emoji: '🥫',
    kind: 'bonus',
  },
  {
    id: 'species_bird',
    level: 3,
    name: 'Birds',
    description: 'Birds can arrive at intake.',
    emoji: '🦜',
    kind: 'species',
    species: 'bird',
  },
  {
    id: 'start_reputation',
    level: 3,
    name: 'Neighborhood Flyer',
    description: 'Start each season with +5 reputation.',
    emoji: '💛',
    kind: 'bonus',
  },
  {
    id: 'species_chameleon',
    level: 4,
    name: 'Chameleons',
    description: 'Chameleons can arrive at intake.',
    emoji: '🦎',
    kind: 'species',
    species: 'chameleon',
  },
  {
    id: 'start_gold',
    level: 4,
    name: 'Community Jar',
    description: 'Start each season with +12 gold.',
    emoji: '🪙',
    kind: 'bonus',
  },
  {
    id: 'species_hamster',
    level: 5,
    name: 'Hamsters',
    description: 'Hamsters can arrive at intake.',
    emoji: '🐹',
    kind: 'species',
    species: 'hamster',
  },
  {
    id: 'start_kennel',
    level: 6,
    name: 'Extra Kennel Permit',
    description: 'Start each season with +1 kennel capacity.',
    emoji: '🏠',
    kind: 'bonus',
  },
  {
    id: 'species_ferret',
    level: 7,
    name: 'Ferrets',
    description: 'Ferrets can arrive at intake.',
    emoji: '🦡',
    kind: 'species',
    species: 'ferret',
  },
  {
    id: 'start_energy',
    level: 8,
    name: 'Volunteer Roster',
    description: 'Start each season with +1 max staff energy.',
    emoji: '⚡',
    kind: 'bonus',
  },
  {
    id: 'morning_delivery',
    level: 9,
    name: 'Morning Delivery',
    description: '+1 food delivered each morning of a season.',
    emoji: '📦',
    kind: 'bonus',
  },
];

export const STARTER_SPECIES: Species[] = ['dog', 'cat'];

export function levelFromXp(xp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_XP.length; i++) {
    if (xp >= LEVEL_XP[i]!) level = i;
  }
  // Beyond table: every 800 XP
  if (xp >= LEVEL_XP[LEVEL_XP.length - 1]!) {
    const extra = xp - LEVEL_XP[LEVEL_XP.length - 1]!;
    level = LEVEL_XP.length - 1 + Math.floor(extra / 800);
  }
  return Math.max(1, level);
}

export function xpToNextLevel(xp: number): { level: number; need: number; into: number } {
  const level = levelFromXp(xp);
  const curFloor =
    level < LEVEL_XP.length
      ? LEVEL_XP[level]!
      : LEVEL_XP[LEVEL_XP.length - 1]! + (level - (LEVEL_XP.length - 1)) * 800;
  const next =
    level + 1 < LEVEL_XP.length
      ? LEVEL_XP[level + 1]!
      : LEVEL_XP[LEVEL_XP.length - 1]! + (level + 1 - (LEVEL_XP.length - 1)) * 800;
  return {
    level,
    need: Math.max(1, next - curFloor),
    into: Math.max(0, xp - curFloor),
  };
}

export function unlocksForLevel(level: number): UnlockDef[] {
  return UNLOCKS.filter((u) => u.level <= level);
}

type XpProfile = { xp: number; level: number; unlocks: string[] };

/** Returns newly unlocked defs after XP grant. */
export function grantXp(profile: XpProfile, amount: number): UnlockDef[] {
  const before = levelFromXp(profile.xp || 0);
  const had = new Set(profile.unlocks || []);
  profile.xp = Math.max(0, (profile.xp || 0) + Math.max(0, amount));
  const after = levelFromXp(profile.xp);
  profile.level = after;
  for (const u of unlocksForLevel(after)) {
    if (!profile.unlocks.includes(u.id)) profile.unlocks.push(u.id);
  }
  return unlocksForLevel(after).filter((u) => !had.has(u.id) && u.level > before);
}

export function unlockedSpecies(unlocks: string[] = []): Species[] {
  const set = new Set<Species>(STARTER_SPECIES);
  for (const id of unlocks) {
    const def = UNLOCKS.find((u) => u.id === id);
    if (def?.species) set.add(def.species);
  }
  return [...set];
}

export function hasUnlock(unlocks: string[] = [], id: UnlockId): boolean {
  return unlocks.includes(id);
}

export interface XpBreakdown {
  total: number;
  parts: { label: string; amount: number }[];
}

export function computeRunXp(input: {
  won: boolean;
  adoptions: number;
  day: number;
  maxDays: number;
  endless: boolean;
  reputation: number;
}): XpBreakdown {
  const parts: { label: string; amount: number }[] = [];
  parts.push({ label: 'Season finished', amount: 35 });
  if (input.won) parts.push({ label: 'Season victory', amount: 50 });
  if (input.adoptions > 0) {
    parts.push({ label: `${input.adoptions} adoptions`, amount: input.adoptions * 8 });
  }
  const daysPastMid = Math.max(0, Math.min(input.day, input.maxDays) - 5);
  if (daysPastMid > 0) parts.push({ label: 'Late-season days', amount: daysPastMid * 4 });
  if (input.endless && input.day > input.maxDays) {
    const extra = input.day - input.maxDays;
    parts.push({ label: `Endless (+${extra} days)`, amount: extra * 6 });
  }
  if (input.reputation >= 70) parts.push({ label: 'High reputation', amount: 15 });
  const total = parts.reduce((s, p) => s + p.amount, 0);
  return { total, parts };
}

/** One-time catch-up XP for profiles that predate the leveling system. */
export function estimateLegacyXp(stats: {
  seasonsWon: number;
  seasonsLost: number;
  totalAdoptions: number;
  endlessBestDay: number;
}): number {
  return (
    stats.seasonsWon * 90 +
    stats.seasonsLost * 35 +
    stats.totalAdoptions * 6 +
    Math.max(0, stats.endlessBestDay - 10) * 6
  );
}
