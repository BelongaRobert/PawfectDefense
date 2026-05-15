using System.Collections.Generic;
using UnityEngine;

namespace PawfectDefense.Data
{
    /// <summary>
    /// Runtime card library that defines all 60 cards (15 per pet type).
    /// These are created as CardDataSO instances at runtime.
    /// In production, these would be created as ScriptableObject .asset files in Unity.
    /// </summary>
    public class CardLibrary : MonoBehaviour
    {
        public static CardLibrary Instance { get; private set; }

        [Header("All Cards")]
        public List<CardDataSO> allCards = new List<CardDataSO>();

        private void Awake()
        {
            if (Instance != null)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            InitializeCards();
        }

        private void InitializeCards()
        {
            allCards.Clear();

            // === DOG DECK (15 cards) ===
            // Theme: Loyal, protective, friendly, energetic
            AddCard("stray_mutt", "Stray Mutt", "Deal 4 damage.", 1, CardRarity.Common, PetType.Dog,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 4 });

            AddCard("loyal_retriever", "Loyal Retriever", "Deal 3 damage. Heal 2.", 1, CardRarity.Common, PetType.Dog,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 3 },
                new CardEffectData { effectType = EffectType.Heal, target = TargetType.Self, value = 2 });

            AddCard("protective_shepherd", "Protective Shepherd", "Deal 3 damage. Gain 4 Block.", 1, CardRarity.Common, PetType.Dog,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 3 },
                new CardEffectData { effectType = EffectType.Block, target = TargetType.Self, value = 4 });

            AddCard("playful_beagle", "Playful Beagle", "Deal 2 damage. Draw 1 card.", 0, CardRarity.Common, PetType.Dog,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 2 },
                new CardEffectData { effectType = EffectType.Draw, target = TargetType.Self, value = 1 });

            AddCard("gentle_labrador", "Gentle Labrador", "Heal 8. Gain 4 Block.", 2, CardRarity.Uncommon, PetType.Dog,
                new CardEffectData { effectType = EffectType.Heal, target = TargetType.Self, value = 8 },
                new CardEffectData { effectType = EffectType.Block, target = TargetType.Self, value = 4 });

            AddCard("fierce_bulldog", "Fierce Bulldog", "Deal 8 damage.", 2, CardRarity.Common, PetType.Dog,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 8 });

            AddCard("swift_husky", "Swift Husky", "Deal 4 damage. Gain 1 Energy.", 1, CardRarity.Uncommon, PetType.Dog,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 4 },
                new CardEffectData { effectType = EffectType.GainEnergy, target = TargetType.Self, value = 1 });

            AddCard("bouncy_corgi", "Bouncy Corgi", "Deal 2 damage twice.", 1, CardRarity.Common, PetType.Dog,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 2 },
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 2 });

            AddCard("digging_dachshund", "Digging Dachshund", "Deal 6 damage. Apply 2 Weak.", 1, CardRarity.Uncommon, PetType.Dog,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 6 },
                new CardEffectData { effectType = EffectType.ApplyStatus, target = TargetType.SingleEnemy, statusId = StatusType.Weak, value = 2, duration = 2 });

            AddCard("howling_hound", "Howling Hound", "Deal 3 damage to ALL enemies.", 2, CardRarity.Uncommon, PetType.Dog,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.AllEnemies, value = 3 });

            AddCard("pack_leader", "Pack Leader", "Gain 2 Strength.", 1, CardRarity.Rare, PetType.Dog,
                new CardEffectData { effectType = EffectType.ApplyStatus, target = TargetType.Self, statusId = StatusType.Strength, value = 2, duration = -1 });

            AddCard("guard_dog", "Guard Dog", "Gain 12 Block.", 2, CardRarity.Common, PetType.Dog,
                new CardEffectData { effectType = EffectType.Block, target = TargetType.Self, value = 12 });

            AddCard("nursing_nurse_dog", "Nursing Nurse Dog", "Heal 5. Draw 2 cards.", 1, CardRarity.Uncommon, PetType.Dog,
                new CardEffectData { effectType = EffectType.Heal, target = TargetType.Self, value = 5 },
                new CardEffectData { effectType = EffectType.Draw, target = TargetType.Self, value = 2 });

            AddCard("herding_collie", "Herding Collie", "Deal 3 damage. Apply 2 Vulnerable.", 1, CardRarity.Uncommon, PetType.Dog,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 3 },
                new CardEffectData { effectType = EffectType.ApplyStatus, target = TargetType.SingleEnemy, statusId = StatusType.Vulnerable, value = 2, duration = 2 });

            AddCard("alpha_wolf", "Alpha Wolf", "Deal 10 damage. Gain 3 Strength.", 3, CardRarity.Rare, PetType.Dog,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 10 },
                new CardEffectData { effectType = EffectType.ApplyStatus, target = TargetType.Self, statusId = StatusType.Strength, value = 3, duration = -1 });

            // === CAT DECK (15 cards) ===
            // Theme: Agile, sneaky, quick combos, discard synergy
            AddCard("alley_cat", "Alley Cat", "Deal 3 damage.", 0, CardRarity.Common, PetType.Cat,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 3 });

            AddCard("sly_siamese", "Sly Siamese", "Deal 4 damage. Draw 1 card.", 1, CardRarity.Common, PetType.Cat,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 4 },
                new CardEffectData { effectType = EffectType.Draw, target = TargetType.Self, value = 1 });

            AddCard("fluffy_maine_coon", "Fluffy Maine Coon", "Gain 8 Block.", 1, CardRarity.Common, PetType.Cat,
                new CardEffectData { effectType = EffectType.Block, target = TargetType.Self, value = 8 });

            AddCard("curious_tabby", "Curious Tabby", "Draw 2 cards.", 1, CardRarity.Common, PetType.Cat,
                new CardEffectData { effectType = EffectType.Draw, target = TargetType.Self, value = 2 });

            AddCard("hairless_sphynx", "Hairless Sphynx", "Deal 5 damage. Apply 2 Poison.", 1, CardRarity.Uncommon, PetType.Cat,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 5 },
                new CardEffectData { effectType = EffectType.ApplyStatus, target = TargetType.SingleEnemy, statusId = StatusType.Poison, value = 2, duration = 3 });

            AddCard("cuddly_ragdoll", "Cuddly Ragdoll", "Heal 6. Gain 3 Block.", 1, CardRarity.Common, PetType.Cat,
                new CardEffectData { effectType = EffectType.Heal, target = TargetType.Self, value = 6 },
                new CardEffectData { effectType = EffectType.Block, target = TargetType.Self, value = 3 });

            AddCard("grumpy_persian", "Grumpy Persian", "Deal 7 damage.", 2, CardRarity.Common, PetType.Cat,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 7 });

            AddCard("wild_bengal", "Wild Bengal", "Deal 3 damage to ALL enemies.", 2, CardRarity.Uncommon, PetType.Cat,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.AllEnemies, value = 3 });

            AddCard("folded_scottish", "Folded Scottish", "Gain 2 Dexterity.", 1, CardRarity.Rare, PetType.Cat,
                new CardEffectData { effectType = EffectType.ApplyStatus, target = TargetType.Self, statusId = StatusType.Dexterity, value = 2, duration = -1 });

            AddCard("blue_russian", "Blue Russian", "Deal 5 damage. Gain 1 Energy.", 1, CardRarity.Uncommon, PetType.Cat,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 5 },
                new CardEffectData { effectType = EffectType.GainEnergy, target = TargetType.Self, value = 1 });

            AddCard("sneaky_ninja", "Sneaky Ninja", "Deal 2 damage. If you discard a card, deal 4 more.", 1, CardRarity.Rare, PetType.Cat,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 2 });
            // Note: Discard synergy would be implemented in the card's special logic

            AddCard("nine_lives", "Nine Lives", "Heal to full. Exhaust.", 3, CardRarity.Rare, PetType.Cat,
                new CardEffectData { effectType = EffectType.Heal, target = TargetType.Self, value = 999 });

            AddCard("pouncing_panther", "Pouncing Panther", "Deal 6 damage. Apply 2 Vulnerable.", 2, CardRarity.Uncommon, PetType.Cat,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 6 },
                new CardEffectData { effectType = EffectType.ApplyStatus, target = TargetType.SingleEnemy, statusId = StatusType.Vulnerable, value = 2, duration = 2 });

            AddCard("cat_nap", "Cat Nap", "Gain 8 Block. Draw 1 card.", 1, CardRarity.Common, PetType.Cat,
                new CardEffectData { effectType = EffectType.Block, target = TargetType.Self, value = 8 },
                new CardEffectData { effectType = EffectType.Draw, target = TargetType.Self, value = 1 });

            AddCard("whisker_strike", "Whisker Strike", "Deal 5 damage. If enemy has Vulnerable, deal 8 instead.", 1, CardRarity.Uncommon, PetType.Cat,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 5 });
            // Note: Conditional damage would be handled in card execution logic

            // === REPTILE DECK (15 cards) ===
            // Theme: Slow, powerful, high cost big payoff, defensive
            AddCard("gecko_grip", "Gecko Grip", "Gain 5 Block.", 0, CardRarity.Common, PetType.Reptile,
                new CardEffectData { effectType = EffectType.Block, target = TargetType.Self, value = 5 });

            AddCard("coiled_python", "Coiled Python", "Deal 6 damage.", 1, CardRarity.Common, PetType.Reptile,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 6 });

            AddCard("basking_iguana", "Basking Iguana", "Gain 10 Block.", 2, CardRarity.Common, PetType.Reptile,
                new CardEffectData { effectType = EffectType.Block, target = TargetType.Self, value = 10 });

            AddCard("bearded_defender", "Bearded Defender", "Deal 4 damage. Gain 5 Block.", 1, CardRarity.Common, PetType.Reptile,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 4 },
                new CardEffectData { effectType = EffectType.Block, target = TargetType.Self, value = 5 });

            AddCard("colorful_chameleon", "Colorful Chameleon", "Copy the last card you played.", 1, CardRarity.Rare, PetType.Reptile);
            // Note: Copy effect requires special handling

            AddCard("slithering_corn", "Slithering Corn Snake", "Deal 5 damage. Apply 2 Poison.", 1, CardRarity.Uncommon, PetType.Reptile,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 5 },
                new CardEffectData { effectType = EffectType.ApplyStatus, target = TargetType.SingleEnemy, statusId = StatusType.Poison, value = 2, duration = 3 });

            AddCard("blue_tongue", "Blue-Tongued Skink", "Deal 7 damage. Heal 3.", 2, CardRarity.Uncommon, PetType.Reptile,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 7 },
                new CardEffectData { effectType = EffectType.Heal, target = TargetType.Self, value = 3 });

            AddCard("crested_climber", "Crested Climber", "Draw 2 cards. Gain 1 Energy.", 1, CardRarity.Uncommon, PetType.Reptile,
                new CardEffectData { effectType = EffectType.Draw, target = TargetType.Self, value = 2 },
                new CardEffectData { effectType = EffectType.GainEnergy, target = TargetType.Self, value = 1 });

            AddCard("slider_swimmer", "Slider Swimmer", "Deal 4 damage to ALL enemies.", 2, CardRarity.Uncommon, PetType.Reptile,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.AllEnemies, value = 4 });

            AddCard("turtle_shell", "Turtle Shell", "Gain 15 Block. Exhaust.", 2, CardRarity.Rare, PetType.Reptile,
                new CardEffectData { effectType = EffectType.Block, target = TargetType.Self, value = 15 });

            AddCard("venom_strike", "Venom Strike", "Apply 5 Poison.", 1, CardRarity.Uncommon, PetType.Reptile,
                new CardEffectData { effectType = EffectType.ApplyStatus, target = TargetType.SingleEnemy, statusId = StatusType.Poison, value = 5, duration = 3 });

            AddCard("shed_skin", "Shed Skin", "Remove all debuffs. Heal 5.", 1, CardRarity.Rare, PetType.Reptile,
                new CardEffectData { effectType = EffectType.Heal, target = TargetType.Self, value = 5 });
            // Note: Debuff removal requires special handling

            AddCard("komodo_dragon", "Komodo Dragon", "Deal 12 damage. Apply 2 Poison.", 3, CardRarity.Rare, PetType.Reptile,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 12 },
                new CardEffectData { effectType = EffectType.ApplyStatus, target = TargetType.SingleEnemy, statusId = StatusType.Poison, value = 2, duration = 3 });

            AddCard("sun_bask", "Sun Bask", "Heal 10. Gain 2 Energy next turn.", 2, CardRarity.Uncommon, PetType.Reptile,
                new CardEffectData { effectType = EffectType.Heal, target = TargetType.Self, value = 10 });
            // Note: Next turn energy gain requires special handling

            AddCard("cold_blooded", "Cold Blooded", "Deal 8 damage. If you have Block, deal 12 instead.", 2, CardRarity.Uncommon, PetType.Reptile,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 8 });
            // Note: Conditional damage based on block requires special handling

            // === BIRD DECK (15 cards) ===
            // Theme: Flock tactics, swarm, multi-hit, evasion
            AddCard("chirpy_parakeet", "Chirpy Parakeet", "Deal 3 damage.", 0, CardRarity.Common, PetType.Bird,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 3 });

            AddCard("singing_cockatiel", "Singing Cockatiel", "Heal 4. Draw 1 card.", 0, CardRarity.Common, PetType.Bird,
                new CardEffectData { effectType = EffectType.Heal, target = TargetType.Self, value = 4 },
                new CardEffectData { effectType = EffectType.Draw, target = TargetType.Self, value = 1 });

            AddCard("colorful_macaw", "Colorful Macaw", "Deal 4 damage. Gain 3 Block.", 1, CardRarity.Common, PetType.Bird,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 4 },
                new CardEffectData { effectType = EffectType.Block, target = TargetType.Self, value = 3 });

            AddCard("clever_crow", "Clever Crow", "Draw 2 cards.", 1, CardRarity.Common, PetType.Bird,
                new CardEffectData { effectType = EffectType.Draw, target = TargetType.Self, value = 2 });

            AddCard("tiny_parrotlet", "Tiny Parrotlet", "Deal 2 damage. Draw 1 card.", 0, CardRarity.Common, PetType.Bird,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 2 },
                new CardEffectData { effectType = EffectType.Draw, target = TargetType.Self, value = 1 });

            AddCard("loving_lovebird", "Loving Lovebird", "Heal 6. Gain 4 Block.", 1, CardRarity.Common, PetType.Bird,
                new CardEffectData { effectType = EffectType.Heal, target = TargetType.Self, value = 6 },
                new CardEffectData { effectType = EffectType.Block, target = TargetType.Self, value = 4 });

            AddCard("loud_conure", "Loud Conure", "Deal 3 damage to ALL enemies.", 2, CardRarity.Uncommon, PetType.Bird,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.AllEnemies, value = 3 });

            AddCard("fluttering_finch", "Fluttering Finch", "Deal 2 damage three times.", 1, CardRarity.Common, PetType.Bird,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 2 },
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 2 },
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 2 });

            AddCard("messenger_pigeon", "Messenger Pigeon", "Draw 3 cards.", 1, CardRarity.Uncommon, PetType.Bird,
                new CardEffectData { effectType = EffectType.Draw, target = TargetType.Self, value = 3 });

            AddCard("flock_call", "Flock Call", "Deal 2 damage to ALL enemies. Draw 1 card.", 2, CardRarity.Uncommon, PetType.Bird,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.AllEnemies, value = 2 },
                new CardEffectData { effectType = EffectType.Draw, target = TargetType.Self, value = 1 });

            AddCard("bird_of_prey", "Bird of Prey", "Deal 10 damage.", 2, CardRarity.Uncommon, PetType.Bird,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 10 });

            AddCard("migration", "Migration", "Draw 4 cards. Gain 2 Energy.", 2, CardRarity.Rare, PetType.Bird,
                new CardEffectData { effectType = EffectType.Draw, target = TargetType.Self, value = 4 },
                new CardEffectData { effectType = EffectType.GainEnergy, target = TargetType.Self, value = 2 });

            AddCard("eagle_eye", "Eagle Eye", "Deal 5 damage. Apply 2 Vulnerable.", 1, CardRarity.Uncommon, PetType.Bird,
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 5 },
                new CardEffectData { effectType = EffectType.ApplyStatus, target = TargetType.SingleEnemy, statusId = StatusType.Vulnerable, value = 2, duration = 2 });

            AddCard("nest_defense", "Nest Defense", "Gain 8 Block. Deal 3 damage.", 1, CardRarity.Common, PetType.Bird,
                new CardEffectData { effectType = EffectType.Block, target = TargetType.Self, value = 8 },
                new CardEffectData { effectType = EffectType.Damage, target = TargetType.SingleEnemy, value = 3 });

            AddCard("phoenix_rise", "Phoenix Rise", "Heal 15. Gain 5 Block. Exhaust.", 3, CardRarity.Rare, PetType.Bird,
                new CardEffectData { effectType = EffectType.Heal, target = TargetType.Self, value = 15 },
                new CardEffectData { effectType = EffectType.Block, target = TargetType.Self, value = 5 });

            Debug.Log($"Card library initialized with {allCards.Count} cards.");
        }

        private void AddCard(string id, string name, string description, int cost, CardRarity rarity, PetType petType, params CardEffectData[] effects)
        {
            var card = ScriptableObject.CreateInstance<CardDataSO>();
            card.cardId = id;
            card.cardName = name;
            card.description = description;
            card.energyCost = cost;
            card.rarity = rarity;
            card.petType = petType;

            foreach (var effect in effects)
            {
                card.effects.Add(effect);
            }

            allCards.Add(card);
            CardDatabase.Instance?.RegisterCard(card);
        }

        public List<CardDataSO> GetCardsByPetType(PetType petType)
        {
            return allCards.FindAll(c => c.petType == petType);
        }

        public CardDataSO GetCard(string cardId)
        {
            return allCards.Find(c => c.cardId == cardId);
        }
    }
}
