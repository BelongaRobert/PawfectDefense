import type { Pet, RunState, Species } from './types';

/** Pocket pets share a habitat — 4 of the same species fill one kennel. */
export const COLONY_SPECIES: Species[] = ['chameleon', 'hamster', 'ferret'];
export const COLONY_PER_KENNEL = 4;

export function isColonySpecies(species: Species): boolean {
  return COLONY_SPECIES.includes(species);
}

export function colonyCount(pets: Pet[], species: Species): number {
  return pets.filter((p) => p.species === species).length;
}

/** Kennels occupied: dogs/cats/rabbits/birds = 1 each; colony species = ceil(n/4) per species. */
export function kennelsUsed(pets: Pet[]): number {
  let used = 0;
  const colonies: Partial<Record<Species, number>> = {};
  for (const pet of pets) {
    if (isColonySpecies(pet.species)) {
      colonies[pet.species] = (colonies[pet.species] || 0) + 1;
    } else {
      used += 1;
    }
  }
  for (const n of Object.values(colonies)) {
    used += Math.ceil((n || 0) / COLONY_PER_KENNEL);
  }
  return used;
}

export function kennelsFree(state: Pick<RunState, 'pets' | 'capacity' | 'fosterSlots'>): number {
  return Math.max(0, state.capacity + state.fosterSlots - kennelsUsed(state.pets));
}

export function canAcceptPets(
  state: Pick<RunState, 'pets' | 'capacity' | 'fosterSlots'>,
  incoming: Pet[],
): boolean {
  return kennelsUsed([...state.pets, ...incoming]) <= state.capacity + state.fosterSlots;
}

export function extraKennelsNeeded(current: Pet[], incoming: Pet[]): number {
  return Math.max(0, kennelsUsed([...current, ...incoming]) - kennelsUsed(current));
}

export function petsInGroup(pets: Pet[], groupId?: string): Pet[] {
  if (!groupId) return [];
  return pets.filter((p) => p.groupId === groupId);
}

/** Group bonded intake together so 3–4 pocket pets are one decision. */
export function intakeClusters(intake: Pet[]): Pet[][] {
  const seen = new Set<string>();
  const clusters: Pet[][] = [];
  for (const pet of intake) {
    if (pet.groupId) {
      if (seen.has(pet.groupId)) continue;
      seen.add(pet.groupId);
      clusters.push(intake.filter((p) => p.groupId === pet.groupId));
    } else {
      clusters.push([pet]);
    }
  }
  return clusters;
}

export function habitatTag(pets: Pet[], species: Species): string | null {
  if (!isColonySpecies(species)) return null;
  const n = colonyCount(pets, species);
  if (n <= 0) return null;
  const inOpen = ((n - 1) % COLONY_PER_KENNEL) + 1;
  return `${inOpen}/${COLONY_PER_KENNEL} ${species}`;
}

export function kennelLabel(pets: Pet[], capacity: number): string {
  const k = kennelsUsed(pets);
  const animals = pets.length;
  if (animals === k) return `${k}/${capacity}`;
  return `${k}/${capacity} · ${animals} animals`;
}
