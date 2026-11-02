import { cardName, getCard, rewardPool } from './cards';
import { getRelic, shopRelicPool } from './relics';
import { pick, shuffle } from './rng';
import type { ActOffer, CardInstance, OfferEffect, OfferTier, PotionId } from './types';

const POTION_FACE: Record<PotionId, { name: string; text: string }> = {
  block: { name: 'Block Tonic', text: 'Gain 12 Block.' },
  strike: { name: 'Snap Bite', text: 'Deal 12 damage.' },
  strength: { name: 'Bully Stick', text: 'Gain 2 Strength this combat.' },
  heal: { name: 'Broth', text: 'Heal 10 HP.' },
};

const POTION_IDS: PotionId[] = ['block', 'strike', 'strength', 'heal'];

export interface OfferContext {
  maxHp: number;
  hp: number;
  gold: number;
  potion: PotionId | null;
  relics: readonly string[];
  deck: readonly CardInstance[];
  extraCards: readonly string[];
}

export interface OfferRun {
  hp: number;
  maxHp: number;
  gold: number;
  potion: PotionId | null;
  relics: string[];
  deck: CardInstance[];
}

export function actHpTarget(maxHp: number): number {
  return Math.ceil(maxHp * 0.75);
}

/** Raise HP to 75% of max. Never lowers HP. Returns the amount healed. */
export function applyActFloor(run: { hp: number; maxHp: number }): number {
  const target = actHpTarget(run.maxHp);
  if (run.hp >= target) return 0;
  const gained = target - run.hp;
  run.hp = target;
  return gained;
}

export function offerCardOptions(effect: OfferEffect): string[] | null {
  if (effect.op === 'chooseCard' || effect.op === 'loseHpChoose') return effect.options;
  return null;
}

export function offerDeckMode(effect: OfferEffect): 'upgrade' | 'any' | null {
  if (effect.op === 'upgrade') return 'upgrade';
  if (effect.op === 'remove' || effect.op === 'loseMaxHpRemove' || effect.op === 'transform') return 'any';
  return null;
}

function upgradeable(card: CardInstance): boolean {
  if (card.upgraded) return false;
  const def = getCard(card.defId);
  return !!def && def.type !== 'curse';
}

function rollCards(
  ctx: OfferContext,
  rng: () => number,
  rarity: 'common' | 'rare',
  count: number,
  reserved: Set<string>,
): string[] {
  const pool = rewardPool(ctx.extraCards, ctx.deck).filter((card) => card.rarity === rarity && !reserved.has(card.id));
  const ids = shuffle(pool, rng)
    .slice(0, count)
    .map((card) => card.id);
  for (const id of ids) reserved.add(id);
  return ids;
}

