export type Species = 'dog' | 'cat' | 'rabbit' | 'bird' | 'chameleon' | 'hamster' | 'ferret';
export type Size = 'S' | 'M' | 'L';
export type Energy = 'calm' | 'moderate' | 'high';
export type HomeType = 'apartment' | 'house' | 'farm';
export type Phase =
  | 'title'
  | 'intake'
  | 'care'
  | 'adoption'
  | 'event'
  | 'relic'
  | 'summary'
  | 'victory'
  | 'ended';

export type Stress = 0 | 1 | 2 | 3;

export interface PetTraits {
  kidFriendly: boolean;
  allergySafe: boolean;
  needsYard: boolean;
  trained: boolean;
  specialNeeds: boolean;
}

export interface Pet {
  id: string;
  name: string;
  species: Species;
  size: Size;
  energy: Energy;
  traits: PetTraits;
  stress: Stress;
  daysHeld: number;
  emoji: string;
  /** Fed during today's care shift — skips overnight hunger stress. */
  fedToday: boolean;
  /** Treat this visit — adopters score the pet higher and pay a bit more. */
  treatBoost: boolean;
  /** Colony intake group — accept 3–4 pocket pets into one kennel. */
  groupId?: string;
}

export interface AdopterPrefs {
  species?: Species;
  size?: Size;
  energy?: Energy;
  home: HomeType;
  must: (keyof PetTraits)[];
  nice: (keyof PetTraits)[];
  dealbreakers: (keyof PetTraits)[];
}

export interface Adopter {
  id: string;
  name: string;
  prefs: AdopterPrefs;
  patience: number;
  emoji: string;
  matchedPetId?: string;
  result?: MatchGrade;
}

export type MatchGrade = 'perfect' | 'good' | 'stretch' | 'bad';

export interface Relic {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

export interface DayEvent {
  id: string;
  title: string;
  body: string;
  emoji: string;
  choices: EventChoice[];
}

export interface EventChoice {
  id: string;
  label: string;
  apply: (state: RunState) => string;
}

export interface LogLine {
  text: string;
  tone?: 'good' | 'bad' | 'neutral';
}

export interface RunState {
  day: number;
  maxDays: number;
  phase: Phase;
  capacity: number;
  supplies: number;
  energy: number;
  maxEnergy: number;
  reputation: number;
  gold: number;
  adoptions: number;
  returns: number;
  pets: Pet[];
  intake: Pet[];
  adopters: Adopter[];
  relics: Relic[];
  pendingEvent: DayEvent | null;
  pendingRelics: Relic[];
  log: LogLine[];
  seed: number;
  endReason?: string;
  won?: boolean;
  viralBoost: boolean;
  fosterSlots: number;
  freeTreatUsed: boolean;
  /** Past the Day 10 season — keep going until you retire or collapse. */
  endless: boolean;
  /** Career win already written when the congratulations screen appeared. */
  seasonRecorded: boolean;
  /** Adoptions/returns already banked into the profile (for endless deltas). */
  statsBankedAdoptions: number;
  statsBankedReturns: number;
  /** Species unlocked for this run (frozen at season start). */
  metaSpecies: Species[];
  /** Shelter XP already granted this run (victory may award before endless). */
  xpAwarded: number;
  /** Extra supplies delivered each morning (meta unlock). */
  morningSupplies: number;
}

export const TRAIT_LABELS: Record<keyof PetTraits, string> = {
  kidFriendly: 'Kid-friendly',
  allergySafe: 'Allergy-safe',
  needsYard: 'Needs yard',
  trained: 'Trained',
  specialNeeds: 'Special needs',
};

export const SPECIES_EMOJI: Record<Species, string> = {
  dog: '🐕',
  cat: '🐈',
  rabbit: '🐇',
  bird: '🦜',
  chameleon: '🦎',
  hamster: '🐹',
  ferret: '🦡',
};

export const SPECIES_LABELS: Record<Species, string> = {
  dog: 'dog',
  cat: 'cat',
  rabbit: 'rabbit',
  bird: 'bird',
  chameleon: 'chameleon',
  hamster: 'hamster',
  ferret: 'ferret',
};
