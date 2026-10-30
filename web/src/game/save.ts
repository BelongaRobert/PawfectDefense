import {
  estimateLegacyXp,
  grantXp,
  levelFromXp,
  unlocksForLevel,
  type UnlockDef,
  type XpBreakdown,
  computeRunXp,
} from './progression';
import {
  createAccount,
  getSessionPassword,
  getSessionUsername,
  importRestoreCode,
  loginAccount,
  persistAccount,
  rememberPassword,
} from './account';
import type { RunState } from './types';

const PROFILE_KEY = 'pawfect.profile.v1';
const RUN_KEY = 'pawfect.run.v1';

function profileKey(): string {
  const user = getSessionUsername();
  return user ? `${PROFILE_KEY}.${user}` : PROFILE_KEY;
}

function runKey(): string {
  const user = getSessionUsername();
  return user ? `${RUN_KEY}.${user}` : RUN_KEY;
}

export function isLoggedIn(): boolean {
  return !!getSessionUsername();
}

/** Old guest saves lived in localStorage. Guests are visit-only now. */
export function purgeLegacyGuestSaves(): void {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(RUN_KEY);
}

function syncVault(profile: UserProfile): void {
  if (!isLoggedIn()) return;
  const password = getSessionPassword();
  if (!password) return;
  const runJson = localStorage.getItem(runKey());
  void persistAccount(profile, runJson, password);
}

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
    bestAct: number;
    elitesDefeated: number;
  };
}

interface SavedRun {
  version: 2;
  savedAt: number;
  run: RunState;
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
      bestAct: 0,
      elitesDefeated: 0,
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
  if (!isLoggedIn()) return defaultProfile();
  try {
    const raw = localStorage.getItem(profileKey());
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
  if (!isLoggedIn()) return;
  localStorage.setItem(profileKey(), JSON.stringify(profile));
  syncVault(profile);
}

export function setProfileName(profile: UserProfile, name: string): UserProfile {
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
    act: run.act,
    floors: run.floors,
    elitesWon: run.elitesWon,
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
  profile.stats.bestAct = Math.max(profile.stats.bestAct || 0, run.act || 1);
  profile.stats.elitesDefeated = (profile.stats.elitesDefeated || 0) + (run.elitesWon || 0);
  saveProfile(profile);
  return profile;
}

export function saveRun(run: RunState): void {
  if (!isLoggedIn()) return;
  if (run.phase === 'title' || run.phase === 'ended') {
    clearRun();
    return;
  }
  localStorage.setItem(runKey(), serializeRun(run));
  syncVault(loadProfile());
}

export function serializeRun(run: RunState): string {
  const payload: SavedRun = {
    version: 2,
    savedAt: Date.now(),
    run,
  };
  return JSON.stringify(payload);
}

export function loadRun(): RunState | null {
  if (!isLoggedIn()) return null;
  try {
    const raw = localStorage.getItem(runKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedRun;
    if (parsed?.version !== 2 || !parsed.run?.phase || !parsed.run.deck || !parsed.run.map) return null;
    return parsed.run;
  } catch {
    return null;
  }
}

export function clearRun(): void {
  if (!isLoggedIn()) return;
  localStorage.removeItem(runKey());
  syncVault(loadProfile());
}

export function applyAccountPayload(profileRaw: unknown, runJson: string | null): UserProfile {
  const profile = normalizeProfile((profileRaw || {}) as Partial<UserProfile>);
  localStorage.setItem(profileKey(), JSON.stringify(profile));
  if (runJson) localStorage.setItem(runKey(), runJson);
  else localStorage.removeItem(runKey());
  return profile;
}

export async function registerAccount(
  username: string,
  password: string,
  liveProfile: UserProfile,
  liveRun: RunState | null,
): Promise<{ ok: true; username: string } | { ok: false; error: string }> {
  const profile = normalizeProfile(liveProfile);
  const runJson =
    liveRun && liveRun.phase !== 'title' && liveRun.phase !== 'ended' ? serializeRun(liveRun) : null;
  const result = await createAccount(username, password, profile, runJson);
  if (!result.ok) return result;
  localStorage.setItem(profileKey(), JSON.stringify(profile));
  if (runJson) localStorage.setItem(runKey(), runJson);
  if (!profile.name.trim()) {
    profile.name = result.username;
  }
  saveProfile(profile);
  return result;
}

export async function signInAccount(
  username: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await loginAccount(username, password);
  if (!result.ok) return result;
  applyAccountPayload(result.profile, result.runJson);
  return { ok: true };
}

export async function restoreAccount(
  code: string,
  password: string,
): Promise<{ ok: true; username: string } | { ok: false; error: string }> {
  const imported = await importRestoreCode(code, password);
  if (!imported.ok) return imported;
  const result = await loginAccount(imported.username, password);
  if (!result.ok) return result;
  applyAccountPayload(result.profile, result.runJson);
  return { ok: true, username: imported.username };
}

export async function unlockAccountBackup(
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = getSessionUsername();
  if (!user) return { ok: false, error: 'Sign in first.' };
  const remembered = await rememberPassword(user, password);
  if (!remembered.ok) return remembered;
  syncVault(loadProfile());
  return { ok: true };
}

export function hasContinue(): boolean {
  if (!isLoggedIn()) return false;
  const run = loadRun();
  return !!run && run.phase !== 'title' && run.phase !== 'ended';
}

export function continueSummary(): { act: number; hp: number; gold: number } | null {
  if (!isLoggedIn()) return null;
  const run = loadRun();
  if (!run || run.phase === 'title' || run.phase === 'ended') return null;
  return { act: run.act, hp: run.combat?.player.hp ?? run.hp, gold: run.gold };
}

purgeLegacyGuestSaves();
