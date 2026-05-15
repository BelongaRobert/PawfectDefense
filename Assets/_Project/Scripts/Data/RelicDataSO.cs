using System;
using UnityEngine;

namespace PawfectDefense.Data
{
    [CreateAssetMenu(fileName = "NewRelic", menuName = "PawfectDefense/Relic")]
    public class RelicDataSO : ScriptableObject
    {
        [Header("Identity")]
        public string relicId;
        public string relicName;
        [TextArea(2, 4)] public string description;

        [Header("Rarity")]
        public RelicRarity rarity = RelicRarity.Common;

        [Header("Visuals")]
        public Sprite relicArt;

        [Header("Effect")]
        public RelicTrigger trigger;
        public RelicEffectType effectType;
        public int effectValue;
        public StatusType statusToApply;

        [Header("Flavor")]
        [TextArea(1, 2)] public string flavorText;

        private void OnValidate()
        {
            if (string.IsNullOrEmpty(relicId))
                relicId = name.ToLower().Replace(" ", "_");
        }
    }

    public enum RelicRarity { Common, Uncommon, Rare, Boss }

    public enum RelicTrigger
    {
        StartOfCombat,
        StartOfTurn,
        EndOfTurn,
        OnPlayCard,
        OnTakeDamage,
        OnDealDamage,
        OnKillEnemy,
        OnGainBlock,
        OnHeal,
        OnDrawCard,
        OnDiscardCard,
        OnExhaustCard,
        OnEnterShop,
        OnEnterRest,
        Permanent
    }

    public enum RelicEffectType
    {
        GainEnergy,
        GainBlock,
        Heal,
        DrawCard,
        GainGold,
        GainStrength,
        GainDexterity,
        ReduceDamage,
        IncreaseDamage,
        ApplyStatus
    }
}
