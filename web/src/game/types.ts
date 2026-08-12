export type Species = 'dog' | 'cat' | 'rabbit' | 'bird';
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
};