export function rollActOffers(ctx: OfferContext, rng: () => number): ActOffer[] {
  const reservedRelics = new Set(ctx.relics);
  const reservedCards = new Set<string>();

  const takeRelic = (): string | null => {
    const pool = shopRelicPool().filter((relic) => !reservedRelics.has(relic.id));
    if (!pool.length) return null;
    const id = pick(rng, pool).id;
    reservedRelics.add(id);
    return id;
  };

  const deal = (tier: OfferTier, title: string, detail: string, effect: OfferEffect): ActOffer => ({
    id: tier,
    tier,
    title,
    detail,
    effect,
  });

  const goodBuilders = [
    (): ActOffer => deal('good', 'Kibble tin', 'Gain 80 gold.', { op: 'gold', amount: 80 }),
    (): ActOffer | null => {
      if (ctx.potion) return null;
      const potion = pick(rng, POTION_IDS);
      const face = POTION_FACE[potion];
      return deal('good', 'Cabinet bottle', `Gain ${face.name}. ${face.text}`, { op: 'potion', potion });
    },
    (): ActOffer => deal('good', 'Bigger bowl', '+6 max HP. Heal 6.', { op: 'maxHp', amount: 6, heal: 6 }),
    (): ActOffer | null => {
      if (!ctx.deck.some(upgradeable)) return null;
      return deal('good', 'Whetstone', 'Upgrade one card.', { op: 'upgrade' });
    },
    (): ActOffer | null => {
      const options = rollCards(ctx, rng, 'common', 3, reservedCards);
      if (!options.length) return null;
      return deal('good', 'Steady card', `Choose 1 of ${options.length} common cards.`, { op: 'chooseCard', options });
    },
  ];

  const badBuilders = [
    (): ActOffer => deal('bad', 'Flea in the blanket', 'Add a Flea. Gain 130 gold.', { op: 'curseGold', count: 1, gold: 130 }),
    (): ActOffer => deal('bad', 'Two fleas', 'Add 2 Fleas. Gain 160 gold.', { op: 'curseGold', count: 2, gold: 160 }),
    (): ActOffer | null => {
      const loss = Math.min(Math.max(12, Math.round(ctx.maxHp * 0.2)), ctx.hp - 1);
      if (loss < 8) return null;
      return deal('bad', 'Sore paw', `Lose ${loss} HP. Gain 90 gold.`, { op: 'loseHpGold', hp: loss, gold: 90 });
    },
    (): ActOffer | null => {
      const loss = Math.min(18, ctx.hp - 1);
      if (loss < 8) return null;
      const options = rollCards(ctx, rng, 'rare', 3, reservedCards);
      if (!options.length) return null;
      return deal('bad', 'Blood price', `Lose ${loss} HP. Choose a rare card.`, {
        op: 'loseHpChoose',
        hp: loss,
        options,
      });
    },
    (): ActOffer | null => {
      const relicId = takeRelic();
      if (!relicId) return null;
      const relic = getRelic(relicId);
      return deal(
        'bad',
        'Tight collar',
        `Lose 7 max HP. Gain ${relic?.name ?? 'a relic'}. ${relic?.description ?? ''}`,
        { op: 'loseMaxHpRelic', maxHp: 7, relicId },
      );
    },
    (): ActOffer | null => {
      if (ctx.deck.length <= 1) return null;
      return deal('bad', 'Thin the pack', 'Lose 8 max HP. Remove a card.', { op: 'loseMaxHpRemove', maxHp: 8 });
    },
  ];

  const amazingBuilders = [
    (): ActOffer | null => {
      const relicId = takeRelic();
      if (!relicId) return null;
      const relic = getRelic(relicId);
      return deal('amazing', 'A find', `Gain ${relic?.name ?? 'a relic'}. ${relic?.description ?? ''}`, {
        op: 'relic',
        relicId,
      });
    },
    (): ActOffer | null => {
      const options = rollCards(ctx, rng, 'rare', 3, reservedCards);
      if (!options.length) return null;
      return deal('amazing', 'The good shelf', `Choose 1 of ${options.length} rare cards.`, {
        op: 'chooseCard',
        options,
      });
    },
    (): ActOffer | null => {
      if (ctx.deck.length <= 1) return null;
      return deal('amazing', 'Clean kennel', 'Remove a card.', { op: 'remove' });
    },
    (): ActOffer => deal('amazing', 'Second supper', '+8 max HP. Heal to full.', { op: 'healFull', bonusMax: 8 }),
    (): ActOffer | null => {
      if (ctx.potion) return null;
      const potion = pick(rng, POTION_IDS);
      const face = POTION_FACE[potion];
      return deal('amazing', 'Jackpot', `Gain 120 gold and ${face.name}. ${face.text}`, {
        op: 'potionGold',
        potion,
        gold: 120,
      });
    },
  ];

  const takeOne = (builders: Array<() => ActOffer | null>, fallback: () => ActOffer): ActOffer => {
    for (const build of shuffle(builders, rng)) {
      const offer = build();
      if (offer) return offer;
    }
    return fallback();
  };

  const amazing = takeOne(amazingBuilders, () =>
    deal('amazing', 'Second supper', '+8 max HP. Heal to full.', { op: 'healFull', bonusMax: 8 }),
  );
  const bad = takeOne(badBuilders, () =>
    deal('bad', 'Flea in the blanket', 'Add a Flea. Gain 130 gold.', { op: 'curseGold', count: 1, gold: 130 }),
  );
  const good = takeOne(goodBuilders, () => deal('good', 'Kibble tin', 'Gain 80 gold.', { op: 'gold', amount: 80 }));
  return [good, bad, amazing];
}

