import {
  availableRelics,
  clampRep,
  createRun,
  effectiveCapacity,
  generateAdopters,
  generateIntake,
  makeDayEvent,
} from './generators';
import { scoreMatch } from './match';
import { mulberry32, pick } from './rng';
import { hasUnlock, unlockedSpecies } from './progression';
import {
  applyRunXp,
  clearRun,
  loadProfile,
  loadRun,
  recordSeasonEnd,
  recordSeasonStart,
  bankEndlessProgress,
  saveProfile,
  saveRun,
  setProfileName,
  type UserProfile,
} from './save';
import type { Adopter, LogLine, MatchGrade, Pet, Relic, RunState, Stress } from './types';

type Listener = () => void;

let state: RunState = { ...createRun(), phase: 'title', pets: [], log: [] };
let profile: UserProfile = loadProfile();
let saveFlash = '';
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

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(opts?: { persist?: boolean; flash?: string }): void {
  if (opts?.flash) saveFlash = opts.flash;
  if (opts?.persist !== false && state.phase !== 'title') {
    if (state.phase === 'ended') clearRun();
    else {
      saveRun(state);
      if (!opts?.flash) saveFlash = 'Progress saved';
    }
  }
  for (const fn of listeners) fn();
}

function log(text: string, tone: LogLine['tone'] = 'neutral'): void {
  state.log = [{ text, tone }, ...state.log].slice(0, 12);
}

function hasRelic(id: string): boolean {
  return state.relics.some((r) => r.id === id);
}

function setStress(pet: Pet, value: number): void {
  pet.stress = Math.max(0, Math.min(3, value)) as Stress;
}

/** Boot title screen; does not auto-resume a run. */
export function bootToTitle(): void {
  profile = loadProfile();
  state = { ...createRun(), phase: 'title', pets: [], log: [] };
  saveFlash = '';
  emit({ persist: false });
}

export function updatePlayerName(name: string): void {
  profile = setProfileName(name);
  emit({ persist: false });
}

export function startRun(): void {
  if (!profile.name.trim()) {
    profile = setProfileName('Shelter Manager');
  }
  profile = loadProfile();
  profile = recordSeasonStart(profile);
  clearRun();
  state = createRun(Date.now() % 1e9, {
    species: unlockedSpecies(profile.unlocks),
    supplies: hasUnlock(profile.unlocks, 'start_supplies') ? 3 : 0,
    capacity: hasUnlock(profile.unlocks, 'start_kennel') ? 1 : 0,
    reputation: hasUnlock(profile.unlocks, 'start_reputation') ? 5 : 0,
    maxEnergy: hasUnlock(profile.unlocks, 'start_energy') ? 1 : 0,
    gold: hasUnlock(profile.unlocks, 'start_gold') ? 12 : 0,
    morningSupplies: hasUnlock(profile.unlocks, 'morning_delivery') ? 1 : 0,
  });
  beginDay();
  emit({ flash: 'New season — progress will auto-save' });
}

export function continueRun(): boolean {
  const saved = loadRun();
  if (!saved) return false;
  state = saved;
  log('Welcome back — shelter progress restored.', 'good');
  emit({ flash: 'Continue save loaded' });
  return true;
}

export function abandonRun(): void {
  clearRun();
  bootToTitle();
}

export function beginDay(): void {
  state.phase = 'intake';
  state.energy = state.maxEnergy + (hasRelic('treat_bowl') ? 1 : 0);
  const morningFood = (state.morningSupplies || 0) + (hasRelic('pantry_run') ? 2 : 0);
  if (morningFood > 0) {
    state.supplies += morningFood;
    log(`Morning delivery: +${morningFood} food.`, 'good');
  }
  state.intake = generateIntake(state);
  state.adopters = [];
  state.pendingEvent = null;
  state.pendingRelics = [];
  log(`Day ${state.day}: intake arrives.`, 'neutral');
  emit();
}

export function acceptIntake(petId: string): void {
  if (state.phase !== 'intake') return;
  const pet = state.intake.find((p) => p.id === petId);
  if (!pet) return;
  if (state.pets.length >= effectiveCapacity(state)) {
    log('No kennels free — turn someone away or free a space first.', 'bad');
    emit();
    return;
  }
  state.intake = state.intake.filter((p) => p.id !== petId);
  state.pets.push(pet);
  log(`Welcomed ${pet.name} ${pet.emoji}`, 'good');
  emit();
}

