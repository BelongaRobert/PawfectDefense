using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using PawfectDefense.Data;
using PawfectDefense.Core;

namespace PawfectDefense.UI
{
    public class RewardScreenController : MonoBehaviour
    {
        [Header("Gold Reward")]
        public GameObject goldRewardPanel;
        public TMPro.TextMeshProUGUI goldAmountText;

        [Header("Card Rewards")]
        public GameObject cardRewardPanel;
        public List<CardRewardSlot> cardRewardSlots = new List<CardRewardSlot>();
        public Button skipCardsButton;

        [Header("Relic Reward")]
        public GameObject relicRewardPanel;
        public Image relicIconImage;
        public TMPro.TextMeshProUGUI relicNameText;
        public TMPro.TextMeshProUGUI relicDescriptionText;
        public Button skipRelicButton;

        [Header("Continue")]
        public Button continueButton;

        private int goldReward;
        private List<Data.CardDataSO> cardRewards = new List<Data.CardDataSO>();
        private Data.RelicDataSO relicReward;
        private bool cardsPicked;
        private bool relicPicked;

        public void Initialize(int gold, List<Data.CardDataSO> cards, Data.RelicDataSO relic)
        {
            goldReward = gold;
            cardRewards = cards ?? new List<Data.CardDataSO>();
            relicReward = relic;
            cardsPicked = false;
            relicPicked = false;

            SetupGold();
            SetupCards();
            SetupRelic();
            UpdateContinueButton();
        }

        private void SetupGold()
        {
            if (goldRewardPanel != null)
                goldRewardPanel.SetActive(goldReward > 0);

            if (goldAmountText != null)
                goldAmountText.text = $"+{goldReward} Gold";

            if (Core.GameManager.Instance?.CurrentRun != null)
                Core.GameManager.Instance.CurrentRun.gold += goldReward;
        }

        private void SetupCards()
        {
            bool hasCards = cardRewards.Count > 0;
            if (cardRewardPanel != null)
                cardRewardPanel.SetActive(hasCards);

            for (int i = 0; i < cardRewardSlots.Count; i++)
            {
                var slot = cardRewardSlots[i];
                if (slot == null) continue;

                if (i < cardRewards.Count)
                {
                    var card = cardRewards[i];
                    slot.gameObject.SetActive(true);
                    slot.Setup(card, () => OnCardSelected(card, slot));
                }
                else
                {
                    slot.gameObject.SetActive(false);
                }
            }

            if (skipCardsButton != null)
            {
                skipCardsButton.gameObject.SetActive(hasCards);
                skipCardsButton.onClick.RemoveAllListeners();
                skipCardsButton.onClick.AddListener(OnSkipCards);
            }
        }

        private void SetupRelic()
        {
            bool hasRelic = relicReward != null;
            if (relicRewardPanel != null)
                relicRewardPanel.SetActive(hasRelic);

            if (hasRelic)
            {
                if (relicIconImage != null)
                    relicIconImage.sprite = relicReward.relicArt;
                if (relicNameText != null)
                    relicNameText.text = relicReward.relicName;
                if (relicDescriptionText != null)
                    relicDescriptionText.text = relicReward.description;
            }

            if (skipRelicButton != null)
            {
                skipRelicButton.gameObject.SetActive(hasRelic);
                skipRelicButton.onClick.RemoveAllListeners();
                skipRelicButton.onClick.AddListener(OnSkipRelic);
            }

            if (relicRewardPanel != null)
            {
                Button relicPanelButton = relicRewardPanel.GetComponent<Button>();
                if (relicPanelButton != null)
                {
                    relicPanelButton.onClick.RemoveAllListeners();
                    relicPanelButton.onClick.AddListener(OnRelicSelected);
                }
            }
        }

        private void OnCardSelected(Data.CardDataSO card, CardRewardSlot slot)
        {
            if (cardsPicked) return;

            // Add card to deck
            var run = Core.GameManager.Instance?.CurrentRun;
            if (run != null)
            {
                run.currentDeckIds.Add(card.cardId);
            }

            cardsPicked = true;

            // Disable all card slots
            foreach (var s in cardRewardSlots)
            {
                if (s != null)
                    s.SetInteractable(false);
            }

            if (skipCardsButton != null)
                skipCardsButton.gameObject.SetActive(false);

            UpdateContinueButton();
        }

        private void OnSkipCards()
        {
            if (cardsPicked) return;
            cardsPicked = true;

            foreach (var s in cardRewardSlots)
            {
                if (s != null)
                    s.SetInteractable(false);
            }

            if (skipCardsButton != null)
                skipCardsButton.gameObject.SetActive(false);

            UpdateContinueButton();
        }

        private void OnRelicSelected()
        {
            if (relicPicked) return;

            var run = Core.GameManager.Instance?.CurrentRun;
            if (run != null && relicReward != null)
            {
                run.currentRelicIds.Add(relicReward.relicId);
            }

            relicPicked = true;
            if (relicRewardPanel != null)
            {
                Button btn = relicRewardPanel.GetComponent<Button>();
                if (btn != null)
                    btn.interactable = false;
            }

            if (skipRelicButton != null)
                skipRelicButton.gameObject.SetActive(false);

            UpdateContinueButton();
        }

        private void OnSkipRelic()
        {
            if (relicPicked) return;
            relicPicked = true;

            if (relicRewardPanel != null)
            {
                Button btn = relicRewardPanel.GetComponent<Button>();
                if (btn != null)
                    btn.interactable = false;
            }

            if (skipRelicButton != null)
                skipRelicButton.gameObject.SetActive(false);

            UpdateContinueButton();
        }

        private void UpdateContinueButton()
        {
            bool canContinue = true;

            if (cardRewards.Count > 0 && !cardsPicked)
                canContinue = false;

            if (relicReward != null && !relicPicked)
                canContinue = false;

            if (continueButton != null)
                continueButton.interactable = canContinue;
        }

        public void OnContinueClicked()
        {
            Core.SceneLoader.Instance?.LoadScene("Map");
        }
    }

    public class CardRewardSlot : MonoBehaviour
    {
        public Image cardArtImage;
        public TMPro.TextMeshProUGUI cardNameText;
        public TMPro.TextMeshProUGUI cardDescriptionText;
        public TMPro.TextMeshProUGUI cardCostText;
        public Image frameImage;
        public Button button;

        public void Setup(Data.CardDataSO card, UnityEngine.Events.UnityAction onClick)
        {
            if (cardArtImage != null)
                cardArtImage.sprite = card.cardArt;
            if (cardNameText != null)
                cardNameText.text = card.cardName;
            if (cardDescriptionText != null)
                cardDescriptionText.text = card.description;
            if (cardCostText != null)
                cardCostText.text = card.energyCost.ToString();

            if (frameImage != null)
            {
                frameImage.color = card.rarity switch
                {
                    CardRarity.Uncommon => new Color(0.3f, 0.8f, 0.3f),
                    CardRarity.Rare => new Color(0.8f, 0.6f, 0.1f),
                    _ => Color.white
                };
            }

            if (button != null)
            {
                button.onClick.RemoveAllListeners();
                button.onClick.AddListener(onClick);
                button.interactable = true;
            }
        }

        public void SetInteractable(bool interactable)
        {
            if (button != null)
                button.interactable = interactable;

            if (frameImage != null)
                frameImage.color = interactable ? Color.white : Color.gray;
        }
    }
}
