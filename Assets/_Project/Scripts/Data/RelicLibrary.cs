using System.Collections.Generic;
using UnityEngine;

namespace PawfectDefense.Data
{
    public class RelicLibrary : MonoBehaviour
    {
        public static RelicLibrary Instance { get; private set; }

        [Header("All Relics")]
        public List<RelicDataSO> allRelics = new List<RelicDataSO>();

        private void Awake()
        {
            if (Instance != null)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            InitializeRelics();
        }

        private void InitializeRelics()
        {
            allRelics.Clear();

            // === STARTER / COMMON ===
            AddRelic("old_collar", "Old Collar", RelicRarity.Common, RelicTrigger.StartOfCombat,
                RelicEffectType.GainBlock, 4,
                "A worn leather collar that still carries the scent of home.",
                "Provides 4 Block at the start of each combat.");

            AddRelic("treat_pouch", "Treat Pouch", RelicRarity.Common, RelicTrigger.OnHeal,
                RelicEffectType.GainGold, 5,
                "Every snack is a small celebration.",
                "Gain 5 gold whenever you heal.");

            AddRelic("chew_toy", "Chew Toy", RelicRarity.Common, RelicTrigger.OnTakeDamage,
                RelicEffectType.GainBlock, 2,
                "A trusted companion in times of stress.",
                "Gain 2 Block whenever you take damage.");

            AddRelic("water_bowl", "Water Bowl", RelicRarity.Common, RelicTrigger.StartOfTurn,
                RelicEffectType.Heal, 2,
                "Stay hydrated, stay hopeful.",
                "Heal 2 HP at the start of each turn.");

            AddRelic("leash_of_fury", "Leash of Fury", RelicRarity.Common, RelicTrigger.OnDealDamage,
                RelicEffectType.IncreaseDamage, 1,
                "A little extra pull goes a long way.",
                "Deal 1 additional damage with all attacks.");

            // === UNCOMMON ===
            AddRelic("scratching_post", "Scratching Post", RelicRarity.Uncommon, RelicTrigger.OnGainBlock,
                RelicEffectType.DrawCard, 1,
                "Perfect for working out frustrations.",
                "Draw 1 card whenever you gain Block.");

            AddRelic("warm_bed", "Warm Bed", RelicRarity.Uncommon, RelicTrigger.OnEnterRest,
                RelicEffectType.Heal, 10,
                "A soft place to land after a hard day.",
                "Heal 10 additional HP when resting.");

            AddRelic("squeaky_ball", "Squeaky Ball", RelicRarity.Uncommon, RelicTrigger.OnPlayCard,
                RelicEffectType.GainEnergy, 1,
                "The sound of impending chaos.",
                "25% chance to gain 1 Energy when playing a card.");

            AddRelic("pet_carrier", "Pet Carrier", RelicRarity.Uncommon, RelicTrigger.StartOfCombat,
                RelicEffectType.DrawCard, 2,
                "Safety first, adventure second.",
                "Draw 2 additional cards at the start of combat.");

            // === RARE ===
            AddRelic("golden_bone", "Golden Bone", RelicRarity.Rare, RelicTrigger.OnKillEnemy,
                RelicEffectType.GainGold, 25,
                "A trophy worth fighting for.",
                "Gain 25 gold when you defeat an enemy.");

            AddRelic("guardian_angel", "Guardian Angel", RelicRarity.Rare, RelicTrigger.OnTakeDamage,
                RelicEffectType.ReduceDamage, 3,
                "Someone is watching over you.",
                "Reduce incoming damage by 3.");

            AddRelic("alpha_aura", "Alpha Aura", RelicRarity.Rare, RelicTrigger.StartOfTurn,
                RelicEffectType.GainStrength, 1,
                "Leadership radiates from within.",
                "Gain 1 Strength at the start of each turn.");

            AddRelic("nine_lives_charm", "Nine Lives Charm", RelicRarity.Rare, RelicTrigger.Permanent,
                RelicEffectType.GainDexterity, 2,
                "Luck favors the prepared.",
                "Gain 2 Dexterity permanently.");

            // === BOSS ===
            AddRelic("warden_badge", "Warden's Badge", RelicRarity.Boss, RelicTrigger.StartOfCombat,
                RelicEffectType.GainEnergy, 2,
                "A symbol of authority reclaimed.",
                "Gain 2 additional Energy at the start of each combat.");

            AddRelic("freedom_ring", "Freedom Ring", RelicRarity.Boss, RelicTrigger.StartOfTurn,
                RelicEffectType.GainEnergy, 1,
                "The promise of open fields.",
                "Gain 1 Energy at the start of each turn.");

            Debug.Log($"Relic library initialized with {allRelics.Count} relics.");
        }

        private void AddRelic(string id, string name, RelicRarity rarity, RelicTrigger trigger,
            RelicEffectType effectType, int effectValue, string flavor, string description)
        {
            var relic = ScriptableObject.CreateInstance<RelicDataSO>();
            relic.relicId = id;
            relic.relicName = name;
            relic.rarity = rarity;
            relic.trigger = trigger;
            relic.effectType = effectType;
            relic.effectValue = effectValue;
            relic.flavorText = flavor;
            relic.description = description;

            allRelics.Add(relic);
        }

        public RelicDataSO GetRelic(string relicId)
        {
            return allRelics.Find(r => r.relicId == relicId);
        }

        public List<RelicDataSO> GetRelicsByRarity(RelicRarity rarity)
        {
            return allRelics.FindAll(r => r.rarity == rarity);
        }

        public List<RelicDataSO> GetRandomRelics(int count, RelicRarity maxRarity = RelicRarity.Rare)
        {
            List<RelicDataSO> pool = allRelics.FindAll(r => r.rarity <= maxRarity);
            List<RelicDataSO> result = new List<RelicDataSO>();

            System.Random rng = new System.Random();
            while (result.Count < count && pool.Count > 0)
            {
                int index = rng.Next(pool.Count);
                result.Add(pool[index]);
                pool.RemoveAt(index);
            }

            return result;
        }

        public List<RelicDataSO> GetAllRelics()
        {
            return new List<RelicDataSO>(allRelics);
        }
    }
}
