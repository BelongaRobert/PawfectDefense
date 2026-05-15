using System.Collections.Generic;
using UnityEngine;

namespace PawfectDefense.Data
{
    public class CardDatabase : MonoBehaviour
    {
        public static CardDatabase Instance { get; private set; }

        private Dictionary<string, CardDataSO> cardsById = new Dictionary<string, CardDataSO>();
        private List<CardDataSO> allCards = new List<CardDataSO>();

        private void Awake()
        {
            if (Instance != null)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            LoadAllCards();
        }

        private void LoadAllCards()
        {
            CardDataSO[] loaded = Resources.LoadAll<CardDataSO>("Data/Cards");
            foreach (CardDataSO card in loaded)
            {
                if (card == null || string.IsNullOrEmpty(card.cardId)) continue;
                if (!cardsById.ContainsKey(card.cardId))
                {
                    cardsById.Add(card.cardId, card);
                    allCards.Add(card);
                }
            }
        }

        public void RegisterCard(CardDataSO card)
        {
            if (card == null || string.IsNullOrEmpty(card.cardId)) return;
            if (!cardsById.ContainsKey(card.cardId))
            {
                cardsById.Add(card.cardId, card);
                allCards.Add(card);
            }
        }

        public CardDataSO GetCard(string cardId)
        {
            cardsById.TryGetValue(cardId, out CardDataSO card);
            return card;
        }

        public List<CardDataSO> GetCardsByPetType(PetType petType)
        {
            List<CardDataSO> result = new List<CardDataSO>();
            foreach (CardDataSO card in allCards)
            {
                if (card.petType == petType)
                    result.Add(card);
            }
            return result;
        }

        public List<CardDataSO> GetCardsByRarity(CardRarity rarity)
        {
            List<CardDataSO> result = new List<CardDataSO>();
            foreach (CardDataSO card in allCards)
            {
                if (card.rarity == rarity)
                    result.Add(card);
            }
            return result;
        }

        public List<CardDataSO> GetAllCards()
        {
            return new List<CardDataSO>(allCards);
        }

        public bool HasCard(string cardId)
        {
            return cardsById.ContainsKey(cardId);
        }
    }
}
