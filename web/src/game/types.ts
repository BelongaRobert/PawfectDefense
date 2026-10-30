export type Phase =
  | 'title'
  | 'map'
  | 'combat'
  | 'reward'
  | 'rest'
  | 'shop'
  | 'event'
  | 'relic'
  | 'victory'
  | 'ended';

export type CardType = 'attack' | 'skill' | 'power' | 'curse';
export type Rarity = 'starter' | 'common' | 'uncommon' | 'rare' | 'curse' | 'boss';
export type CardTarget = 'enemy' | 'all' | 'self';
export type PotionId = 'block' | 'strike' | 'strength' | 'heal';
export type NodeKind = 'combat' | 'elite' | 'rest' | 'shop' | 'event' | 'boss';
export type Picker = 'upgrade' | 'remove' | null;

export type Effect =
  | { op: 'damage'; amount: number }
  | { op: 'damageAll'; amount: number }
  | { op: 'hits'; amount: number; times: number }
  | { op: 'block'; amount: number }
  | { op: 'draw'; amount: number }
  | { op: 'strength'; amount: number }
  | { op: 'vulnerable'; amount: number }
  | { op: 'poison'; amount: number }
  | { op: 'heal'; amount: number }
  | { op: 'doubleNextAttack' }
  | { op: 'ifVulnerable'; yes: number; no: number }
  | { op: 'powerBlockOnSkill'; amount: number }
  | { op: 'powerRetainBlock' }
  | { op: 'exhaustHand'; draw: number };

export interface CardInstance {
  uid: string;
  defId: string;
  upgraded: boolean;
  /** Combat-only cost from Carrier. Never written back to the master deck. */
  costOverride?: number;
}

export interface LogLine {
  text: string;
  tone?: 'good' | 'bad' | 'neutral';
}

export interface StatusBody {
  hp: number;
  maxHp: number;
  block: number;
  strength: number;
  dexterity: number;
  weak: number;
  vulnerable: number;
  poison: number;
}

export interface EnemyState extends StatusBody {
  uid: string;
  defId: string;
  name: string;
  emoji: string;
  form: 0 | 1;
  intentIndex: number;
  phaseTriggered: boolean;
  pendingForm: boolean;
}

export type Pending =
  | { type: 'target'; cardUid: string }
  | { type: 'exhaust'; source: CardInstance; draw: number }
  | { type: 'potion' };

export interface CombatState {
  player: StatusBody & { energy: number; maxEnergy: number };
  hand: CardInstance[];
  draw: CardInstance[];
  discard: CardInstance[];
  exhaustPile: CardInstance[];
  enemies: EnemyState[];
  relics: string[];
  powers: { retainBlock: boolean; blockOnSkill: number };
  doubleNextAttack: boolean;
  carrierUsed: boolean;
  clickerUsed: boolean;
  bonusTurnEnergy: number;
  turn: number;
  seq: number;
  inEnemyTurn: boolean;
  pending: Pending | null;
  log: LogLine[];
  over: boolean;
  victory: boolean;
}

export interface MapNode {
  id: string;
  row: number;
  col: number;
  kind: NodeKind;
  next: string[];
  encounterId?: string;
  eventId?: string;
}

export interface ActMap {
  act: number;
  nodes: MapNode[];
}

export interface RewardState {
  gold: number;
  cards: string[];
  cardDone: boolean;
  relicId: string | null;
  relicDone: boolean;
}

export interface ShopSlot<T> {
  item: T;
  price: number;
  sold: boolean;
}

export interface ShopState {
  cards: ShopSlot<string>[];
  relics: ShopSlot<string>[];
  potion: ShopSlot<PotionId> | null;
  removePrice: number;
}

export interface RunPerks {
  turnEnergy: number;
  combatHeal: number;
  cheapRemove: boolean;
  extraCards: string[];
}

export interface RunState {
  phase: Phase;
  seed: number;
  rng: number;
  act: number;
  hp: number;
  maxHp: number;
  gold: number;
  deck: CardInstance[];
  relics: string[];
  potion: PotionId | null;
  map: ActMap;
  currentNodeId: string | null;
  cleared: string[];
  reachable: string[];
  combat: CombatState | null;
  reward: RewardState | null;
  shop: ShopState | null;
  eventId: string | null;
  picker: Picker;
  relicChoices: string[];
  combatSource: 'map' | 'event';
  log: LogLine[];
  fightsWon: number;
  elitesWon: number;
  floors: number;
  perks: RunPerks;
  xpAwarded: number;
  recorded: boolean;
  idCounter: number;
  won?: boolean;
  endReason?: string;
}
