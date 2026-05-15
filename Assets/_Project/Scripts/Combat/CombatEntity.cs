using System.Collections.Generic;
using UnityEngine;
using PawfectDefense.Data;

namespace PawfectDefense.Combat
{
    public abstract class CombatEntity : MonoBehaviour
    {
        [Header("Health")]
        [SerializeField] protected int maxHealth = 50;
        [SerializeField] protected int currentHealth;

        [Header("Block")]
        [SerializeField] protected int currentBlock;

        public StatusEffectController StatusController { get; private set; }
        public List<RelicInstance> Relics { get; private set; } = new List<RelicInstance>();

        [Header("Visuals")]
        public Sprite entitySprite;
        public Transform healthBarTransform;
        public TMPro.TextMeshProUGUI healthText;
        public TMPro.TextMeshProUGUI blockText;

        public int CurrentHealth => currentHealth;
        public int MaxHealth => maxHealth;
        public int CurrentBlock => currentBlock;

        protected virtual void Awake()
        {
            StatusController = GetComponent<StatusEffectController>();
            if (StatusController == null)
                StatusController = gameObject.AddComponent<StatusEffectController>();

            currentHealth = maxHealth;
            currentBlock = 0;
        }

        public virtual void Initialize(int health)
        {
            maxHealth = health;
            currentHealth = health;
            currentBlock = 0;
            UpdateHealthUI();
        }

        public virtual void TakeDamage(int damage)
        {
            if (damage <= 0) return;

            // Apply block first
            if (currentBlock > 0)
            {
                int blockedDamage = Mathf.Min(damage, currentBlock);
                currentBlock -= blockedDamage;
                damage -= blockedDamage;

                // Block break effect
                if (currentBlock <= 0)
                {
                    OnBlockBroken();
                }
            }

            if (damage > 0)
            {
                currentHealth -= damage;
                OnDamageTaken(damage);
            }

            UpdateHealthUI();

            if (currentHealth <= 0)
            {
                currentHealth = 0;
                OnDefeated();
            }
        }

        public virtual void GainBlock(int amount)
        {
            if (amount <= 0) return;
            currentBlock += amount;
            OnBlockGained(amount);
            UpdateHealthUI();
        }

        public virtual void Heal(int amount)
        {
            if (amount <= 0) return;
            currentHealth = Mathf.Min(currentHealth + amount, maxHealth);
            OnHealed(amount);
            UpdateHealthUI();
        }

        public virtual void OnStartOfTurn()
        {
            // Reduce block at start of turn
            currentBlock = 0;
            StatusController?.ProcessTurnStart();
            UpdateHealthUI();
        }

        public virtual void OnEndOfTurn()
        {
            StatusController?.ProcessTurnEnd();

            // Poison damage at end of turn
            if (StatusController != null && StatusController.HasStatus(StatusType.Poison))
            {
                int poisonStacks = StatusController.GetStatusStacks(StatusType.Poison);
                TakeDamage(poisonStacks);
                StatusController.ReduceStatusDuration(StatusType.Poison);
            }
        }

        protected virtual void OnDamageTaken(int damage)
        {
            // Visual feedback: flash red, shake
            StartCoroutine(FlashDamage());
        }

        protected virtual void OnBlockGained(int amount)
        {
            // Visual feedback: green shield flash
        }

        protected virtual void OnHealed(int amount)
        {
            // Visual feedback: green particles
        }

        protected virtual void OnBlockBroken()
        {
            // Visual feedback: shield shatter
        }

        protected virtual void OnDefeated()
        {
            // Visual feedback: fade out, death animation
            Debug.Log($"{gameObject.name} defeated!");
        }

        protected void UpdateHealthUI()
        {
            if (healthText != null)
                healthText.text = $"{currentHealth}/{maxHealth}";

            if (blockText != null)
                blockText.text = currentBlock > 0 ? $"{currentBlock}" : "";

            // Update health bar fill
            if (healthBarTransform != null)
            {
                float fillAmount = (float)currentHealth / maxHealth;
                healthBarTransform.localScale = new Vector3(fillAmount, 1, 1);
            }
        }

        private System.Collections.IEnumerator FlashDamage()
        {
            SpriteRenderer sr = GetComponent<SpriteRenderer>();
            if (sr != null)
            {
                Color originalColor = sr.color;
                sr.color = Color.red;
                yield return new WaitForSeconds(0.1f);
                sr.color = originalColor;
            }
        }
    }
}
