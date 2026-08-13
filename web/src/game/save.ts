import {
  estimateLegacyXp,
  grantXp,
  levelFromXp,
  unlocksForLevel,
  type UnlockDef,
  type XpBreakdown,
  computeRunXp,
} from './progression';
import { eventById } from './generators';
import type { DayEvent, RunState, Species } from './types';

const PROFILE_KEY = 'pawfect.profile.v1';
const RUN_KEY = 'pawfect.run.v1';

export interface UserProfile {
  version: 1;
  name: string;
  createdAt: number;
  updatedAt: number;
  xp: number;
  level: number;
  unlocks: string[];
  /** UI flash after a run — cleared when read. */
  lastReward?: {
    xp: number;
    parts: { label: string; amount: number }[];
    newUnlocks: UnlockDef[];
  };
  stats: {
    seasonsStarted: number;
    seasonsWon: number;
    seasonsLost: number;
    totalAdoptions: number;
    totalReturns: number;
    bestReputation: number;
    bestAdoptionsInSeason: number;
    endlessBestDay: number;
  };
}

interface SerializableRun {
  day: number;
  maxDays: number;
  phase: RunState['phase'];
  capacity: number;
  supplies: number;
  energy: number;
  maxEnergy: number;
  reputation: number;
  gold: number;
  adoptions: number;
  returns: number;
  pets: RunState['pets'];
  intake: RunState['intake'];
  adopters: RunState['adopters'];
  relics: RunState['relics'];
  pendingRelics: RunState['pendingRelics'];
  log: RunState['log'];
  seed: number;
  endReason?: string;
  won?: boolean;
  viralBoost: boolean;
  fosterSlots: number;
  freeTreatUsed: boolean;
  endless: boolean;
  seasonRecorded: boolean;
  statsBankedAdoptions: number;
  statsBankedReturns: number;
  metaSpecies: Species[];
  xpAwarded: number;
  pendingEventId: string | null;
}

interface SavedRun {
  version: 1;
  savedAt: number;
  run: SerializableRun;
}

export function defaultProfile(): UserProfile {
  return {
    version: 1,
    name: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    xp: 0,
    level: 1,
    unlocks: [],
    stats: {
      seasonsStarted: 0,
      seasonsWon: 0,
      seasonsLost: 0,
      totalAdoptions: 0,
      totalReturns: 0,
      bestReputation: 0,
      bestAdoptionsInSeason: 0,
      endlessBestDay: 0,
    },
  };
}

function normalizeProfile(parsed: Partial<UserProfile>): UserProfile {
  const base = defaultProfile();
  const profile: UserProfile = {
    ...base,
    ...parsed,
    stats: { ...base.stats, ...(parsed.stats || {}) },
    unlocks: [...(parsed.unlocks || [])],
    xp: parsed.xp ?? 0,
    level: parsed.level ?? 1,
  };

  // Catch-up for saves from before leveling existed
  if (parsed.xp == null && (profile.stats.seasonsStarted > 0 || profile.stats.totalAdoptions > 0)) {
    profile.xp = estimateLegacyXp(profile.stats);
  }

  profile.level = levelFromXp(profile.xp);
  for (const u of unlocksForLevel(profile.level)) {
    if (!profile.unlocks.includes(u.id)) profile.unlocks.push(u.id);
  }
  return profile;
}

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return defaultProfile();
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    if (parsed?.version !== 1) return defaultProfile();
    return normalizeProfile(parsed);
  } catch {
    return defaultProfile();
  }
}

