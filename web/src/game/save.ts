import { eventById } from './generators';
import type { DayEvent, RunState } from './types';

const PROFILE_KEY = 'pawfect.profile.v1';
const RUN_KEY = 'pawfect.run.v1';

export interface UserProfile {
  version: 1;
  name: string;
  createdAt: number;
  updatedAt: number;
  stats: {
    seasonsStarted: number;
    seasonsWon: number;
    seasonsLost: number;
    totalAdoptions: number;
    totalReturns: number;
    bestReputation: number;
    bestAdoptionsInSeason: number;
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
    stats: {
      seasonsStarted: 0,
      seasonsWon: 0,
      seasonsLost: 0,
      totalAdoptions: 0,
      totalReturns: 0,
      bestReputation: 0,
      bestAdoptionsInSeason: 0,
    },
  };
}

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return defaultProfile();
    const parsed = JSON.parse(raw) as UserProfile;
    if (parsed?.version !== 1) return defaultProfile();
    return {
      ...defaultProfile(),
      ...parsed,
      stats: { ...defaultProfile().stats, ...parsed.stats },
    };
  } catch {
    return defaultProfile();
  }
}

export function saveProfile(profile: UserProfile): void {
  profile.updatedAt = Date.now();
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
