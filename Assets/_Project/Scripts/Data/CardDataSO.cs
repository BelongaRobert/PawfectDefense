using System;
using System.Collections.Generic;
using UnityEngine;

namespace PawfectDefense.Data
{
    [CreateAssetMenu(fileName = "NewCard", menuName = "PawfectDefense/Card")]
    public class CardDataSO : ScriptableObject
    {
        [Header("Identity")]
        public string cardId;
        public string cardName;
        [TextArea(2, 4)] public string description;

        [Header("Cost & Rarity")]
        [Range(0, 3)] public int energyCost = 1;
        public CardRarity rarity = CardRarity.Common;

        [Header("Pet Type")]
        public PetType petType = PetType.Dog;

        [Header("Visuals")]
        public Sprite cardArt;

        [Header("Effects")]
        public List<CardEffectData> effects = new List<CardEffectData>();

        private void OnValidate()
        {
            if (string.IsNullOrEmpty(cardId))
                cardId = name.ToLower().Replace(" ", "_");
        }
    }

    public enum CardRarity { Common, Uncommon, Rare }

    public enum PetType
    {
        Dog,
        Cat,
        Reptile,
        Bird,
        Neutral
    }
}
