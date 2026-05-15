using UnityEngine;
using UnityEngine.UI;
using TMPro;
using PawfectDefense.Core;

namespace PawfectDefense.UI
{
    public class GameOverController : MonoBehaviour
    {
        [Header("UI References")]
        public TextMeshProUGUI resultText;
        public TextMeshProUGUI statsText;
        public Button mainMenuButton;
        public Button newRunButton;

        [Header("Colors")]
        public Color victoryColor = new Color(0.2f, 0.8f, 0.2f);
        public Color defeatColor = new Color(0.8f, 0.2f, 0.2f);

        private void Start()
        {
            mainMenuButton?.onClick.AddListener(OnMainMenuClicked);
            newRunButton?.onClick.AddListener(OnNewRunClicked);
            DisplayResults();
        }

        private void DisplayResults()
        {
            var run = Core.GameManager.Instance?.CurrentRun;
            bool victory = run != null && run.currentHealth > 0;

            if (resultText != null)
            {
                resultText.text = victory ? "VICTORY!" : "DEFEAT";
                resultText.color = victory ? victoryColor : defeatColor;
            }

            if (statsText != null && run != null)
            {
                statsText.text = $"Pet: {run.petTypeUsed}\n" +
                                 $"Floor Reached: {run.floorReached}\n" +
                                 $"Gold Earned: {run.gold}\n" +
                                 $"Deck Size: {run.currentDeckIds.Count}\n" +
                                 $"Relics Collected: {run.currentRelicIds.Count}";
            }

            if (!victory)
            {
                Core.GameManager.Instance?.EndRun(false);
            }
        }

        private void OnMainMenuClicked()
        {
            Core.SceneLoader.Instance?.LoadScene("MainMenu");
        }

        private void OnNewRunClicked()
        {
            Core.SceneLoader.Instance?.LoadScene("DeckSelect");
        }
    }
}