export function declineIntake(petId: string): void {
  if (state.phase !== 'intake') return;
  const pet = state.intake.find((p) => p.id === petId);
  if (!pet) return;
  state.intake = state.intake.filter((p) => p.id !== petId);
  state.reputation = clampRep(state.reputation - 2);
  log(`Turned away ${pet.name} (−2 rep). Hard, but capacity is real.`, 'bad');
  emit();
}

export function finishIntake(): void {
  if (state.phase !== 'intake') return;
  // Auto-decline leftovers with penalty
  while (state.intake.length) {
    const pet = state.intake[0]!;
    declineIntake(pet.id);
  }
  state.phase = 'care';
  log('Care shift begins. Feed to stop hunger, treats to wow adopters.', 'neutral');
  emit();
}

export type CareAction = 'feed' | 'play' | 'train' | 'treat';

export function doCare(petId: string, action: CareAction): void {
  if (state.phase !== 'care') return;
  const pet = state.pets.find((p) => p.id === petId);
  if (!pet) return;
  if (state.energy <= 0) {
    log('Staff are wiped. End care to open adoption hours.', 'bad');
    emit();
    return;
  }

  if (action === 'feed') {
    if (state.supplies < 1) {
      log('No food left. Restock with gold at the end of the day.', 'bad');
      emit();
      return;
    }
    state.supplies -= 1;
    state.energy -= 1;
    pet.fedToday = true;
    setStress(pet, pet.stress - 1);
    log(`Fed ${pet.name}. They won't go hungry overnight.`, 'good');
  } else if (action === 'play') {
    state.energy -= 1;
    setStress(pet, pet.stress - 1);
    log(`Played with ${pet.name}.`, 'good');
  } else if (action === 'train') {
    state.energy -= 1;
    pet.traits.trained = true;
    if (hasRelic('training_clicker')) setStress(pet, pet.stress - 1);
    log(`Trained ${pet.name}.`, 'good');
  } else if (action === 'treat') {
    const free = hasRelic('vet_voucher') && !state.freeTreatUsed;
    if (!free && state.supplies < 2) {
      log('Treats need 2 food.', 'bad');
      emit();
      return;
    }
    if (free) state.freeTreatUsed = true;
    else state.supplies -= 2;
    state.energy -= 1;
    pet.fedToday = true;
    pet.treatBoost = true;
    setStress(pet, 0);
    pet.traits.specialNeeds = false;
    log(`Treat for ${pet.name} — adopters will notice.`, 'good');
  }
  emit();
}

export function finishCare(): void {
  if (state.phase !== 'care') return;
  state.adopters = generateAdopters(state);
  state.phase = 'adoption';
  log(`${state.adopters.length} visitor(s) at the front desk.`, 'neutral');
  emit();
}

export function assignMatch(adopterId: string, petId: string): void {
  if (state.phase !== 'adoption') return;
  const adopter = state.adopters.find((a) => a.id === adopterId);
  const pet = state.pets.find((p) => p.id === petId);
  if (!adopter || !pet || adopter.matchedPetId) return;

  // Unassign if pet already promised to someone else this phase
  for (const a of state.adopters) {
    if (a.matchedPetId === petId) {
      a.matchedPetId = undefined;
      a.result = undefined;
    }
  }

  const { grade } = scoreMatch(pet, adopter, state.relics.map((r) => r.id));
  adopter.matchedPetId = petId;
  adopter.result = grade;
  emit();
}

export function clearMatch(adopterId: string): void {
  const adopter = state.adopters.find((a) => a.id === adopterId);
  if (!adopter) return;
  adopter.matchedPetId = undefined;
  adopter.result = undefined;
  emit();
}

function applyAdoption(adopter: Adopter, pet: Pet, grade: MatchGrade): void {
  let gold =
    grade === 'perfect' ? 18 : grade === 'good' ? 12 : grade === 'stretch' ? 7 : 0;
  if (pet.treatBoost && grade !== 'bad') gold += 5;
  let rep =
    grade === 'perfect' ? 8 : grade === 'good' ? 4 : grade === 'stretch' ? 1 : -8;
  if (grade === 'perfect' && hasRelic('adoption_camera')) rep += 3;

  if (grade === 'bad') {
    state.reputation = clampRep(state.reputation + rep);
    log(`${adopter.name} refuses ${pet.name} (${grade}).`, 'bad');
    adopter.matchedPetId = undefined;
    adopter.result = undefined;
    return;
  }

  state.pets = state.pets.filter((p) => p.id !== pet.id);
  state.gold += gold;
  state.reputation = clampRep(state.reputation + rep);
  state.adoptions += 1;

  const returnChance =
    grade === 'stretch' && !hasRelic('social_intern') ? 0.35 : grade === 'good' ? 0.05 : 0;

  if (returnChance > 0) {
    const rng = mulberry32(state.seed + state.day * 17 + pet.name.length);
    if (rng() < returnChance) {
      pet.daysHeld = 0;
      setStress(pet, Math.min(3, pet.stress + 1));
      state.pets.push(pet);
      state.adoptions -= 1;
      state.returns += 1;
      state.reputation = clampRep(state.reputation - 5);
      state.gold = Math.max(0, state.gold - Math.floor(gold / 2));
      log(`${pet.name} was returned the same evening. Heartbreaking (−5 rep).`, 'bad');
      return;
    }
  }

  log(`${pet.name} goes home with ${adopter.name}! (${grade}, +${gold}g)`, 'good');
}

