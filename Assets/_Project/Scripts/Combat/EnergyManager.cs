using UnityEngine;

namespace PawfectDefense.Combat
{
    public class EnergyManager : MonoBehaviour
    {
        [Header("Energy")]
        [SerializeField] private int maxEnergy = 3;
        [SerializeField] private int currentEnergy;

        [Header("UI")]
        public TMPro.TextMeshProUGUI energyText;
        public Transform energyOrbContainer;

        public int CurrentEnergy => currentEnergy;
        public int MaxEnergy => maxEnergy;

        public void Initialize(int startingEnergy)
        {
            maxEnergy = startingEnergy;
            ResetEnergy();
        }

        public void ResetEnergy()
        {
            currentEnergy = maxEnergy;
            UpdateEnergyUI();
        }

        public bool CanSpend(int amount)
        {
            return currentEnergy >= amount;
        }

        public bool SpendEnergy(int amount)
        {
            if (!CanSpend(amount)) return false;

            currentEnergy -= amount;
            UpdateEnergyUI();
            return true;
        }

        public void GainEnergy(int amount)
        {
            currentEnergy += amount;
            UpdateEnergyUI();
        }

        public void SetMaxEnergy(int newMax)
        {
            maxEnergy = newMax;
            if (currentEnergy > maxEnergy)
                currentEnergy = maxEnergy;
            UpdateEnergyUI();
        }

        private void UpdateEnergyUI()
        {
            if (energyText != null)
                energyText.text = $"{currentEnergy}/{maxEnergy}";

            // Update orb visuals
            if (energyOrbContainer != null)
            {
                for (int i = 0; i < energyOrbContainer.childCount; i++)
                {
                    Transform orb = energyOrbContainer.GetChild(i);
                    orb.gameObject.SetActive(i < maxEnergy);

                    // Active/filled orb
                    var image = orb.GetComponent<UnityEngine.UI.Image>();
                    if (image != null)
                    {
                        image.color = i < currentEnergy ? Color.yellow : Color.gray;
                    }
                }
            }
        }
    }
}
