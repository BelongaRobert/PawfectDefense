using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using PawfectDefense.Data;
using PawfectDefense.Core;

namespace PawfectDefense.UI
{
    public class DeckSelectController : MonoBehaviour
    {
        [Header("Pet Selection")]
        public List<PetSelectButton> petButtons = new List<PetSelectButton>();
        public Image petPreviewImage;
        public TMPro.TextMeshProUGUI petNameText;
        public TMPro.TextMeshProUGUI petDescriptionText;
        public TMPro.TextMeshProUGUI deckPreviewText;

        [Header("Buttons")]
        public Button startRunButton;
        public Button backButton;

        [Header("Pet Data")]
        public List<PetDisplayData> petDisplayData = new List<PetDisplayData>();

        private PetType selectedPet = PetType.Dog;

        private void Awake()
        {
            if (startRunButton != null)
                startRunButton.onClick.AddListener(OnStartRunClicked);

            if (backButton != null)
                backButton.onClick.AddListener(OnBackClicked);

            foreach (var btn in petButtons)
            {
                if (btn != null && btn.button != null)
                {
                    PetType type = btn.petType;
                    btn.button.onClick.AddListener(() => SelectPet(type));
                }
            }
        }

        private void Start()
        {
            SelectPet(PetType.Dog);
        }

        public void SelectPet(PetType petType)
        {
            selectedPet = petType;

            var display = petDisplayData.Find(p => p.petType == petType);
            if (display != null)
            {
                petPreviewImage.sprite = display.petSprite;
                petNameText.text = display.displayName;
                petDescriptionText.text = display.description;
            }

            UpdateDeckPreview(petType);
            UpdateButtonSelection();
        }

        private void UpdateDeckPreview(PetType petType)
        {
            var deckIds = Core.GameManager.Instance?.GetStartingDeck(petType);
            if (deckIds == null)
            {
                deckPreviewText.text = "No deck data available.";
                return;
            }

            System.Text.StringBuilder sb = new System.Text.StringBuilder();
            sb.AppendLine($"Starting Deck ({deckIds.Count} cards):");
            sb.AppendLine();

            Dictionary<string, int> cardCounts = new Dictionary<string, int>();
            foreach (string id in deckIds)
            {
                if (cardCounts.ContainsKey(id))
                    cardCounts[id]++;
                else
                    cardCounts[id] = 1;
            }

            foreach (var kvp in cardCounts)
            {
                var cardData = Data.CardDatabase.Instance?.GetCard(kvp.Key);
                string cardName = cardData?.cardName ?? kvp.Key;
                string rarity = cardData?.rarity.ToString() ?? "Common";
                sb.AppendLine($"  {kvp.Value}x {cardName} ({rarity})");
            }

            deckPreviewText.text = sb.ToString();
        }

        private void UpdateButtonSelection()
        {
            foreach (var btn in petButtons)
            {
                if (btn == null) continue;
                Color color = btn.petType == selectedPet ? btn.selectedColor : btn.normalColor;
                if (btn.buttonImage != null)
                    btn.buttonImage.color = color;
            }
        }

        private void OnStartRunClicked()
        {
            Core.GameManager.Instance?.StartNewRun(selectedPet);
            Core.SceneLoader.Instance?.LoadScene("Map");
        }

        private void OnBackClicked()
        {
            Core.SceneLoader.Instance?.LoadScene("MainMenu");
        }
    }

    [System.Serializable]
    public class PetSelectButton
    {
        public Button button;
        public Image buttonImage;
        public PetType petType;
        public Color normalColor = Color.white;
        public Color selectedColor = Color.yellow;
    }

    [System.Serializable]
    public class PetDisplayData
    {
        public PetType petType;
        public string displayName;
        [TextArea(2, 4)] public string description;
        public Sprite petSprite;
    }
}
