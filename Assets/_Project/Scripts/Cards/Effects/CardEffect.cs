using UnityEngine;
using PawfectDefense.Data;
using PawfectDefense.Combat;

namespace PawfectDefense.Cards.Effects
{
    public abstract class CardEffect
    {
        public abstract void Execute(Combat.CombatEntity source, Combat.CombatEntity target, CardEffectData data);
    }

    public class DamageEffect : CardEffect
    {
        public override void Execute(Combat.CombatEntity source, Combat.CombatEntity target, CardEffectData data)
        {
            if (target == null) return;

            int damage = data.value;

            // Apply source strength
            if (source.StatusController.HasStatus(StatusType.Strength))
                damage += source.StatusController.GetStatusStacks(StatusType.Strength);

            // Apply target vulnerable
            if (target.StatusController.HasStatus(StatusType.Vulnerable))
                damage = Mathf.FloorToInt(damage * 1.5f);

            // Apply target weak (if source is weak)
            if (source.StatusController.HasStatus(StatusType.Weak))
                damage = Mathf.FloorToInt(damage * 0.75f);

            target.TakeDamage(damage);
        }
    }

    public class BlockEffect : CardEffect
    {
        public override void Execute(Combat.CombatEntity source, Combat.CombatEntity target, CardEffectData data)
        {
            if (target == null) return;

            int block = data.value;

            // Apply dexterity
            if (target.StatusController.HasStatus(StatusType.Dexterity))
                block += target.StatusController.GetStatusStacks(StatusType.Dexterity);

            target.GainBlock(block);
        }
    }

    public class HealEffect : CardEffect
    {
        public override void Execute(Combat.CombatEntity source, Combat.CombatEntity target, CardEffectData data)
        {
            target?.Heal(data.value);
        }
    }

    public class DrawEffect : CardEffect
    {
        public override void Execute(Combat.CombatEntity source, Combat.CombatEntity target, CardEffectData data)
        {
            if (source is Combat.PlayerEntity player)
            {
                player.DeckManager.Draw(data.value);
            }
        }
    }

    public class ApplyStatusEffect : CardEffect
    {
        public override void Execute(Combat.CombatEntity source, Combat.CombatEntity target, CardEffectData data)
        {
            if (target == null || data.statusId == StatusType.None) return;
            target.StatusController.AddStatus(data.statusId, data.value, data.duration);
        }
    }

    public class GainEnergyEffect : CardEffect
    {
        public override void Execute(Combat.CombatEntity source, Combat.CombatEntity target, CardEffectData data)
        {
            if (source is Combat.PlayerEntity player)
            {
                player.EnergyManager.GainEnergy(data.value);
            }
        }
    }

    public class DiscardEffect : CardEffect
    {
        public override void Execute(Combat.CombatEntity source, Combat.CombatEntity target, CardEffectData data)
        {
            if (source is Combat.PlayerEntity player && player.DeckManager != null)
            {
                for (int i = 0; i < data.value; i++)
                {
                    var hand = player.DeckManager.HandPile;
                    if (hand.Count > 0)
                    {
                        int randomIndex = UnityEngine.Random.Range(0, hand.Count);
                        player.DeckManager.DiscardCard(hand[randomIndex]);
                    }
                }
            }
        }
    }

    public class ExhaustEffect : CardEffect
    {
        public override void Execute(Combat.CombatEntity source, Combat.CombatEntity target, CardEffectData data)
        {
            // Exhaust random cards from hand
            if (source is Combat.PlayerEntity player && player.DeckManager != null)
            {
                for (int i = 0; i < data.value; i++)
                {
                    var hand = player.DeckManager.HandPile;
                    if (hand.Count > 0)
                    {
                        int randomIndex = UnityEngine.Random.Range(0, hand.Count);
                        player.DeckManager.ExhaustCard(hand[randomIndex]);
                    }
                }
            }
        }
    }

    public static class EffectFactory
    {
        public static CardEffect CreateEffect(EffectType type)
        {
            return type switch
            {
                EffectType.Damage => new DamageEffect(),
                EffectType.Block => new BlockEffect(),
                EffectType.Heal => new HealEffect(),
                EffectType.Draw => new DrawEffect(),
                EffectType.ApplyStatus => new ApplyStatusEffect(),
                EffectType.GainEnergy => new GainEnergyEffect(),
                EffectType.Discard => new DiscardEffect(),
                EffectType.Exhaust => new ExhaustEffect(),
                _ => null
            };
        }
    }
}
