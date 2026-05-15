using System;
using System.Collections.Generic;
using UnityEngine;

namespace PawfectDefense.Data
{
    [CreateAssetMenu(fileName = "NewEncounter", menuName = "PawfectDefense/Encounter")]
    public class EncounterDataSO : ScriptableObject
    {
        [Header("Identity")]
        public string encounterId;
        public string encounterName;

        [Header("Enemies")]
        public List<EnemySpawnEntryData> enemySpawns = new List<EnemySpawnEntryData>();

        [Header("Rewards")]
        public int baseGoldReward = 10;
        public int cardRewardCount = 1;
        public bool guaranteesRelic = false;

        [Header("Difficulty")]
        public int minimumAct = 1;
        public int maximumAct = 3;

        private void OnValidate()
        {
            if (string.IsNullOrEmpty(encounterId))
                encounterId = name.ToLower().Replace(" ", "_");
        }
    }

    [Serializable]
    public class EnemySpawnEntryData
    {
        public EnemyDataSO enemyData;
        public Vector2 spawnPosition;
        public int spawnDelay = 0; // turns before appearing
    }
}
