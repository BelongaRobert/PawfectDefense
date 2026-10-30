export type Intent =
  | { kind: 'attack'; amount: number; hits: number }
  | { kind: 'block'; amount: number }
  | { kind: 'weak'; amount: number }
  | { kind: 'vulnerable'; amount: number }
  | { kind: 'strength'; amount: number }
  | { kind: 'poison'; amount: number };

export interface PhaseDef {
  atHp: number;
  gainStrength?: number;
  applyWeak?: number;
  pattern?: Intent[];
  summon?: string;
}

export interface EnemyDef {
  id: string;
  name: string;
  emoji: string;
  hp: number;
  pattern: Intent[];
  phase?: PhaseDef;
}

export interface EncounterDef {
  id: string;
  enemies: { defId: string; name?: string }[];
}

const atk = (amount: number, hits = 1): Intent => ({ kind: 'attack', amount, hits });
const blk = (amount: number): Intent => ({ kind: 'block', amount });
const weak = (amount: number): Intent => ({ kind: 'weak', amount });
const vuln = (amount: number): Intent => ({ kind: 'vulnerable', amount });
const str = (amount: number): Intent => ({ kind: 'strength', amount });
const poi = (amount: number): Intent => ({ kind: 'poison', amount });

export const ENEMIES: Record<string, EnemyDef> = {
  raccoon: { id: 'raccoon', name: 'Raccoon', emoji: '🦝', hp: 26, pattern: [atk(8), atk(11), blk(7)] },
  stray: { id: 'stray', name: 'Stray', emoji: '🐶', hp: 32, pattern: [atk(13), blk(9), atk(7)] },
  kit: { id: 'kit', name: 'Kit', emoji: '🐱', hp: 16, pattern: [atk(6), atk(6), blk(5)] },
  goose: { id: 'goose', name: 'Goose', emoji: '🪿', hp: 36, pattern: [atk(5, 2), blk(12), atk(10)] },
  van: {
    id: 'van',
    name: 'Control Van',
    emoji: '🚐',
    hp: 70,
    pattern: [atk(16), weak(2), blk(14), atk(13)],
  },
  coyote: {
    id: 'coyote',
    name: 'Coyote',
    emoji: '🐺',
    hp: 60,
    pattern: [atk(11), atk(14), str(2), atk(11)],
  },
  warden: {
    id: 'warden',
    name: 'The Warden',
    emoji: '👮',
    hp: 125,
    pattern: [atk(15), blk(12), vuln(2), atk(20)],
    phase: {
      atHp: 60,
      gainStrength: 3,
      pattern: [atk(18), atk(14), blk(16)],
    },
  },
  raccoon2: {
    id: 'raccoon2',
    name: 'Dumpster Raccoon',
    emoji: '🦝',
    hp: 36,
    pattern: [atk(12), atk(15), blk(10)],
  },
  stray2: { id: 'stray2', name: 'Yard Dog', emoji: '🐶', hp: 45, pattern: [atk(17), blk(13), atk(11)] },
  kit2: { id: 'kit2', name: 'Alley Kit', emoji: '🐱', hp: 22, pattern: [atk(10), atk(10), blk(8)] },
  goose2: { id: 'goose2', name: 'Guard Goose', emoji: '🪿', hp: 50, pattern: [atk(9, 2), blk(16), atk(14)] },
  officer: { id: 'officer', name: 'Officer', emoji: '👮', hp: 28, pattern: [atk(12), weak(1), atk(9)] },
  officer_b: { id: 'officer_b', name: 'Officer', emoji: '👮', hp: 28, pattern: [weak(1), atk(12), atk(9)] },
  fleas: { id: 'fleas', name: 'Flea Swarm', emoji: '🪲', hp: 40, pattern: [poi(5), atk(7), blk(8)] },
  truck: {
    id: 'truck',
    name: 'Pound Truck',
    emoji: '🚚',
    hp: 100,
    pattern: [atk(18), vuln(2), blk(18), atk(14, 2)],
  },
  night: {
    id: 'night',
    name: 'Night Coyote',
    emoji: '🐺',
    hp: 160,
    pattern: [atk(16), atk(21), str(2)],
    phase: { atHp: 80, applyWeak: 2 },
  },
  van2: { id: 'van2', name: 'Riot Van', emoji: '🚐', hp: 98, pattern: [atk(20), weak(2), blk(18), atk(17)] },
  coyote2: {
    id: 'coyote2',
    name: 'Alpha Coyote',
    emoji: '🐺',
    hp: 84,
    pattern: [atk(15), atk(18), str(2), atk(15)],
  },
  captain: {
    id: 'captain',
    name: 'Captain',
    emoji: '👮',
    hp: 90,
    pattern: [atk(18), blk(16), vuln(2), atk(22)],
  },
  rookie: { id: 'rookie', name: 'Rookie', emoji: '👮', hp: 30, pattern: [atk(11), weak(1), atk(9)] },
  pound: {
    id: 'pound',
    name: 'City Pound',
    emoji: '🏛️',
    hp: 200,
    pattern: [atk(20), blk(20), weak(3)],
    phase: {
      atHp: 100,
      summon: 'pound_van',
      pattern: [atk(16, 2), blk(15)],
    },
  },
  pound_van: {
    id: 'pound_van',
    name: 'Backup Van',
    emoji: '🚐',
    hp: 40,
    pattern: [atk(12), atk(12), blk(8)],
  },
};