export function finishAdoption(): void {
  if (state.phase !== 'adoption') return;

  for (const adopter of state.adopters) {
    if (!adopter.matchedPetId || !adopter.result) continue;
    const pet = state.pets.find((p) => p.id === adopter.matchedPetId);
    if (!pet) continue;
    applyAdoption(adopter, pet, adopter.result);
  }

  // Unmatched adopters leave mildly disappointed if shelter full of stressed pets
  const unmatched = state.adopters.filter((a) => !a.result || a.result === 'bad').length;
  if (unmatched >= 2 && state.pets.some((p) => p.stress >= 2)) {
    state.reputation = clampRep(state.reputation - 2);
    log('A few visitors leave without a match (−2 rep).', 'bad');
  }

  resolveEvening();
}

function resolveEvening(): void {
  state.viralBoost = false;
  state.freeTreatUsed = false;

  const soft = hasRelic('soft_blankets');
  const snack = hasRelic('night_snack');
  const rng = mulberry32(state.seed + state.day * 77 + 5);
  for (const pet of state.pets) {
    pet.daysHeld += 1;
    let bump = 0;
    if (!pet.fedToday) {
      if (!(snack && rng() < 0.5)) {
        bump += 1;
        log(`${pet.name} went to bed hungry.`, 'bad');
      }
    }
    if (pet.daysHeld >= 3) bump += 1;
    if (pet.traits.specialNeeds) bump += 1;
    if (state.pets.length > state.capacity) bump += 1;
    if (soft && bump > 0 && rng() < 0.25) bump -= 1;
    if (bump > 0) setStress(pet, pet.stress + bump);
    pet.fedToday = false;
    pet.treatBoost = false;
  }

  // Collapse check
  const full = state.pets.length >= state.capacity;
  const allCritical = state.pets.length > 0 && state.pets.every((p) => p.stress >= 3);
  if (full && allCritical) {
    endRun(false, 'The shelter collapsed under critical stress while full.');
    return;
  }

  if (state.reputation <= 0) {
    endRun(false, 'Reputation hit zero. The city shut you down.');
    return;
  }

  const event = makeDayEvent(state);
  if (event) {
    state.pendingEvent = event;
    state.phase = 'event';
    emit();
    return;
  }

  afterEventOrSkip();
}

export function chooseEvent(choiceId: string): void {
  if (state.phase !== 'event' || !state.pendingEvent) return;
  const choice = state.pendingEvent.choices.find((c) => c.id === choiceId);
  if (!choice) return;
  const msg = choice.apply(state);
  log(msg, 'neutral');
  state.pendingEvent = null;

  if (state.reputation <= 0) {
    endRun(false, 'Reputation hit zero after the event.');
    return;
  }
  afterEventOrSkip();
}

function afterEventOrSkip(): void {
  // Relic offer every 3rd day if pool remains
  if (state.day % 3 === 0) {
    const pool = availableRelics(state);
    if (pool.length) {
      const rng = mulberry32(state.seed + state.day * 41);
      const offers: Relic[] = [];
      const copy = [...pool];
      while (offers.length < 3 && copy.length) {
        const r = pick(rng, copy);
        offers.push(r);
        copy.splice(copy.indexOf(r), 1);
      }
      state.pendingRelics = offers;
      state.phase = 'relic';
      emit();
      return;
    }
  }
  goSummary();
}

export function pickRelic(relicId: string): void {
  if (state.phase !== 'relic') return;
  const relic = state.pendingRelics.find((r) => r.id === relicId);
  if (!relic) return;
  applyRelic(relic);
  state.pendingRelics = [];
  goSummary();
}

export function skipRelic(): void {
  if (state.phase !== 'relic') return;
  state.pendingRelics = [];
  goSummary();
}

