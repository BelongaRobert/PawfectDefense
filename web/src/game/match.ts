import type { Adopter, MatchGrade, Pet, PetTraits } from './types';

export interface MatchBreakdown {
  grade: MatchGrade;
  score: number;
  notes: string[];
}

function homeOk(pet: Pet, home: Adopter['prefs']['home']): boolean {
  if (home === 'apartment') {
    if (pet.size === 'L') return false;
    if (pet.energy === 'high' && pet.traits.needsYard) return false;
  }
  if (home === 'farm') return true;
  return !(pet.traits.needsYard && home === 'apartment');
}

export function scoreMatch(pet: Pet, adopter: Adopter, relics: string[] = []): MatchBreakdown {
  const notes: string[] = [];
  let score = 50;
  const { prefs } = adopter;

  if (prefs.species && prefs.species !== pet.species) {
    score -= 35;
    notes.push('Wrong species');
  } else if (prefs.species) {
    score += 12;
    notes.push('Species match');
  }

  if (prefs.size && prefs.size !== pet.size) {
    score -= 18;
    notes.push('Size mismatch');
  } else if (prefs.size) {
    score += 8;
  }

  if (prefs.energy && prefs.energy !== pet.energy) {
    score -= 14;
    notes.push('Energy mismatch');
  } else if (prefs.energy) {
    score += 8;
  }

  if (!homeOk(pet, prefs.home)) {
    score -= 28;
    notes.push('Home unfit');
  } else {
    score += 6;
  }

  for (const key of prefs.dealbreakers) {
    if (pet.traits[key]) {
      score -= 40;
      notes.push(`Dealbreaker: ${key}`);
    }
  }

  for (const key of prefs.must) {
    if (pet.traits[key]) {
      score += 14;
      notes.push(`Must-have: ${key}`);
    } else {
      score -= 22;
      notes.push(`Missing must-have: ${key}`);
    }
  }

  for (const key of prefs.nice) {
    if (pet.traits[key]) {
      score += 8;
      notes.push(`Nice-to-have: ${key}`);
    }
  }

  if (pet.stress >= 2) {
    score -= 10 * pet.stress;
    notes.push('Pet is stressed');
  }

  if (!pet.fedToday) {
    score -= 16;
    notes.push('Hungry');
  } else {
    score += 6;
    notes.push('Well-fed');
  }

  if (pet.treatBoost) {
    score += 14;
    notes.push('Treat-happy');
  }

  if (relics.includes('gourmet') && pet.fedToday) {
    score += 10;
    notes.push('Gourmet kibble');
  }

  if (pet.traits.trained) score += 4;

  const tolerance = adopter.patience;
  let grade: MatchGrade;
  if (score >= 78) grade = 'perfect';
  else if (score >= 58) grade = 'good';
  else if (score >= 40 - tolerance * 4) grade = 'stretch';
  else grade = 'bad';

  return { grade, score, notes };
}

export function traitKeys(): (keyof PetTraits)[] {
  return ['kidFriendly', 'allergySafe', 'needsYard', 'trained', 'specialNeeds'];
}
