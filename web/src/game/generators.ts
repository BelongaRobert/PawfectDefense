import { ADOPTER_NAMES, PET_NAMES, RELIC_POOL } from './content';
import { chance, id, mulberry32, pick } from './rng';
import { traitKeys } from './match';
import type {
  Adopter,
  DayEvent,
  Energy,
  Pet,
  PetTraits,
  Relic,
  RunState,
  Size,
  Species,
} from './types';
import { SPECIES_EMOJI } from './types';
import { STARTER_SPECIES } from './progression';

const SIZES: Size[] = ['S', 'M', 'L'];
const ENERGIES: Energy[] = ['calm', 'moderate', 'high'];
const SMALLISH: Species[] = ['bird', 'rabbit', 'hamster', 'ferret', 'chameleon'];

function randomTraits(rng: () => number): PetTraits {
  return {
    kidFriendly: chance(rng, 0.55),
    allergySafe: chance(rng, 0.35),
    needsYard: chance(rng, 0.35),
    trained: chance(rng, 0.4),
    specialNeeds: chance(rng, 0.18),
  };
}

export interface MetaBonuses {
  species: Species[];
  supplies: number;
  capacity: number;
  reputation: number;
  maxEnergy: number;
  gold: number;
  morningSupplies: number;
}

export function createRun(seed = Date.now() % 1e9, meta?: Partial<MetaBonuses>): RunState {
  const species = meta?.species?.length ? meta.species : [...STARTER_SPECIES];
  const rng = mulberry32(seed);
  const starter = generatePet(rng, true, species);
  starter.stress = 0;
  const maxEnergy = 3 + (meta?.maxEnergy || 0);
  return {
    day: 1,
    maxDays: 10,
    phase: 'title',
    capacity: 4 + (meta?.capacity || 0),
    supplies: 8 + (meta?.supplies || 0),
    energy: maxEnergy,
    maxEnergy,
    reputation: 55 + (meta?.reputation || 0),
    gold: 20 + (meta?.gold || 0),
    adoptions: 0,
    returns: 0,
    pets: [starter],
    intake: [],
    adopters: [],
    relics: [],
    pendingEvent: null,
    pendingRelics: [],
    log: [{ text: `${starter.name} the ${starter.species} is waiting for a home.`, tone: 'good' }],
    seed,
    viralBoost: false,
    fosterSlots: 0,
    freeTreatUsed: false,
    endless: false,
    seasonRecorded: false,
    statsBankedAdoptions: 0,
    statsBankedReturns: 0,
    metaSpecies: species,
    xpAwarded: 0,
    morningSupplies: meta?.morningSupplies || 0,
  };
}

export function generatePet(rng: () => number, gentle = false, speciesPool: Species[] = STARTER_SPECIES): Pet {
  const pool = speciesPool.length ? speciesPool : STARTER_SPECIES;
  const species = pick(rng, pool);
  const size = SMALLISH.includes(species) ? pick(rng, ['S', 'M'] as Size[]) : pick(rng, SIZES);
  const energy = gentle ? pick(rng, ['calm', 'moderate'] as Energy[]) : pick(rng, ENERGIES);
  const traits = randomTraits(rng);
  if (gentle) {
    traits.specialNeeds = false;
    traits.kidFriendly = true;
  }
  if (size === 'L') traits.needsYard = traits.needsYard || chance(rng, 0.5);
  return {
    id: id('pet', rng),
    name: pick(rng, PET_NAMES),
    species,
    size,
    energy,
    traits,
    stress: chance(rng, 0.2) ? 1 : 0,
    daysHeld: 0,
    emoji: SPECIES_EMOJI[species],
    fedToday: gentle,
    treatBoost: false,
  };
}

