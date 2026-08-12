export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, list: readonly T[]): T {
  return list[Math.floor(rng() * list.length)]!;
}

export function chance(rng: () => number, p: number): boolean {
  return rng() < p;
}

export function id(prefix: string, rng: () => number): string {
  return `${prefix}_${Math.floor(rng() * 1e9).toString(36)}`;
}
