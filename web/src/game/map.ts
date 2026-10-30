import { actContent } from './encounters';
import { pick } from './rng';
import type { ActMap, MapNode, NodeKind } from './types';

export const EVENT_IDS = ['donation', 'training', 'fence', 'sleepover', 'storm', 'treats'] as const;
export type EventId = (typeof EVENT_IDS)[number];

function link(from: MapNode, to: MapNode): void {
  if (!from.next.includes(to.id)) from.next.push(to.id);
}

function repairKinds(nodes: MapNode[], rng: () => number): void {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const breakRests = (): void => {
    for (const node of nodes) {
      if (node.kind !== 'rest') continue;
      for (const id of node.next) {
        const child = byId.get(id);
        if (child?.kind === 'rest') child.kind = 'event';
      }
    }
  };
  const flexible = (node: MapNode): boolean => node.row >= 1 && node.row <= 6 && node.kind !== 'elite';

  for (const node of nodes) {
    if (node.row === 0) node.kind = 'combat';
    if (node.kind === 'elite' && (node.row < 3 || node.row > 5)) node.kind = 'combat';
  }
  breakRests();
  if (!nodes.some((n) => n.kind === 'elite')) {
    const pool = nodes.filter((n) => n.row >= 3 && n.row <= 5 && n.kind !== 'boss');
    const combat = pool.filter((n) => n.kind === 'combat');
    const choice = combat.length ? combat : pool;
    if (choice.length) pick(rng, choice).kind = 'elite';
  }
  if (!nodes.some((n) => n.kind === 'shop')) {
    const pool = nodes.filter((n) => flexible(n) && (n.kind === 'combat' || n.kind === 'event' || n.kind === 'rest'));
    const soft = pool.filter((n) => n.kind === 'event' || n.kind === 'combat');
    const choice = soft.length ? soft : pool;
    if (choice.length) pick(rng, choice).kind = 'shop';
  }
  breakRests();
  if (!nodes.some((n) => n.kind === 'rest')) {
    const pool = nodes.filter((n) => flexible(n) && n.kind !== 'shop');
    const safe = pool.filter((n) => {
      const parentRest = nodes.some((p) => p.kind === 'rest' && p.next.includes(n.id));
      const childRest = n.next.some((id) => byId.get(id)?.kind === 'rest');
      return !parentRest && !childRest;
    });
    const choice = safe.length ? safe : pool;
    if (choice.length) pick(rng, choice).kind = 'rest';
  }
  breakRests();
  if (!nodes.some((n) => n.kind === 'rest')) {
    const pool = nodes.filter((n) => flexible(n) && n.kind === 'event');
    if (pool.length) pick(rng, pool).kind = 'rest';
  }
  if (!nodes.some((n) => n.kind === 'shop')) {
    const pool = nodes.filter((n) => flexible(n) && n.kind === 'event');
    if (pool.length) pick(rng, pool).kind = 'shop';
  }
}

function assignRooms(act: number, nodes: MapNode[], rng: () => number): void {
  const table = actContent(act);
  for (const node of nodes) {
    if (node.kind === 'combat') node.encounterId = pick(rng, table.combats);
    else if (node.kind === 'elite') node.encounterId = pick(rng, table.elites);
    else if (node.kind === 'event') node.eventId = pick(rng, EVENT_IDS);
    else {
      delete node.encounterId;
      delete node.eventId;
    }
  }
}