export function saveProfile(profile: UserProfile): void {
  profile.updatedAt = Date.now();
  profile.level = levelFromXp(profile.xp || 0);
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function setProfileName(name: string): UserProfile {
  const profile = loadProfile();
  profile.name = name.trim().slice(0, 24);
  saveProfile(profile);
  return profile;
}

export function recordSeasonStart(profile: UserProfile): UserProfile {
  profile.stats.seasonsStarted += 1;
  saveProfile(profile);
  return profile;
}

export function applyRunXp(
  profile: UserProfile,
  run: RunState,
): { profile: UserProfile; breakdown: XpBreakdown; granted: number; newUnlocks: UnlockDef[] } {
  const breakdown = computeRunXp({
    won: !!run.won,
    adoptions: run.adoptions,
    day: run.day,
    maxDays: run.maxDays,
    endless: !!run.endless,
    reputation: run.reputation,
  });
  const already = run.xpAwarded || 0;
  const granted = Math.max(0, breakdown.total - already);
  const newUnlocks = granted > 0 ? grantXp(profile, granted) : [];
  run.xpAwarded = breakdown.total;
  if (granted > 0 || newUnlocks.length) {
    profile.lastReward = {
      xp: granted,
      parts: breakdown.parts,
      newUnlocks,
    };
  }
  saveProfile(profile);
  return { profile, breakdown, granted, newUnlocks };
}

export function clearLastReward(profile: UserProfile): UserProfile {
  delete profile.lastReward;
  saveProfile(profile);
  return profile;
}

export function recordSeasonEnd(profile: UserProfile, run: RunState): UserProfile {
  if (run.won) profile.stats.seasonsWon += 1;
  else profile.stats.seasonsLost += 1;
  profile.stats.totalAdoptions += run.adoptions;
  profile.stats.totalReturns += run.returns;
  profile.stats.bestReputation = Math.max(profile.stats.bestReputation, run.reputation);
  profile.stats.bestAdoptionsInSeason = Math.max(
    profile.stats.bestAdoptionsInSeason,
    run.adoptions,
  );
  run.statsBankedAdoptions = run.adoptions;
  run.statsBankedReturns = run.returns;
  if (run.endless || run.day > run.maxDays) {
    profile.stats.endlessBestDay = Math.max(profile.stats.endlessBestDay, run.day);
  }
  // XP is awarded once at final end / victory — victory awards XP; endless banks later
  saveProfile(profile);
  return profile;
}

/** Bank adoption/return deltas + bests after endless continue (no extra win/loss). */
export function bankEndlessProgress(profile: UserProfile, run: RunState): UserProfile {
  const dAdopt = Math.max(0, run.adoptions - (run.statsBankedAdoptions || 0));
  const dReturn = Math.max(0, run.returns - (run.statsBankedReturns || 0));
  profile.stats.totalAdoptions += dAdopt;
  profile.stats.totalReturns += dReturn;
  profile.stats.bestReputation = Math.max(profile.stats.bestReputation, run.reputation);
  profile.stats.bestAdoptionsInSeason = Math.max(
    profile.stats.bestAdoptionsInSeason,
    run.adoptions,
  );
  profile.stats.endlessBestDay = Math.max(profile.stats.endlessBestDay, run.day);
  run.statsBankedAdoptions = run.adoptions;
  run.statsBankedReturns = run.returns;
  saveProfile(profile);
  return profile;
}

export function saveRun(run: RunState): void {
  if (run.phase === 'title' || run.phase === 'ended') {
    clearRun();
    return;
  }
  const payload: SavedRun = {
    version: 1,
    savedAt: Date.now(),
    run: {
      day: run.day,
      maxDays: run.maxDays,
      phase: run.phase,
      capacity: run.capacity,
      supplies: run.supplies,
      energy: run.energy,
      maxEnergy: run.maxEnergy,
      reputation: run.reputation,
      gold: run.gold,
      adoptions: run.adoptions,
      returns: run.returns,
      pets: run.pets,
      intake: run.intake,
      adopters: run.adopters,
      relics: run.relics,
      pendingRelics: run.pendingRelics,
      log: run.log,
      seed: run.seed,
      endReason: run.endReason,
      won: run.won,
      viralBoost: run.viralBoost,
      fosterSlots: run.fosterSlots,
      freeTreatUsed: run.freeTreatUsed,
      endless: !!run.endless,
      seasonRecorded: !!run.seasonRecorded,
      statsBankedAdoptions: run.statsBankedAdoptions || 0,
      statsBankedReturns: run.statsBankedReturns || 0,
      metaSpecies: run.metaSpecies?.length ? run.metaSpecies : ['dog', 'cat'],
      xpAwarded: run.xpAwarded || 0,
      pendingEventId: run.pendingEvent?.id ?? null,
    },
  };
  localStorage.setItem(RUN_KEY, JSON.stringify(payload));
}

export function loadRun(): RunState | null {
  try {
    const raw = localStorage.getItem(RUN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedRun;
    if (parsed?.version !== 1 || !parsed.run) return null;
    const { pendingEventId, ...rest } = parsed.run;
    let pendingEvent: DayEvent | null = null;
    let phase = rest.phase;
    if (pendingEventId) {
      pendingEvent = eventById(pendingEventId);
      if (!pendingEvent && phase === 'event') {
        phase = 'summary';
      }
    }
    return {
      ...rest,
      endless: !!rest.endless,
      seasonRecorded: !!rest.seasonRecorded,
      statsBankedAdoptions: rest.statsBankedAdoptions || 0,
      statsBankedReturns: rest.statsBankedReturns || 0,
      metaSpecies: rest.metaSpecies?.length ? rest.metaSpecies : ['dog', 'cat'],
      xpAwarded: rest.xpAwarded || 0,
      phase,
      pendingEvent,
    };
  } catch {
    return null;
  }
}

export function clearRun(): void {
  localStorage.removeItem(RUN_KEY);
}

export function hasContinue(): boolean {
  const run = loadRun();
  return !!run && run.phase !== 'title' && run.phase !== 'ended';
}

export function continueSummary(): { day: number; reputation: number; adoptions: number } | null {
  const run = loadRun();
  if (!run || run.phase === 'title' || run.phase === 'ended') return null;
  return { day: run.day, reputation: run.reputation, adoptions: run.adoptions };
}
