using System;
using System.Collections.Generic;
using UnityEngine;
using PawfectDefense.Cards;

namespace PawfectDefense.Deck
{
    public class DeckManager : MonoBehaviour
    {
        public List<Cards.CardInstance> DrawPile { get; private set; } = new List<Cards.CardInstance>();
        public List<Cards.CardInstance> HandPile { get; private set; } = new List<Cards.CardInstance>();
        public List<Cards.CardInstance> DiscardPile { get; private set; } = new List<Cards.CardInstance>();
        public List<Cards.CardInstance> ExhaustPile { get; private set; } = new List<Cards.CardInstance>();

        public event Action<Cards.CardInstance> OnCardDrawn;
        public event Action<Cards.CardInstance> OnCardDiscarded;
        public event Action<Cards.CardInstance> OnCardExhausted;
        public event Action OnDeckShuffled;

        [Header("Settings")]
        public int maxHandSize = 10;

        private System.Random random = new System.Random();

        public void InitializeDeck(List<Cards.CardInstance> cards)
        {
            DrawPile.Clear();
            HandPile.Clear();
            DiscardPile.Clear();
            ExhaustPile.Clear();

            foreach (var card in cards)
            {
                DrawPile.Add(card);
            }

            ShuffleDrawPile();
        }

        public void Draw(int amount)
        {
            for (int i = 0; i < amount; i++)
            {
                if (HandPile.Count >= maxHandSize)
                {
                    Debug.Log("Hand is full! Cannot draw more cards.");
                    break;
                }

                // Shuffle discard into draw if empty
                if (DrawPile.Count == 0)
                {
                    if (DiscardPile.Count == 0)
                    {
                        Debug.Log("No cards left to draw!");
                        break;
                    }
                    ShuffleDiscardIntoDraw();
                }

                // Draw top card
                if (DrawPile.Count > 0)
                {
                    Cards.CardInstance card = DrawPile[0];
                    DrawPile.RemoveAt(0);
                    HandPile.Add(card);
                    OnCardDrawn?.Invoke(card);
                }
            }
        }

        public void DiscardCard(Cards.CardInstance card)
        {
            if (card == null) return;

            HandPile.Remove(card);
            DiscardPile.Add(card);
            OnCardDiscarded?.Invoke(card);
        }

        public void ExhaustCard(Cards.CardInstance card)
        {
            if (card == null) return;

            HandPile.Remove(card);
            DrawPile.Remove(card);
            DiscardPile.Remove(card);
            ExhaustPile.Add(card);
            OnCardExhausted?.Invoke(card);
        }

        public void DiscardHand()
        {
            List<Cards.CardInstance> cardsToDiscard = new List<Cards.CardInstance>(HandPile);
            foreach (var card in cardsToDiscard)
            {
                DiscardCard(card);
            }
        }

        public void AddCardToDrawPile(Cards.CardInstance card, bool shuffle = true)
        {
            if (card == null) return;

            DrawPile.Add(card);
            if (shuffle)
                ShuffleDrawPile();
        }

        public void AddCardToDiscardPile(Cards.CardInstance card)
        {
            if (card == null) return;
            DiscardPile.Add(card);
        }

        public void RemoveCardFromDeck(Cards.CardInstance card)
        {
            if (card == null) return;

            DrawPile.Remove(card);
            HandPile.Remove(card);
            DiscardPile.Remove(card);
            ExhaustPile.Remove(card);
        }

        private void ShuffleDrawPile()
        {
            ShuffleList(DrawPile);
            OnDeckShuffled?.Invoke();
        }

        private void ShuffleDiscardIntoDraw()
        {
            DrawPile.AddRange(DiscardPile);
            DiscardPile.Clear();
            ShuffleDrawPile();
            Debug.Log("Shuffled discard pile into draw pile.");
        }

        private void ShuffleList<T>(List<T> list)
        {
            int n = list.Count;
            for (int i = n - 1; i > 0; i--)
            {
                int j = random.Next(i + 1);
                (list[i], list[j]) = (list[j], list[i]);
            }
        }

        public int GetTotalDeckCount()
        {
            return DrawPile.Count + HandPile.Count + DiscardPile.Count + ExhaustPile.Count;
        }

        public List<Cards.CardInstance> GetAllCards()
        {
            var all = new List<Cards.CardInstance>();
            all.AddRange(DrawPile);
            all.AddRange(HandPile);
            all.AddRange(DiscardPile);
            all.AddRange(ExhaustPile);
            return all;
        }
    }
}