export function generateAct(act: number, rng: () => number): ActMap {
  const cells = new Map<string, MapNode>();
  const idOf = (row: number, col: number) => `a${act}r${row}c${col}`;
  const ensure = (row: number, col: number): MapNode => {
    const id = idOf(row, col);
    let node = cells.get(id);
    if (!node) {
      node = { id, row, col, kind: 'combat', next: [] };
      cells.set(id, node);
    }
    return node;
  };

  const starts = [0, 1, 2];
  for (let i = starts.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = starts[i]!;
    starts[i] = starts[j]!;
    starts[j] = tmp;
  }
  const nStarts = rng() < 0.45 ? 2 : 3;
  for (const start of starts.slice(0, nStarts)) {
    let col = start;
    for (let row = 0; row < 7; row++) {
      const node = ensure(row, col);
      if (row < 6) {
        const opts = [col - 1, col, col + 1].filter((c) => c >= 0 && c <= 2);
        const nextCol = opts[Math.floor(rng() * opts.length)]!;
        link(node, ensure(row + 1, nextCol));
        col = nextCol;
      }
    }
  }

  for (const node of [...cells.values()]) {
    if (node.row >= 6) continue;
    for (const col of [node.col - 1, node.col, node.col + 1]) {
      if (col < 0 || col > 2) continue;
      const child = cells.get(idOf(node.row + 1, col));
      if (child && rng() < 0.38) link(node, child);
    }
  }

  for (let row = 1; row < 7; row++) {
    for (const node of [...cells.values()].filter((n) => n.row === row)) {
      const hasParent = [...cells.values()].some((p) => p.next.includes(node.id));
      if (!hasParent) link(ensure(row - 1, node.col), node);
    }
  }
  for (let row = 0; row < 6; row++) {
    for (const node of [...cells.values()].filter((n) => n.row === row)) {
      if (node.next.length === 0) link(node, ensure(row + 1, node.col));
    }
  }

  const boss: MapNode = {
    id: `a${act}boss`,
    row: 7,
    col: 1,
    kind: 'boss',
    next: [],
    encounterId: actContent(act).boss,
  };
  const rooms = [...cells.values()];
  for (const node of rooms.filter((n) => n.row === 6)) link(node, boss);

  const kindRoll = (row: number): NodeKind => {
    if (row === 0) return 'combat';
    const roll = rng();
    if (roll < 0.46) return 'combat';
    if (roll < 0.68) return 'event';
    if (roll < 0.84) return 'rest';
    return 'shop';
  };
  for (const node of rooms) node.kind = kindRoll(node.row);
  // Guarantee one elite before the random fill overwrites rows 3–5.
  const eliteHost = rooms.filter((n) => n.row >= 3 && n.row <= 5);
  if (eliteHost.length) pick(rng, eliteHost).kind = 'elite';

  repairKinds(rooms, rng);
  assignRooms(act, rooms, rng);
  return { act, nodes: [...rooms, boss] };
}

export function mapProblems(map: ActMap): string[] {
  const problems: string[] = [];
  const nodes = map.nodes.filter((n) => n.kind !== 'boss');
  const boss = map.nodes.find((n) => n.kind === 'boss');
  const byId = new Map(map.nodes.map((n) => [n.id, n]));
  if (!boss) problems.push('no boss');
  if (!nodes.some((n) => n.kind === 'shop')) problems.push('no shop');
  if (!nodes.some((n) => n.kind === 'rest')) problems.push('no rest');
  if (!nodes.some((n) => n.kind === 'elite')) problems.push('no elite');
  for (const node of nodes) {
    if (node.row === 0 && node.kind !== 'combat') problems.push(`row0 ${node.id}`);
    if (node.kind === 'elite' && (node.row < 3 || node.row > 5)) problems.push(`elite ${node.id}`);
    if (node.kind === 'combat' && !node.encounterId) problems.push(`no encounter ${node.id}`);
    if (node.kind === 'elite' && !node.encounterId) problems.push(`no elite encounter ${node.id}`);
    if (node.kind === 'rest') {
      for (const id of node.next) {
        if (byId.get(id)?.kind === 'rest') problems.push(`rest chain ${node.id}`);
      }
    }
    if (node.row > 0 && !nodes.some((p) => p.next.includes(node.id)) && !map.nodes.some((p) => p.next.includes(node.id))) {
      problems.push(`orphan ${node.id}`);
    }
  }
  if (boss && !nodes.some((n) => n.next.includes(boss.id))) problems.push('boss unreachable');
  const row0 = nodes.filter((n) => n.row === 0);
  for (const start of row0) {
    const seen = new Set<string>();
    const queue = [start.id];
    let found = false;
    while (queue.length) {
      const id = queue.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      if (id === boss?.id) found = true;
      for (const next of byId.get(id)?.next ?? []) queue.push(next);
    }
    if (!found) problems.push(`no path ${start.id}`);
  }
  return problems;
}
