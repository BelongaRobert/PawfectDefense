import type { Relic } from './types';

export const PET_NAMES = [
  'Mochi', 'Biscuit', 'Nori', 'Pumpkin', 'Maple', 'Pixel', 'Clover', 'Toast',
  'Juniper', 'Pepper', 'Socks', 'Miso', 'Waffle', 'Olive', 'Fig', 'Pebble',
  'Sunny', 'Scout', 'Luna', 'Bean', 'Kiwi', 'Drift', 'Hazel', 'Remy',
];

export const ADOPTER_NAMES = [
  'Alex Rivera', 'Jordan Lee', 'Sam Okonkwo', 'Riley Chen', 'Casey Brooks',
  'Morgan Patel', 'Quinn Alvarez', 'Avery Kim', 'Jamie Torres', 'Reese Nguyen',
  'Harper Diaz', 'Drew Santos', 'Cameron Blake', 'Skyler Moss', 'Parker Singh',
];

export const RELIC_POOL: Relic[] = [
  {
    id: 'extra_kennel',
    name: 'Spare Kennel',
    description: '+1 kennel capacity for the rest of the run.',
    emoji: '🏠',
  },
  {
    id: 'treat_bowl',
    name: 'Bottomless Treat Bowl',
    description: '+1 staff energy each morning.',
    emoji: '🦴',
  },
  {
    id: 'foster_network',
    name: 'Foster Network',
    description: '+1 temporary foster slot (does not count toward stress collapse).',
    emoji: '🤝',
  },
  {
    id: 'training_clicker',
    name: 'Training Clicker',
    description: 'Train action also lowers stress by 1.',
    emoji: '📣',
  },
  {
    id: 'soft_blankets',
    name: 'Soft Blankets',
    description: 'Pets gain stress 25% slower overnight.',
    emoji: '🛏️',
  },
  {
    id: 'vet_voucher',
    name: 'Vet Voucher',
    description: 'Treat costs 0 supplies once per day (first Treat free).',
    emoji: '💉',
  },
  {
    id: 'welcome_sign',
    name: 'Welcome Sign',
    description: '+5 reputation immediately.',
    emoji: '🪧',
  },
  {
    id: 'social_intern',
    name: 'Social Intern',
    description: 'Stretch matches never return.',
    emoji: '📱',
  },
];
