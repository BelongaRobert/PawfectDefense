using System.Collections.Generic;
using UnityEngine;
using PawfectDefense.Data;

namespace PawfectDefense.Combat
{
    public enum AIType { Random, Pattern, Conditional }

    public enum IntentType { Attack, Defend, Buff, Debuff, Escape }

    public class EnemyIntent
    {
        public IntentType intentType;
        public int baseValue;
        public CombatEntity target;
        public StatusType associatedStatus;
    }

    public abstract class EnemyAI
    {
        protected EnemyDataSO enemyData;
        protected int turnCounter = 0;

        public EnemyAI(EnemyDataSO data)
        {
            enemyData = data;
        }

        public abstract EnemyIntent GetNextIntent(EnemyEntity self);
    }

    public class RandomAI : EnemyAI
    {
        public RandomAI(EnemyDataSO data) : base(data) { }

        public override EnemyIntent GetNextIntent(EnemyEntity self)
        {
            turnCounter++;

            var weightedIntents = new List<(EnemyIntent intent, float weight)>();

            foreach (var intentData in enemyData.possibleIntents)
            {
                float weight = intentData.baseWeight;

                // Adjust weight based on state
                if (intentData.intentType == IntentType.Defend && self.CurrentHealth < self.MaxHealth * 0.3f)
                    weight *= 2f;

                weightedIntents.Add((new EnemyIntent
                {
                    intentType = intentData.intentType,
                    baseValue = intentData.baseValue,
                    associatedStatus = intentData.associatedStatus
                }, weight));
            }

            float totalWeight = 0f;
            foreach (var item in weightedIntents)
                totalWeight += item.weight;

            float randomValue = Random.Range(0f, totalWeight);
            float currentWeight = 0f;

            foreach (var item in weightedIntents)
            {
                currentWeight += item.weight;
                if (randomValue <= currentWeight)
                {
                    return new EnemyIntent
                    {
                        intentType = item.intent.intentType,
                        baseValue = item.intent.baseValue,
                        associatedStatus = item.intent.associatedStatus
                    };
                }
            }

            // Fallback to first intent
            return new EnemyIntent
            {
                intentType = weightedIntents[0].intent.intentType,
                baseValue = weightedIntents[0].intent.baseValue
            };
        }
    }

    public class PatternAI : EnemyAI
    {
        public PatternAI(EnemyDataSO data) : base(data) { }

        public override EnemyIntent GetNextIntent(EnemyEntity self)
        {
            if (enemyData.possibleIntents.Count == 0)
                return new EnemyIntent { intentType = IntentType.Attack, baseValue = 5 };

            int patternIndex = turnCounter % enemyData.possibleIntents.Count;
            var intentData = enemyData.possibleIntents[patternIndex];
            turnCounter++;

            return new EnemyIntent
            {
                intentType = intentData.intentType,
                baseValue = intentData.baseValue,
                associatedStatus = intentData.associatedStatus
            };
        }
    }

    public class ConditionalAI : EnemyAI
    {
        public ConditionalAI(EnemyDataSO data) : base(data) { }

        public override EnemyIntent GetNextIntent(EnemyEntity self)
        {
            turnCounter++;

            // Check health threshold
            float healthPercent = (float)self.CurrentHealth / self.MaxHealth;

            foreach (var condition in enemyData.conditionalIntents)
            {
                if (condition.healthThreshold > 0 && healthPercent <= condition.healthThreshold)
                {
                    return new EnemyIntent
                    {
                        intentType = condition.intent.intentType,
                        baseValue = condition.intent.baseValue,
                        associatedStatus = condition.intent.associatedStatus
                    };
                }
            }

            // Default to random if no conditions met
            return new RandomAI(enemyData).GetNextIntent(self);
        }
    }
}
