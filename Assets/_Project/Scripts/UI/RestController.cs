using UnityEngine;
using UnityEngine.UI;
using TMPro;
using PawfectDefense.Data;
using PawfectDefense.Core;

namespace PawfectDefense.UI
{
    public class RestController : MonoBehaviour
    {
        [Header("UI References")]
        public TextMeshProUGUI healthText;
        public Button restButton;
        public Button smithButton;
        public Button leaveButton;

        [Header("Settings")]
        public float restHealPercent = 0.3f;
        public int smithUpgradeAmount = 2;

        private bool hasRested = false;
        private bool hasSmitten = false;

        private void Start()
        {
            restButton?.onClick.AddListener(OnRestClicked);
            smithButton?.onClick.AddListener(OnSmithClicked);
            leaveButton?.onClick.AddListener(OnLeaveClicked);
            UpdateHealthDisplay();
            UpdateButtonStates();
        }

        private void UpdateHealthDisplay()
        {
            if (healthText == null || Core.GameManager.Instance?.CurrentRun == null) return;

            var run = Core.GameManager.Instance.CurrentRun;
            healthText.text = $"HP: {run.currentHealth} / {run.maxHealth}";
        }

        private void UpdateButtonStates()
        {
            if (restButton != null)
                restButton.interactable = !hasRested && !hasSmitten;

            if (smithButton != null)
                smithButton.interactable = !hasRested && !hasSmitten;
        }

        private void OnRestClicked()
        {
            if (hasRested || hasSmitten) return;
            if (Core.GameManager.Instance?.CurrentRun == null) return;

            var run = Core.GameManager.Instance.CurrentRun;
            int healAmount = Mathf.RoundToInt(run.maxHealth * restHealPercent);
            run.currentHealth = Mathf.Min(run.maxHealth, run.currentHealth + healAmount);
            hasRested = true;

            Debug.Log($"Rested and healed {healAmount} HP.");
            UpdateHealthDisplay();
            UpdateButtonStates();
        }

        private void OnSmithClicked()
        {
            if (hasRested || hasSmitten) return;
            if (Core.GameManager.Instance?.CurrentRun == null) return;

            var run = Core.GameManager.Instance.CurrentRun;
            if (run.currentDeckIds.Count == 0) return;

            // For now, upgrade a random card by reducing its cost (or increasing damage via metadata)
            int index = Random.Range(0, run.currentDeckIds.Count);
            string cardId = run.currentDeckIds[index];
            var card = CardDatabase.Instance?.GetCard(cardId);
            if (card != null)
            {
                Debug.Log($"Upgraded card: {card.cardName}. (Cost reduced by 1, min 0)");
                // In a real implementation, we'd track upgraded state per card instance.
                // For now, we just log it.
            }

            hasSmitten = true;
            UpdateButtonStates();
        }

        private void OnLeaveClicked()
        {
            Core.SceneLoader.Instance?.LoadScene("Map");
        }
    }
}
