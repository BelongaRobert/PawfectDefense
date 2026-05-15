using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using PawfectDefense.Data;
using PawfectDefense.Cards;
using PawfectDefense.Core;

namespace PawfectDefense.Combat
{
    public class CombatManager : MonoBehaviour
    {
        public static CombatManager Instance { get; private set; }
        public static Data.EncounterDataSO NextEncounter { get; set; }

        public event Action OnCombatStart;
        public event Action OnCombatEnd;
        public event Action<bool> OnCombatVictory; // true = victory, false = defeat

        public PlayerEntity Player { get; private set; }
        public List<EnemyEntity> Enemies { get; private set; } = new List<EnemyEntity>();

        public bool IsCombatActive { get; private set; }
        public bool IsPlayerTurn { get; private set; }

        private TurnManager turnManager;

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
            if (NextEncounter != null)
            {
                InitializeCombat(NextEncounter);
                NextEncounter = null;
            }
        }

        private void OnDestroy()
        {
            if (Instance == this)
                Instance = null;
        }

        public void InitializeCombat(EncounterDataSO encounterData)
        {
            if (encounterData == null)
            {
                Debug.LogError("CombatManager: No encounter data provided!");
                return;
            }

            Enemies.Clear();

            // Spawn player
            Player = FindObjectOfType<PlayerEntity>();
            if (Player == null)
            {
                Debug.LogError("CombatManager: No PlayerEntity found in scene!");
                return;
            }

            // Load player deck from run data
            if (Core.GameManager.Instance?.CurrentRun != null)
            {
                Player.InitializeFromRunData(Core.GameManager.Instance.CurrentRun);
            }

            // Spawn enemies
            foreach (var spawnEntry in encounterData.enemySpawns)
            {
                SpawnEnemy(spawnEntry);
            }

            // Apply start-of-combat relics
            ApplyStartOfCombatRelics();

            IsCombatActive = true;
            OnCombatStart?.Invoke();

            // Start turn manager
            turnManager = new TurnManager(this);
            StartCoroutine(turnManager.StartCombat());
        }

        private void SpawnEnemy(EnemySpawnEntryData spawnEntry)
        {
            // Enemy spawning logic - instantiate prefab based on enemy data
            // This would normally instantiate from a prefab pool
            Debug.Log($"Spawning enemy: {spawnEntry.enemyData?.enemyName}");
        }

        private void ApplyStartOfCombatRelics()
        {
            foreach (RelicInstance relic in Player.Relics)
            {
                relic.ApplyEffect(RelicTrigger.StartOfCombat, Player);
            }
        }

        public bool TryPlayCard(Cards.CardInstance card, CombatEntity target)
        {
            if (!IsCombatActive || !IsPlayerTurn) return false;
            if (card == null || target == null) return false;

            // Check energy
            if (Player.EnergyManager.CurrentEnergy < card.ModifiedEnergyCost)
            {
                Debug.Log("Not enough energy!");
                return false;
            }

            // Deduct energy
            Player.EnergyManager.SpendEnergy(card.ModifiedEnergyCost);

            // Execute effects
            foreach (var effectData in card.Data.effects)
            {
                var effect = Cards.Effects.EffectFactory.CreateEffect(effectData.effectType);
                if (effect != null)
                {
                    CombatEntity effectTarget = effectData.target switch
                    {
                        TargetType.Self => Player,
                        TargetType.SingleEnemy => target,
                        TargetType.AllEnemies => target,
                        TargetType.RandomEnemy => GetRandomEnemy(),
                        _ => target
                    };

                    effect.Execute(Player, effectTarget, effectData);
                }
            }

            // Move card to appropriate pile
            if (card.IsExhausted)
            {
                Player.DeckManager.ExhaustCard(card);
            }
            else
            {
                Player.DeckManager.DiscardCard(card);
            }

            // Check combat end
            CheckCombatEnd();

            return true;
        }

        public void EndPlayerTurn()
        {
            if (!IsPlayerTurn) return;
            IsPlayerTurn = false;
            StartCoroutine(turnManager.StartEnemyTurn());
        }

        public void OnEnemyTurnComplete()
        {
            // Check for player defeat
            if (Player.CurrentHealth <= 0)
            {
                EndCombat(false);
                return;
            }

            // Start player turn
            StartCoroutine(turnManager.StartPlayerTurn());
        }

        public void CheckCombatEnd()
        {
            // Check if all enemies defeated
            bool allEnemiesDead = true;
            foreach (var enemy in Enemies)
            {
                if (enemy != null && enemy.CurrentHealth > 0)
                {
                    allEnemiesDead = false;
                    break;
                }
            }

            if (allEnemiesDead)
            {
                EndCombat(true);
            }
            else if (Player.CurrentHealth <= 0)
            {
                EndCombat(false);
            }
        }

        private void EndCombat(bool victory)
        {
            IsCombatActive = false;
            IsPlayerTurn = false;

            OnCombatEnd?.Invoke();
            OnCombatVictory?.Invoke(victory);

            if (victory)
            {
                // Calculate rewards
                int goldReward = CalculateGoldReward();
                // Show reward screen
            }
            else
            {
                // Run ended
                Core.GameManager.Instance?.EndRun(false);
            }
        }

        private int CalculateGoldReward()
        {
            int baseGold = 10;
            foreach (var enemy in Enemies)
            {
                if (enemy.EnemyData.isElite)
                    baseGold += 20;
                else if (enemy.EnemyData.isBoss)
                    baseGold += 50;
                else
                    baseGold += 10;
            }
            return baseGold;
        }

        private CombatEntity GetRandomEnemy()
        {
            if (Enemies.Count == 0) return null;
            var aliveEnemies = Enemies.FindAll(e => e != null && e.CurrentHealth > 0);
            if (aliveEnemies.Count == 0) return null;
            return aliveEnemies[UnityEngine.Random.Range(0, aliveEnemies.Count)];
        }

        public void SetPlayerTurn(bool isPlayerTurn)
        {
            IsPlayerTurn = isPlayerTurn;
        }
    }

}
