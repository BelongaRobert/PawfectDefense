using System;
using System.Collections.Generic;
using UnityEngine;
using PawfectDefense.Combat;

namespace PawfectDefense.Data
{
    [CreateAssetMenu(fileName = "NewEnemy", menuName = "PawfectDefense/Enemy")]
    public class EnemyDataSO : ScriptableObject
    {
        [Header("Identity")]
        public string enemyId;
        public string enemyName;

        [Header("Stats")]
        public int maxHealth = 30;

        [Header("AI")]
        public AIType aiType = AIType.Random;

        [Header("Intents")]
        public List<EnemyIntentData> possibleIntents = new List<EnemyIntentData>();
        public List<ConditionalIntentData> conditionalIntents = new List<ConditionalIntentData>();

        [Header("Visuals")]
        public Sprite enemyArt;

        [Header("Classification")]
        public bool isElite = false;
        public bool isBoss = false;

        [Header("Rewards")]
        public int goldReward = 10;
        public float relicDropChance = 0f;

        private void OnValidate()
        {
            if (string.IsNullOrEmpty(enemyId))
                enemyId = name.ToLower().Replace(" ", "_");
        }
    }

    [Serializable]
    public class EnemyIntentData
    {
        public IntentType intentType;
        public int baseValue;
        public StatusType associatedStatus;
        public float baseWeight = 1f;
    }

    [Serializable]
    public class ConditionalIntentData
    {
        public float healthThreshold; // 0-1 percentage
        public EnemyIntentData intent;
    }
}
