using UnityEngine;
using PawfectDefense.Data;

namespace PawfectDefense.Cards
{
    public class CardInstance
    {
        public CardDataSO Data { get; private set; }
        public int ModifiedEnergyCost { get; set; }
        public bool IsExhausted { get; set; }
        public bool IsEthereal { get; set; }

        public CardInstance(CardDataSO data)
        {
            Data = data;
            ModifiedEnergyCost = data.energyCost;
            IsExhausted = false;
            IsEthereal = false;
        }

        public void ResetModifiers()
        {
            ModifiedEnergyCost = Data.energyCost;
        }

        public string GetDisplayName()
        {
            return Data.cardName;
        }

        public string GetDisplayDescription()
        {
            return Data.description;
        }
    }
}