export function generateAdopter(
  rng: () => number,
  harder: boolean,
  speciesPool: Species[] = STARTER_SPECIES,
): Adopter {
  const pool = speciesPool.length ? speciesPool : STARTER_SPECIES;
  const keys = traitKeys();
  const shuffle = [...keys].sort(() => rng() - 0.5);
  const mustCount = harder ? 2 : chance(rng, 0.5) ? 1 : 0;
  const niceCount = harder ? 2 : 1;
  const dealCount = chance(rng, harder ? 0.55 : 0.35) ? 1 : 0;

  const must = shuffle.slice(0, mustCount);
  const nice = shuffle.slice(mustCount, mustCount + niceCount).filter((k) => !must.includes(k));
  const dealbreakers = shuffle
    .slice(mustCount + niceCount)
    .filter((k) => !must.includes(k) && !nice.includes(k))
    .slice(0, dealCount);

  // Prefer dealbreaker specialNeeds often (realistic)
  if (dealCount && chance(rng, 0.4) && !must.includes('specialNeeds')) {
    dealbreakers[0] = 'specialNeeds';
  }

  const home = pick(rng, ['apartment', 'house', 'farm'] as const);
  return {
    id: id('ad', rng),
    name: pick(rng, ADOPTER_NAMES),
    emoji: pick(rng, ['🧑', '👩', '👨', '🧓', '🧔']),
    patience: harder ? 0 : chance(rng, 0.4) ? 1 : 0,
    prefs: {
      species: chance(rng, 0.75) ? pick(rng, pool) : undefined,
      size: chance(rng, 0.55) ? pick(rng, SIZES) : undefined,
      energy: chance(rng, 0.5) ? pick(rng, ENERGIES) : undefined,
      home,
      must,
      nice,
      dealbreakers,
    },
  };
}

export function generateIntake(state: RunState): Pet[] {
  const rng = mulberry32(state.seed + state.day * 97);
  let count = state.day <= 2 ? 1 : chance(rng, 0.35) ? 2 : 1;
  if (state.endless) {
    count = chance(rng, 0.45) ? 3 : 2;
  }
  const pool = state.metaSpecies?.length ? state.metaSpecies : STARTER_SPECIES;
  return Array.from({ length: count }, () => generatePet(rng, state.day === 1, pool));
}

export function generateAdopters(state: RunState): Adopter[] {
  const rng = mulberry32(state.seed + state.day * 191 + 3);
  const harder = state.day >= 6 || state.viralBoost || state.endless;
  const base = state.day <= 3 ? 2 : 3;
  const extra = (state.viralBoost ? 1 : 0) + (state.endless && state.day >= 15 ? 1 : 0);
  const pool = state.metaSpecies?.length ? state.metaSpecies : STARTER_SPECIES;
  return Array.from({ length: base + extra }, () => generateAdopter(rng, harder, pool));
}

export function availableRelics(state: RunState): Relic[] {
  const owned = new Set(state.relics.map((r) => r.id));
  return RELIC_POOL.filter((r) => !owned.has(r.id));
}

export function makeDayEvent(state: RunState): DayEvent | null {
  const rng = mulberry32(state.seed + state.day * 313 + 9);
  if (state.day === 1) return null;
  if (state.day === 5 || state.day === 9 || (state.endless && state.day % 5 === 0)) {
    return inspectionEvent();
  }
  if (!chance(rng, state.endless ? 0.85 : 0.7)) return null;

  const pool: DayEvent[] = [
    donationEvent(),
    illnessEvent(),
    viralEvent(),
    volunteerEvent(),
  ];
  return pick(rng, pool);
}

export function donationEvent(): DayEvent {
  return {
    id: 'donation',
    title: 'Donation Drive',
    emoji: '🎁',
    body: 'Neighbors drop off bags of food and a few bills.',
    choices: [
      {
        id: 'take',
        label: 'Accept gratefully (+6 supplies, +8 gold)',
        apply: (s) => {
          s.supplies += 6;
          s.gold += 8;
          return 'Stockroom looks healthier already.';
        },
      },
      {
        id: 'share',
        label: 'Share surplus with fosters (+4 rep)',
        apply: (s) => {
          s.reputation = clampRep(s.reputation + 4);
          return 'The foster network notices your generosity.';
        },
      },
    ],
  };
}