export const ENCOUNTERS: Record<string, EncounterDef> = {
  raccoon: { id: 'raccoon', enemies: [{ defId: 'raccoon' }] },
  stray: { id: 'stray', enemies: [{ defId: 'stray' }] },
  kits: { id: 'kits', enemies: [{ defId: 'kit', name: 'Miso' }, { defId: 'kit', name: 'Nori' }] },
  goose: { id: 'goose', enemies: [{ defId: 'goose' }] },
  van: { id: 'van', enemies: [{ defId: 'van' }] },
  coyote: { id: 'coyote', enemies: [{ defId: 'coyote' }] },
  warden: { id: 'warden', enemies: [{ defId: 'warden' }] },
  raccoon2: { id: 'raccoon2', enemies: [{ defId: 'raccoon2' }] },
  stray2: { id: 'stray2', enemies: [{ defId: 'stray2' }] },
  kits2: { id: 'kits2', enemies: [{ defId: 'kit2', name: 'Miso' }, { defId: 'kit2', name: 'Nori' }] },
  goose2: { id: 'goose2', enemies: [{ defId: 'goose2' }] },
  officers: {
    id: 'officers',
    enemies: [
      { defId: 'officer', name: 'Officer Lin' },
      { defId: 'officer_b', name: 'Officer Brooks' },
    ],
  },
  fleas: { id: 'fleas', enemies: [{ defId: 'fleas' }] },
  truck: { id: 'truck', enemies: [{ defId: 'truck' }] },
  night: { id: 'night', enemies: [{ defId: 'night' }] },
  van2: { id: 'van2', enemies: [{ defId: 'van2' }] },
  coyote2: { id: 'coyote2', enemies: [{ defId: 'coyote2' }] },
  squad: {
    id: 'squad',
    enemies: [
      { defId: 'captain' },
      { defId: 'rookie' },
    ],
  },
  pound: { id: 'pound', enemies: [{ defId: 'pound' }] },
};

export const ACTS: Record<number, { combats: string[]; elites: string[]; boss: string }> = {
  1: {
    combats: ['raccoon', 'stray', 'kits', 'goose'],
    elites: ['van', 'coyote'],
    boss: 'warden',
  },
  2: {
    combats: ['raccoon2', 'stray2', 'kits2', 'goose2', 'officers', 'fleas'],
    elites: ['truck'],
    boss: 'night',
  },
  3: {
    combats: ['truck', 'van2', 'coyote2'],
    elites: ['squad'],
    boss: 'pound',
  },
};

export function getEnemy(id: string): EnemyDef {
  const enemy = ENEMIES[id];
  if (!enemy) throw new Error(`Missing enemy ${id}`);
  return enemy;
}

export function getEncounter(id: string): EncounterDef {
  const encounter = ENCOUNTERS[id];
  if (!encounter) throw new Error(`Missing encounter ${id}`);
  return encounter;
}

export function actContent(act: number): { combats: string[]; elites: string[]; boss: string } {
  return ACTS[act] ?? ACTS[1]!;
}

export function enemyPattern(def: EnemyDef, form: 0 | 1): Intent[] {
  if (form === 1 && def.phase?.pattern?.length) return def.phase.pattern;
  return def.pattern;
}
