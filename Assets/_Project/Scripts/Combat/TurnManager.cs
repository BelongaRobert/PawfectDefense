using System.Collections;
using UnityEngine;
using PawfectDefense.Cards;

namespace PawfectDefense.Combat
{
    public enum TurnState
    {
        StartOfCombat,
        PlayerTurn,
        EnemyTurn,
        EndOfCombat
    }

    public class TurnManager
    {
        private CombatManager combatManager;
        private TurnState currentState;

        public TurnState CurrentState => currentState;

        public TurnManager(CombatManager manager)
        {
            combatManager = manager;
        }

        public IEnumerator StartCombat()
        {
            currentState = TurnState.StartOfCombat;
            Debug.Log("=== COMBAT START ===");

            // Apply start-of-combat effects
            combatManager.Player?.OnStartOfTurn();

            yield return new WaitForSeconds(0.5f);

            // Start player turn
            yield return StartPlayerTurn();
        }

        public IEnumerator StartPlayerTurn()
        {
            currentState = TurnState.PlayerTurn;
            combatManager.SetPlayerTurn(true);
            Debug.Log("=== PLAYER TURN ===");

            // Reset player state
            combatManager.Player?.OnStartOfTurn();

            // Enable player input
            EnablePlayerInput(true);

            // Wait for player to end turn
            yield return WaitForPlayerEndTurn();
        }

        public IEnumerator StartEnemyTurn()
        {
            currentState = TurnState.EnemyTurn;
            combatManager.SetPlayerTurn(false);
            Debug.Log("=== ENEMY TURN ===");

            // Disable player input
            EnablePlayerInput(false);

            yield return new WaitForSeconds(0.3f);

            // Process each enemy
            foreach (var enemy in combatManager.Enemies)
            {
                if (enemy == null || enemy.CurrentHealth <= 0) continue;

                // Choose and execute intent
                enemy.ChooseNextIntent();
                yield return new WaitForSeconds(0.5f);

                enemy.ExecuteIntent(combatManager.Player);
                yield return new WaitForSeconds(0.3f);

                // Check if player defeated
                if (combatManager.Player == null || combatManager.Player.CurrentHealth <= 0)
                {
                    yield break;
                }
            }

            yield return new WaitForSeconds(0.3f);

            // End enemy turn
            combatManager.OnEnemyTurnComplete();
        }

        private IEnumerator WaitForPlayerEndTurn()
        {
            // Wait until player presses end turn
            while (currentState == TurnState.PlayerTurn)
            {
                yield return null;
            }
        }

        private void EnablePlayerInput(bool enable)
        {
            // Enable/disable card interaction
            var handController = Cards.HandController.Instance;
            if (handController != null)
            {
                foreach (var card in handController.GetCardsInHand())
                {
                    card?.SetInteractable(enable);
                }
            }
        }

        public void ForceEndPlayerTurn()
        {
            if (currentState == TurnState.PlayerTurn)
            {
                currentState = TurnState.EnemyTurn;
            }
        }
    }
}