export function illnessEvent(): DayEvent {
  return {
    id: 'illness',
    title: 'Mystery Sniffles',
    emoji: '🤒',
    body: 'One kennel has been sneezing. You can spend supplies now or risk a reputation scare.',
    choices: [
      {
        id: 'treat_all',
        label: 'Quarantine & treat (−3 supplies, −stress)',
        apply: (s) => {
          if (s.supplies < 3) {
            s.reputation = clampRep(s.reputation - 6);
            return 'Not enough supplies — rumor spreads (−6 rep).';
          }
          s.supplies -= 3;
          for (const p of s.pets) p.stress = Math.max(0, p.stress - 1) as Pet['stress'];
          return 'Everyone gets a check-up. Stress eases.';
        },
      },
      {
        id: 'wait',
        label: 'Wait and see',
        apply: (s) => {
          if (s.pets[0]) s.pets[0].stress = Math.min(3, s.pets[0].stress + 1) as Pet['stress'];
          s.reputation = clampRep(s.reputation - 3);
          return 'A worried visitor leaves a chilly review (−3 rep).';
        },
      },
    ],
  };
}

export function viralEvent(): DayEvent {
  return {
    id: 'viral',
    title: 'Viral Shelter Post',
    emoji: '✨',
    body: 'A clip of playtime explodes online. Tomorrow will be busy — and picky.',
    choices: [
      {
        id: 'lean_in',
        label: 'Lean in (+rep, viral tomorrow)',
        apply: (s) => {
          s.reputation = clampRep(s.reputation + 5);
          s.viralBoost = true;
          return 'Inboxes flood. Tomorrow’s adopters are numerous and choosy.';
        },
      },
      {
        id: 'quiet',
        label: 'Keep it quiet (+2 supplies)',
        apply: (s) => {
          s.supplies += 2;
          return 'You protect the pets’ rest. A sponsor still sends treats.';
        },
      },
    ],
  };
}

export function volunteerEvent(): DayEvent {
  return {
    id: 'volunteer',
    title: 'Weekend Volunteers',
    emoji: '🧹',
    body: 'A college club offers free hands for an afternoon.',
    choices: [
      {
        id: 'energy',
        label: 'Put them on care duty (+2 energy today)',
        apply: (s) => {
          s.energy += 2;
          return 'Staff get a real break. +2 energy.';
        },
      },
      {
        id: 'train',
        label: 'Ask them to train (+trained on 1 pet)',
        apply: (s) => {
          const target = s.pets.find((p) => !p.traits.trained) ?? s.pets[0];
          if (target) {
            target.traits.trained = true;
            return `${target.name} picks up sit & stay.`;
          }
          return 'Kennels are empty — volunteers fold towels instead.';
        },
      },
    ],
  };
}

export function inspectionEvent(): DayEvent {
  return {
    id: 'inspection',
    title: 'City Inspection',
    emoji: '📋',
    body: 'An inspector tours the kennels. Critical stress will not impress them.',
    choices: [
      {
        id: 'tour',
        label: 'Open the doors',
        apply: (s) => {
          const critical = s.pets.filter((p) => p.stress >= 3).length;
          if (critical > 0) {
            s.reputation = clampRep(s.reputation - 12 - critical * 4);
            return `They cite ${critical} critical case(s). Reputation tanks.`;
          }
          s.reputation = clampRep(s.reputation + 8);
          s.gold += 10;
          return 'Spotless enough. +8 reputation and a small grant (+10 gold).';
        },
      },
    ],
  };
}

/** Rebuild a pending event after load (functions can't live in JSON). */
export function eventById(id: string): DayEvent | null {
  switch (id) {
    case 'donation':
      return donationEvent();
    case 'illness':
      return illnessEvent();
    case 'viral':
      return viralEvent();
    case 'volunteer':
      return volunteerEvent();
    case 'inspection':
      return inspectionEvent();
    default:
      return null;
  }
}

export function clampRep(n: number): number {
  return Math.max(0, Math.min(100, n));
}

export function effectiveCapacity(state: RunState): number {
  return state.capacity + state.fosterSlots;
}