export function applyOffer(
  run: OfferRun,
  offer: ActOffer,
  selection: { defId?: string; uid?: string } | null,
  mint: (defId: string) => CardInstance,
  rng: () => number,
  extraCards: readonly string[],
): { ok: true; text: string } | { ok: false } {
  const effect = offer.effect;
  switch (effect.op) {
    case 'gold':
      run.gold += effect.amount;
      return { ok: true, text: `Gained ${effect.amount} gold.` };
    case 'maxHp':
      run.maxHp += effect.amount;
      run.hp = Math.min(run.maxHp, run.hp + effect.heal);
      return { ok: true, text: `+${effect.amount} max HP. Healed ${effect.heal}.` };
    case 'healFull':
      run.maxHp += effect.bonusMax;
      run.hp = run.maxHp;
      return { ok: true, text: `+${effect.bonusMax} max HP. Healed to full.` };
    case 'potion':
      if (run.potion) return { ok: false };
      run.potion = effect.potion;
      return { ok: true, text: `Took ${POTION_FACE[effect.potion].name}.` };
    case 'potionGold':
      if (run.potion) return { ok: false };
      run.potion = effect.potion;
      run.gold += effect.gold;
      return { ok: true, text: `Gained ${effect.gold} gold and ${POTION_FACE[effect.potion].name}.` };
    case 'relic': {
      if (run.relics.includes(effect.relicId)) return { ok: false };
      run.relics.push(effect.relicId);
      return { ok: true, text: `Gained ${getRelic(effect.relicId)?.name ?? 'a relic'}.` };
    }
    case 'curseGold': {
      for (let i = 0; i < effect.count; i++) run.deck.push(mint('flea'));
      run.gold += effect.gold;
      const fleas = effect.count === 1 ? 'a Flea' : `${effect.count} Fleas`;
      return { ok: true, text: `Added ${fleas}. Gained ${effect.gold} gold.` };
    }
    case 'loseHpGold': {
      const lost = Math.min(effect.hp, Math.max(0, run.hp - 1));
      run.hp -= lost;
      run.gold += effect.gold;
      return { ok: true, text: `Lost ${lost} HP. Gained ${effect.gold} gold.` };
    }
    case 'loseHpChoose': {
      if (!selection?.defId || !effect.options.includes(selection.defId)) return { ok: false };
      const lost = Math.min(effect.hp, Math.max(0, run.hp - 1));
      run.hp -= lost;
      run.deck.push(mint(selection.defId));
      return { ok: true, text: `Lost ${lost} HP. Added ${getCard(selection.defId)?.name ?? 'a card'}.` };
    }
    case 'loseMaxHpRelic': {
      if (run.relics.includes(effect.relicId)) return { ok: false };
      run.maxHp = Math.max(1, run.maxHp - effect.maxHp);
      run.hp = Math.min(run.hp, run.maxHp);
      run.relics.push(effect.relicId);
      return { ok: true, text: `Lost ${effect.maxHp} max HP. Gained ${getRelic(effect.relicId)?.name ?? 'a relic'}.` };
    }
    case 'loseMaxHpRemove': {
      const removed = takeFromDeck(run, selection?.uid);
      if (!removed) return { ok: false };
      run.maxHp = Math.max(1, run.maxHp - effect.maxHp);
      run.hp = Math.min(run.hp, run.maxHp);
      return { ok: true, text: `Lost ${effect.maxHp} max HP. Removed ${cardName(removed)}.` };
    }
    case 'chooseCard': {
      if (!selection?.defId || !effect.options.includes(selection.defId)) return { ok: false };
      run.deck.push(mint(selection.defId));
      return { ok: true, text: `Added ${getCard(selection.defId)?.name ?? 'a card'}.` };
    }
    case 'upgrade': {
      const card = run.deck.find((entry) => entry.uid === selection?.uid);
      if (!card || !upgradeable(card)) return { ok: false };
      card.upgraded = true;
      return { ok: true, text: `Upgraded ${cardName(card)}.` };
    }
    case 'remove': {
      const removed = takeFromDeck(run, selection?.uid);
      if (!removed) return { ok: false };
      return { ok: true, text: `Removed ${cardName(removed)}.` };
    }
    case 'transform': {
      const card = run.deck.find((entry) => entry.uid === selection?.uid);
      if (!card || run.deck.length <= 1) return { ok: false };
      const pool = rewardPool(
        extraCards,
        run.deck.filter((entry) => entry.uid !== card.uid),
      );
      const options = pool.filter((entry) => entry.id !== card.defId);
      const choice = options.length ? options : pool;
      if (!choice.length) return { ok: false };
      const next = pick(rng, choice);
      const before = cardName(card);
      card.defId = next.id;
      card.upgraded = false;
      delete card.costOverride;
      return { ok: true, text: `${before} becomes ${cardName(card)}.` };
    }
    default:
      return { ok: false };
  }
}

function takeFromDeck(run: OfferRun, uid: string | undefined): CardInstance | null {
  if (!uid || run.deck.length <= 1) return null;
  const index = run.deck.findIndex((card) => card.uid === uid);
  if (index < 0) return null;
  const [card] = run.deck.splice(index, 1);
  return card ?? null;
}
