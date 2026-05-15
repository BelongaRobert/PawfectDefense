using UnityEngine;
using PawfectDefense.Data;
using PawfectDefense.Core;

namespace PawfectDefense.Combat
{
    public class RelicInstance
    {
        public RelicDataSO Data { get; private set; }
        public int Stacks { get; set; }

        public RelicInstance(RelicDataSO data)
        {
            Data = data;
            Stacks = 1;
        }

        public void ApplyEffect(RelicTrigger trigger, CombatEntity owner, CombatEntity target = null)
        {
            if (Data.trigger != trigger) return;

            switch (Data.effectType)
            {
                case RelicEffectType.GainEnergy:
                    if (owner is PlayerEntity player)
                        player.EnergyManager.GainEnergy(Data.effectValue);
                    break;

                case RelicEffectType.GainBlock:
                    owner.GainBlock(Data.effectValue);
                    break;

                case RelicEffectType.Heal:
                    owner.Heal(Data.effectValue);
                    break;

                case RelicEffectType.DrawCard:
                    if (owner is PlayerEntity player2)
                        player2.DeckManager.Draw(Data.effectValue);
                    break;

                case RelicEffectType.GainGold:
                    // Add gold to run data
                    if (Core.GameManager.Instance?.CurrentRun != null)
                        Core.GameManager.Instance.CurrentRun.gold += Data.effectValue;
                    break;

                case RelicEffectType.GainStrength:
                    owner.StatusController?.AddStatus(StatusType.Strength, Data.effectValue, -1); // -1 = permanent
                    break;

                case RelicEffectType.GainDexterity:
                    owner.StatusController?.AddStatus(StatusType.Dexterity, Data.effectValue, -1);
                    break;

                case RelicEffectType.ReduceDamage:
                    // Applied in DamageCalculator
                    break;

                case RelicEffectType.IncreaseDamage:
                    // Applied in DamageCalculator
                    break;

                case RelicEffectType.ApplyStatus:
                    target?.StatusController?.AddStatus(Data.statusToApply, Data.effectValue, 1);
                    break;
            }
        }

        public string GetDisplayName()
        {
            return Data.relicName;
        }

        public string GetDescription()
        {
            return Data.description;
        }
    }
}
