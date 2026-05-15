using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using PawfectDefense.Data;
using PawfectDefense.Cards;
using PawfectDefense.Core;

namespace PawfectDefense.UI
{
    public class ShopController : MonoBehaviour
    {
        [Header("UI References")]
        public TextMeshProUGUI goldText;
        public Transform cardOfferContainer;
        public Transform relicOfferContainer;
        public Button leaveButton;
        public Button removeCardButton;

        [Header("Prefabs")]
        public GameObject shopCardPrefab;
        public GameObject shopRelicPrefab;

        [Header("Settings")]
        public int cardsForSale = 3;
        public int relicsForSale = 2;
        public int cardBasePrice = 50;
        public int relicBasePrice = 150;
        public int removeCardPrice = 75;

        private List<CardDataSO> offeredCards = new List<CardDataSO>();
        private List<RelicDataSO> offeredRelics = new List<RelicDataSO>();

        private void Start()
        {
            leaveButton?.onClick.AddListener(OnLeaveClicked);
            removeCardButton?.onClick.AddListener(OnRemoveCardClicked);
            GenerateShop();
            UpdateGoldDisplay();
        }

        private void GenerateShop()
        {
            GenerateCardOffers();
            GenerateRelicOffers();
        }

        private void GenerateCardOffers()
        {
            offeredCards.Clear();
            var allCards = CardDatabase.Instance?.GetAllCards();
            if (allCards == null || allCards.Count == 0) return;

            for (int i = 0; i < cardsForSale; i++)
            {
                CardDataSO card = allCards[Random.Range(0, allCards.Count)];
                offeredCards.Add(card);
                CreateCardOffer(card, i);
            }
        }

        private void CreateCardOffer(CardDataSO card, int index)
        {
            if (shopCardPrefab == null || cardOfferContainer == null) return;

            GameObject obj = Instantiate(shopCardPrefab, cardOfferContainer);
            var cardView = obj.GetComponent<CardView>();
            var priceText = obj.transform.Find("PriceText")?.GetComponent<TextMeshProUGUI>();
            var buyButton = obj.GetComponentInChildren<Button>();

            if (cardView != null)
            {
                var instance = new CardInstance(card);
                cardView.Initialize(instance);
            }

            int price = GetCardPrice(card);
            if (priceText != null)
                priceText.text = $"{price}g";

            if (buyButton != null)
            {
                int capturedPrice = price;
                buyButton.onClick.AddListener(() => BuyCard(card, capturedPrice, obj));
            }
        }

        private void GenerateRelicOffers()
        {
            offeredRelics.Clear();
            var allRelics = RelicLibrary.Instance?.GetAllRelics();
            if (allRelics == null || allRelics.Count == 0) return;

            for (int i = 0; i < relicsForSale; i++)
            {
                RelicDataSO relic = allRelics[Random.Range(0, allRelics.Count)];
                offeredRelics.Add(relic);
                CreateRelicOffer(relic, i);
            }
        }

        private void CreateRelicOffer(RelicDataSO relic, int index)
        {
            if (shopRelicPrefab == null || relicOfferContainer == null) return;

            GameObject obj = Instantiate(shopRelicPrefab, relicOfferContainer);
            var nameText = obj.transform.Find("NameText")?.GetComponent<TextMeshProUGUI>();
            var descText = obj.transform.Find("DescText")?.GetComponent<TextMeshProUGUI>();
            var priceText = obj.transform.Find("PriceText")?.GetComponent<TextMeshProUGUI>();
            var buyButton = obj.GetComponentInChildren<Button>();
            var iconImage = obj.transform.Find("Icon")?.GetComponent<Image>();

            if (nameText != null) nameText.text = relic.relicName;
            if (descText != null) descText.text = relic.description;
            if (iconImage != null) iconImage.sprite = relic.relicArt;

            int price = GetRelicPrice(relic);
            if (priceText != null)
                priceText.text = $"{price}g";

            if (buyButton != null)
            {
                int capturedPrice = price;
                buyButton.onClick.AddListener(() => BuyRelic(relic, capturedPrice, obj));
            }
        }

        private int GetCardPrice(CardDataSO card)
        {
            return card.rarity switch
            {
                CardRarity.Rare => cardBasePrice * 3,
                CardRarity.Uncommon => cardBasePrice * 2,
                _ => cardBasePrice
            };
        }

        private int GetRelicPrice(RelicDataSO relic)
        {
            return relic.rarity switch
            {
                RelicRarity.Boss => relicBasePrice * 4,
                RelicRarity.Rare => relicBasePrice * 3,
                RelicRarity.Uncommon => relicBasePrice * 2,
                _ => relicBasePrice
            };
        }

        private void BuyCard(CardDataSO card, int price, GameObject offerObj)
        {
            if (Core.GameManager.Instance?.CurrentRun == null) return;

            var run = Core.GameManager.Instance.CurrentRun;
            if (run.gold < price)
            {
                Debug.Log("Not enough gold!");
                return;
            }

            run.gold -= price;
            run.currentDeckIds.Add(card.cardId);
            UpdateGoldDisplay();
            Destroy(offerObj);
        }

        private void BuyRelic(RelicDataSO relic, int price, GameObject offerObj)
        {
            if (Core.GameManager.Instance?.CurrentRun == null) return;

            var run = Core.GameManager.Instance.CurrentRun;
            if (run.gold < price)
            {
                Debug.Log("Not enough gold!");
                return;
            }

            run.gold -= price;
            run.currentRelicIds.Add(relic.relicId);
            UpdateGoldDisplay();
            Destroy(offerObj);
        }

        private void OnRemoveCardClicked()
        {
            if (Core.GameManager.Instance?.CurrentRun == null) return;

            var run = Core.GameManager.Instance.CurrentRun;
            if (run.gold < removeCardPrice)
            {
                Debug.Log("Not enough gold to remove a card!");
                return;
            }

            if (run.currentDeckIds.Count > 0)
            {
                run.gold -= removeCardPrice;
                int index = Random.Range(0, run.currentDeckIds.Count);
                string removedId = run.currentDeckIds[index];
                run.currentDeckIds.RemoveAt(index);
                Debug.Log($"Removed card: {removedId}");
                UpdateGoldDisplay();
            }
        }

        private void UpdateGoldDisplay()
        {
            if (goldText != null && Core.GameManager.Instance?.CurrentRun != null)
            {
                goldText.text = $"Gold: {Core.GameManager.Instance.CurrentRun.gold}";
            }
        }

        private void OnLeaveClicked()
        {
            Core.SceneLoader.Instance?.LoadScene("Map");
        }
    }
}
