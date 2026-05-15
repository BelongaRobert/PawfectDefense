using UnityEngine;
using PawfectDefense.Data;

namespace PawfectDefense.Combat
{
    public class EnemyEntity : CombatEntity
    {
        public EnemyDataSO EnemyData { get; private set; }

        public EnemyAI EnemyAI { get; private set; }

        public EnemyIntent CurrentIntent { get; private set; }
        public Transform intentIconTransform;
        public TMPro.TextMeshProUGUI intentValueText;

        public void Initialize(EnemyDataSO data)
        {
            EnemyData = data;
            maxHealth = data.maxHealth;
            currentHealth = maxHealth;
            currentBlock = 0;

            // Setup AI
            EnemyAI = CreateAI(data.aiType);
            UpdateHealthUI();
        }

        private EnemyAI CreateAI(AIType aiType)
        {
            return aiType switch
            {
                AIType.Random => new RandomAI(EnemyData),
                AIType.Pattern => new PatternAI(EnemyData),
                AIType.Conditional => new ConditionalAI(EnemyData),
                _ => new RandomAI(EnemyData)
            };
        }

        public void ChooseNextIntent()
        {
            if (EnemyAI != null)
            {
                CurrentIntent = EnemyAI.GetNextIntent(this);
                UpdateIntentUI();
            }
        }

        public void ExecuteIntent(PlayerEntity player)
        {
            if (CurrentIntent == null || player == null) return;

            switch (CurrentIntent.intentType)
            {
                case IntentType.Attack:
                    player.TakeDamage(CurrentIntent.baseValue);
                    break;
                case IntentType.Defend:
                    GainBlock(CurrentIntent.baseValue);
                    break;
                case IntentType.Buff:
                    StatusController?.AddStatus(CurrentIntent.associatedStatus, CurrentIntent.baseValue, 1);
                    break;
                case IntentType.Debuff:
                    player.StatusController?.AddStatus(CurrentIntent.associatedStatus, CurrentIntent.baseValue, 1);
                    break;
            }
        }

        private void UpdateIntentUI()
        {
            if (CurrentIntent == null) return;

            if (intentValueText != null)
                intentValueText.text = CurrentIntent.baseValue.ToString();

            // Update intent icon based on type
            // This would swap sprites based on intent type
        }
    }
}
