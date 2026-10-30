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
  kind: 'card' | 'bonus';
}

/** Shelter level thresholds (cumulative XP to reach that level). */
export const LEVEL_XP = [0, 0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200];

export const UNLOCKS: UnlockDef[] = [
  {
    id: 'species_rabbit',
    level: 2,
    name: 'Treat',
    description: 'Start each run with a Treat in your deck.',
    emoji: '🦴',
    kind: 'card',
  },
  {
    id: 'start_supplies',
    level: 2,
    name: 'Stocked Pantry',
    description: 'Start each run with +15 gold.',
    emoji: '🥫',
    kind: 'bonus',
  },
  {
    id: 'species_bird',
    level: 3,
    name: 'Flutter',
    description: 'A bird multi-hit card joins card rewards.',
    emoji: '🐦',
    kind: 'card',
  },
  {
    id: 'start_reputation',
    level: 3,
    name: 'Neighborhood Flyer',
    description: 'Start each run with +6 max HP.',
    emoji: '💛',
    kind: 'bonus',
  },
  {
    id: 'species_chameleon',
    level: 4,
    name: 'Quick Shed',
    description: 'Removing a card in the shop costs 50 gold.',
    emoji: '🦎',
    kind: 'bonus',
  },
  {
    id: 'start_gold',
    level: 4,
    name: 'Community Jar',
    description: 'Start each run with +12 gold.',
    emoji: '🪙',
    kind: 'bonus',
  },
  {
    id: 'species_hamster',
    level: 5,
    name: 'Broth',
    description: 'Start each run with a heal potion.',
    emoji: '🐹',
    kind: 'bonus',
  },
  {
    id: 'start_kennel',
    level: 6,
    name: 'Extra Kennel Permit',
    description: 'Start each run with +4 max HP.',
    emoji: '🏠',
    kind: 'bonus',
  },
  {
    id: 'species_ferret',
    level: 7,
    name: 'Ferret Bite',
    description: 'A poison skill joins card rewards.',
    emoji: '🦡',
    kind: 'card',
  },
  {
    id: 'start_energy',
    level: 8,
    name: 'Volunteer Roster',
    description: 'Gain +1 energy on turn 1 of each combat.',
    emoji: '⚡',
    kind: 'bonus',
  },
  {
    id: 'morning_delivery',
    level: 9,
    name: 'Morning Delivery',
    description: 'Heal 3 HP at the start of each combat.',
    emoji: '📦',
    kind: 'bonus',
  },
];

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

export function hasUnlock(unlocks: string[] = [], id: UnlockId): boolean {
  return unlocks.includes(id);
}

export interface XpBreakdown {
  total: number;
  parts: { label: string; amount: number }[];
}

export function computeRunXp(input: {
  won: boolean;
  act: number;
  floors: number;
  elitesWon: number;
}): XpBreakdown {
  const parts: { label: string; amount: number }[] = [];
  parts.push({ label: 'Run finished', amount: 25 });
  if (input.floors > 0) parts.push({ label: 'Rooms cleared', amount: input.floors * 3 });
  if (input.elitesWon > 0) parts.push({ label: 'Elites', amount: input.elitesWon * 12 });
  if (input.act >= 2) parts.push({ label: 'Reached Act 2', amount: 20 });
  if (input.act >= 3) parts.push({ label: 'Reached Act 3', amount: 25 });
  if (input.won) parts.push({ label: 'Victory', amount: 70 });
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
