using System;
using UnityEngine;

namespace PawfectDefense.Data
{
    [Serializable]
    public struct CardEffectData
    {
        public EffectType effectType;
        public TargetType target;
        public int value;
        public StatusType statusId;
        public int duration;
    }

    public enum EffectType
    {
        Damage,
        Block,
        Heal,
        Draw,
        ApplyStatus,
        GainEnergy,
        Exhaust,
        Discard
    }

    public enum TargetType
    {
        Self,
        SingleEnemy,
        AllEnemies,
        RandomEnemy
    }

    public enum StatusType
    {
        None,
        Vulnerable,
        Weak,
        Poison,
        Strength,
        Dexterity,
        Regen
    }
}