function applyRelic(relic: Relic): void {
  state.relics.push(relic);
  if (relic.id === 'extra_kennel') state.capacity += 1;
  if (relic.id === 'foster_network') state.fosterSlots += 1;
  if (relic.id === 'welcome_sign') state.reputation = clampRep(state.reputation + 5);
  log(`Relic acquired: ${relic.name}`, 'good');
}

export function restockCost(): number {
  return hasRelic('bulk_buyer') ? 4 : 6;
}

/** Spend gold for 3 food at the end of the day. */
export function buySupplies(): void {
  if (state.phase !== 'summary') return;
  const cost = restockCost();
  if (state.gold < cost) {
    log(`Need ${cost} gold to restock food.`, 'bad');
    emit();
    return;
  }
  state.gold -= cost;
  state.supplies += 3;
  log(`Bought 3 food for ${cost} gold.`, 'good');
  emit({ flash: 'Pantry restocked' });
}

function goSummary(): void {
  state.phase = 'summary';
  emit();
}

export function advanceDay(): void {
  if (state.phase !== 'summary') return;

  // Season finale (Day 10) — win opens congratulations + Endless Mode
  if (!state.endless && state.day >= state.maxDays) {
    const won = state.reputation >= 40 && state.adoptions >= 6;
    if (won) {
      goToVictory();
      return;
    }
    endRun(
      false,
      `Season over, but you needed ≥6 adoptions and ≥40 rep (had ${state.adoptions} / ${state.reputation}).`,
    );
    return;
  }

  state.day += 1;
  beginDay();
}

function goToVictory(): void {
  state.won = true;
  state.phase = 'victory';
  state.endReason = `Season complete! ${state.adoptions} adoptions and reputation ${state.reputation}.`;
  if (!state.seasonRecorded) {
    profile = recordSeasonEnd(profile, state);
    state.seasonRecorded = true;
  }
  const reward = applyRunXp(profile, state);
  profile = reward.profile;
  const unlockMsg = reward.newUnlocks.length
    ? ` Unlocked: ${reward.newUnlocks.map((u) => u.name).join(', ')}.`
    : '';
  log(`Congratulations — season won. +${reward.granted} Shelter XP.${unlockMsg}`, 'good');
  emit({ flash: `+${reward.granted} XP · Level ${profile.level}` });
}

/** Keep playing past Day 10 with rising pressure. */
export function enterEndlessMode(): void {
  if (state.phase !== 'victory') return;
  state.endless = true;
  state.endReason = undefined;
  log('Endless Mode — keep the doors open as long as you can.', 'good');
  state.supplies += 3;
  state.gold += 10;
  state.day += 1;
  beginDay();
  emit({ flash: 'Endless Mode — progress still auto-saves' });
}

/** Leave the congratulations screen without endless. */
export function finishAfterVictory(): void {
  if (state.phase !== 'victory') return;
  state.phase = 'ended';
  clearRun();
  emit({ persist: false, flash: 'Season recorded to your profile' });
}

/** Retire during endless from the day summary. */
export function retireEndless(): void {
  if (!state.endless || state.phase !== 'summary') return;
  state.won = true;
  state.endReason = `Retired on Day ${state.day} in Endless Mode with ${state.adoptions} adoptions.`;
  profile = bankEndlessProgress(profile, state);
  const reward = applyRunXp(profile, state);
  profile = reward.profile;
  state.phase = 'ended';
  clearRun();
  emit({
    persist: false,
    flash: reward.granted ? `+${reward.granted} XP · Level ${profile.level}` : 'Endless run saved',
  });
}

function endRun(won: boolean, reason: string): void {
  state.won = won;
  state.endReason = reason;
  state.phase = 'ended';
  if (state.endless || state.seasonRecorded) {
    profile = bankEndlessProgress(profile, state);
  } else {
    profile = recordSeasonEnd(profile, state);
    state.seasonRecorded = true;
  }
  const reward = applyRunXp(profile, state);
  profile = reward.profile;
  clearRun();
  emit({
    persist: false,
    flash: reward.granted
      ? `+${reward.granted} XP · Level ${profile.level}`
      : 'Season recorded to your profile',
  });
}

export function saveCheckpoint(): void {
  if (state.phase === 'title' || state.phase === 'ended') return;
  saveRun(state);
  saveProfile(profile);
  emit({ persist: false, flash: 'Checkpoint saved' });
}

export function previewMatch(adopterId: string, petId: string) {
  const adopter = state.adopters.find((a) => a.id === adopterId);
  const pet = state.pets.find((p) => p.id === petId);
  if (!adopter || !pet) return null;
  return scoreMatch(pet, adopter, state.relics.map((r) => r.id));
}
