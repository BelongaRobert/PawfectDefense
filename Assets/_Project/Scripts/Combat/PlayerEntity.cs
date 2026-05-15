using System.Collections.Generic;
using UnityEngine;
using PawfectDefense.Cards;
using PawfectDefense.SaveLoad;
using PawfectDefense.Deck;

namespace PawfectDefense.Combat
{
    public class PlayerEntity : CombatEntity
    {
        public EnergyManager EnergyManager { get; private set; }
        public Deck.DeckManager DeckManager { get; private set; }

        [Header("Starting Stats")]
        public int startingMaxHealth = 80;
        public int startingEnergy = 3;

        protected override void Awake()
        {
            base.Awake();
            EnergyManager = GetComponent<EnergyManager>();
            if (EnergyManager == null)
                EnergyManager = gameObject.AddComponent<EnergyManager>();

            DeckManager = GetComponent<Deck.DeckManager>();
            if (DeckManager == null)
                DeckManager = gameObject.AddComponent<Deck.DeckManager>();
        }

        public void InitializeFromRunData(SaveLoad.RunData runData)
        {
            if (runData == null) return;

            maxHealth = runData.maxHealth;
            currentHealth = runData.currentHealth;
            currentBlock = 0;

            EnergyManager.Initialize(startingEnergy);

            // Load deck
            if (runData.currentDeckIds != null)
            {
                List<Cards.CardInstance> deckCards = new List<Cards.CardInstance>();
                foreach (string cardId in runData.currentDeckIds)
                {
                    var cardData = Data.CardDatabase.Instance?.GetCard(cardId);
                    if (cardData != null)
                        deckCards.Add(new Cards.CardInstance(cardData));
                }
                DeckManager.InitializeDeck(deckCards);
            }

            UpdateHealthUI();
        }

        public override void OnStartOfTurn()
        {
            base.OnStartOfTurn();
            EnergyManager.ResetEnergy();
            DeckManager.Draw(5);
        }

        public void AddRelic(RelicInstance relic)
        {
            if (relic != null && !Relics.Exists(r => r.Data.relicId == relic.Data.relicId))
            {
                Relics.Add(relic);
            }
        }

        public void RemoveRelic(string relicId)
        {
            Relics.RemoveAll(r => r.Data.relicId == relicId);
        }
    }
}
