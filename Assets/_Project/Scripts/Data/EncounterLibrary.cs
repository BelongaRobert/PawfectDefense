using System.Collections.Generic;
using UnityEngine;

namespace PawfectDefense.Data
{
    public class EncounterLibrary : MonoBehaviour
    {
        public static EncounterLibrary Instance { get; private set; }

        [Header("All Encounters")]
        public List<EncounterDataSO> allEncounters = new List<EncounterDataSO>();

        private void Awake()
        {
            if (Instance != null)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Start()
        {
            InitializeEncounters();
        }

        private void InitializeEncounters()
        {
            allEncounters.Clear();

            // === ACT 1 NORMAL ENCOUNTERS ===
            AddEncounter("act1_officer_patrol", "Officer Patrol", 1, 1,
                new[] { "rookie_officer" },
                baseGoldReward: 10, cardRewardCount: 1);

            AddEncounter("act1_double_trouble", "Double Trouble", 1, 1,
                new[] { "rookie_officer", "rookie_officer" },
                baseGoldReward: 15, cardRewardCount: 1);

            AddEncounter("act1_veteran_watch", "Veteran Watch", 1, 1,
                new[] { "veteran_officer" },
                baseGoldReward: 12, cardRewardCount: 1);

            AddEncounter("act1_mixed_patrol", "Mixed Patrol", 1, 1,
                new[] { "rookie_officer", "veteran_officer" },
                baseGoldReward: 18, cardRewardCount: 1);

            AddEncounter("act1_net_squad", "Net Squad", 1, 1,
                new[] { "net_specialist", "rookie_officer" },
                baseGoldReward: 16, cardRewardCount: 1);

            // === ACT 1 ELITE ===
            AddEncounter("act1_captain_ambush", "Captain's Ambush", 1, 1,
                new[] { "captain", "rookie_officer" },
                baseGoldReward: 30, cardRewardCount: 2, guaranteesRelic: true);

            // === ACT 2 NORMAL ENCOUNTERS ===
            AddEncounter("act2_veteran_pair", "Veteran Pair", 2, 2,
                new[] { "veteran_officer", "veteran_officer" },
                baseGoldReward: 20, cardRewardCount: 1);

            AddEncounter("act2_net_team", "Net Team", 2, 2,
                new[] { "net_specialist", "net_specialist" },
                baseGoldReward: 22, cardRewardCount: 1);

            AddEncounter("act2_captain_escort", "Captain Escort", 2, 2,
                new[] { "captain", "veteran_officer" },
                baseGoldReward: 25, cardRewardCount: 1);

            AddEncounter("act2_full_squad", "Full Squad", 2, 2,
                new[] { "captain", "net_specialist", "rookie_officer" },
                baseGoldReward: 28, cardRewardCount: 2);

            // === ACT 2 ELITE ===
            AddEncounter("act2_elite_van", "Roadblock", 2, 2,
                new[] { "elite_van" },
                baseGoldReward: 40, cardRewardCount: 2, guaranteesRelic: true);

            AddEncounter("act2_double_captain", "Double Captain", 2, 2,
                new[] { "captain", "captain" },
                baseGoldReward: 35, cardRewardCount: 2, guaranteesRelic: true);

            // === ACT 3 NORMAL ENCOUNTERS ===
            AddEncounter("act3_elite_patrol", "Elite Patrol", 3, 3,
                new[] { "elite_van", "veteran_officer" },
                baseGoldReward: 35, cardRewardCount: 1);

            AddEncounter("act3_heavy_resistance", "Heavy Resistance", 3, 3,
                new[] { "captain", "captain", "net_specialist" },
                baseGoldReward: 40, cardRewardCount: 2);

            AddEncounter("act3_van_squad", "Van Squad", 3, 3,
                new[] { "elite_van", "net_specialist" },
                baseGoldReward: 38, cardRewardCount: 2);

            // === BOSS ENCOUNTERS ===
            AddEncounter("boss_warden", "The Warden", 1, 3,
                new[] { "boss_warden" },
                baseGoldReward: 100, cardRewardCount: 3, guaranteesRelic: true);

            Debug.Log($"Encounter library initialized with {allEncounters.Count} encounters.");
        }

        private void AddEncounter(string id, string name, int minAct, int maxAct,
            string[] enemyIds, int baseGoldReward = 10, int cardRewardCount = 1, bool guaranteesRelic = false)
        {
            var encounter = ScriptableObject.CreateInstance<EncounterDataSO>();
            encounter.encounterId = id;
            encounter.encounterName = name;
            encounter.minimumAct = minAct;
            encounter.maximumAct = maxAct;
            encounter.baseGoldReward = baseGoldReward;
            encounter.cardRewardCount = cardRewardCount;
            encounter.guaranteesRelic = guaranteesRelic;

            // Look up enemies from EnemyLibrary
            if (EnemyLibrary.Instance != null)
            {
                foreach (string enemyId in enemyIds)
                {
                    var enemyData = EnemyLibrary.Instance.GetEnemy(enemyId);
                    if (enemyData != null)
                    {
                        var spawnEntry = new EnemySpawnEntryData
                        {
                            enemyData = enemyData,
                            spawnPosition = Vector2.zero
                        };
                        encounter.enemySpawns.Add(spawnEntry);
                    }
                    else
                    {
                        Debug.LogWarning($"Enemy '{enemyId}' not found in EnemyLibrary for encounter '{id}'");
                    }
                }
            }
            else
            {
                Debug.LogWarning($"EnemyLibrary instance not available when creating encounter '{id}'");
            }

            allEncounters.Add(encounter);
        }

        public EncounterDataSO GetEncounter(string encounterId)
        {
            return allEncounters.Find(e => e.encounterId == encounterId);
        }

        public List<EncounterDataSO> GetEncountersForAct(int act, bool includeElite = true, bool includeBoss = false)
        {
            return allEncounters.FindAll(e =>
            {
                if (e.minimumAct > act || e.maximumAct < act) return false;

                bool isBoss = e.encounterId.StartsWith("boss_");
                bool isElite = e.guaranteesRelic && !isBoss;

                if (isBoss && !includeBoss) return false;
                if (isElite && !includeElite) return false;

                return true;
            });
        }

        public EncounterDataSO GetRandomEncounterForAct(int act, bool elite = false, bool boss = false)
        {
            var pool = GetEncountersForAct(act, elite, boss);
            if (pool.Count == 0) return null;

            System.Random rng = new System.Random();
            return pool[rng.Next(pool.Count)];
        }
    }
}
