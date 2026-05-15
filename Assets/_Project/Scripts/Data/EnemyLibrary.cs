using System.Collections.Generic;
using UnityEngine;
using PawfectDefense.Combat;

namespace PawfectDefense.Data
{
    public class EnemyLibrary : MonoBehaviour
    {
        public static EnemyLibrary Instance { get; private set; }

        [Header("All Enemies")]
        public List<EnemyDataSO> allEnemies = new List<EnemyDataSO>();

        private void Awake()
        {
            if (Instance != null)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            InitializeEnemies();
        }

        private void InitializeEnemies()
        {
            allEnemies.Clear();

            // === BASIC OFFICERS ===
            AddEnemy("rookie_officer", "Rookie Officer", 20, AIType.Random,
                new EnemyIntentData { intentType = IntentType.Attack, baseValue = 5, baseWeight = 0.7f },
                new EnemyIntentData { intentType = IntentType.Defend, baseValue = 5, baseWeight = 0.3f });

            AddEnemy("veteran_officer", "Veteran Officer", 30, AIType.Pattern,
                new EnemyIntentData { intentType = IntentType.Attack, baseValue = 6 },
                new EnemyIntentData { intentType = IntentType.Defend, baseValue = 8 },
                new EnemyIntentData { intentType = IntentType.Attack, baseValue = 8 });

            AddEnemy("net_specialist", "Net Specialist", 25, AIType.Conditional,
                new EnemyIntentData { intentType = IntentType.Attack, baseValue = 4, baseWeight = 0.5f },
                new EnemyIntentData { intentType = IntentType.Debuff, baseValue = 2, associatedStatus = StatusType.Weak, baseWeight = 0.3f },
                new EnemyIntentData { intentType = IntentType.Debuff, baseValue = 2, associatedStatus = StatusType.Vulnerable, baseWeight = 0.2f },
                new ConditionalIntentData { healthThreshold = 0.4f, intent = new EnemyIntentData { intentType = IntentType.Defend, baseValue = 10 } });

            AddEnemy("captain", "Captain", 40, AIType.Pattern,
                new EnemyIntentData { intentType = IntentType.Attack, baseValue = 8 },
                new EnemyIntentData { intentType = IntentType.Buff, baseValue = 3, associatedStatus = StatusType.Strength },
                new EnemyIntentData { intentType = IntentType.Attack, baseValue = 6 });

            // === ELITE ===
            AddEnemy("elite_van", "Animal Control Van", 80, AIType.Conditional,
                new EnemyIntentData { intentType = IntentType.Attack, baseValue = 10, baseWeight = 0.4f },
                new EnemyIntentData { intentType = IntentType.Defend, baseValue = 12, baseWeight = 0.3f },
                new EnemyIntentData { intentType = IntentType.Debuff, baseValue = 3, associatedStatus = StatusType.Vulnerable, baseWeight = 0.3f },
                new ConditionalIntentData { healthThreshold = 0.5f, intent = new EnemyIntentData { intentType = IntentType.Buff, baseValue = 4, associatedStatus = StatusType.Strength } });

            // === BOSS ===
            AddEnemy("boss_warden", "The Warden", 120, AIType.Conditional,
                new EnemyIntentData { intentType = IntentType.Attack, baseValue = 12, baseWeight = 0.3f },
                new EnemyIntentData { intentType = IntentType.Defend, baseValue = 15, baseWeight = 0.2f },
                new EnemyIntentData { intentType = IntentType.Debuff, baseValue = 3, associatedStatus = StatusType.Weak, baseWeight = 0.2f },
                new EnemyIntentData { intentType = IntentType.Debuff, baseValue = 3, associatedStatus = StatusType.Vulnerable, baseWeight = 0.2f },
                new EnemyIntentData { intentType = IntentType.Attack, baseValue = 20, baseWeight = 0.1f },
                new ConditionalIntentData { healthThreshold = 0.5f, intent = new EnemyIntentData { intentType = IntentType.Buff, baseValue = 5, associatedStatus = StatusType.Strength } },
                new ConditionalIntentData { healthThreshold = 0.25f, intent = new EnemyIntentData { intentType = IntentType.Attack, baseValue = 25 } });

            Debug.Log($"Enemy library initialized with {allEnemies.Count} enemies.");
        }

        private void AddEnemy(string id, string name, int health, AIType aiType, params object[] intents)
        {
            var enemy = ScriptableObject.CreateInstance<EnemyDataSO>();
            enemy.enemyId = id;
            enemy.enemyName = name;
            enemy.maxHealth = health;
            enemy.aiType = aiType;

            foreach (var intent in intents)
            {
                if (intent is EnemyIntentData enemyIntent)
                    enemy.possibleIntents.Add(enemyIntent);
                else if (intent is ConditionalIntentData conditional)
                    enemy.conditionalIntents.Add(conditional);
            }

            if (enemy.maxHealth >= 80)
            {
                if (enemy.maxHealth >= 100)
                    enemy.isBoss = true;
                else
                    enemy.isElite = true;
            }

            allEnemies.Add(enemy);
        }

        public EnemyDataSO GetEnemy(string enemyId)
        {
            return allEnemies.Find(e => e.enemyId == enemyId);
        }

        public List<EnemyDataSO> GetEnemiesByDifficulty(int act)
        {
            return allEnemies.FindAll(e =>
            {
                if (act == 1) return !e.isElite && !e.isBoss;
                if (act == 2) return e.isElite || (!e.isElite && !e.isBoss);
                return true;
            });
        }
    }
}
