export type CharacterId = 'lead' | 'cat';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  maxHp: number;
  blurb: string;
  /** Starter deck, before unlock bonuses. */
  starters: string[];
}

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  lead: {
    id: 'lead',
    name: 'Pack Lead',
    maxHp: 72,
    blurb: 'Strength, block, and Vulnerable.',
    starters: ['nip', 'nip', 'nip', 'nip', 'nip', 'brace', 'brace', 'brace', 'brace', 'bark'],
  },
  cat: {
    id: 'cat',
    name: 'Barn Cat',
    maxHp: 58,
    blurb: 'Small hits that stack Poison.',
    starters: ['scratch', 'scratch', 'scratch', 'scratch', 'scratch', 'perch', 'perch', 'perch', 'perch', 'pounce'],
  },
};

export function getCharacter(id: string | undefined): CharacterDef {
  if (id === 'cat') return CHARACTERS.cat;
  return CHARACTERS.lead;
}
