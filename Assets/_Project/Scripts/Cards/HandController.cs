using System.Collections.Generic;
using UnityEngine;
using PawfectDefense.Combat;

namespace PawfectDefense.Cards
{
    public class HandController : MonoBehaviour
    {
        public static HandController Instance { get; private set; }

        [Header("Layout Settings")]
        public float cardSpacing = 120f;
        public float arcHeight = 30f;
        public float maxAngle = 10f;
        public float yOffset = -50f;
        public float draggedCardYOffset = 100f;
        public Transform cardContainer;

        [Header("Prefabs")]
        public GameObject cardViewPrefab;

        private List<CardView> cardsInHand = new List<CardView>();
        private CardView currentlyDraggedCard;
        private Vector2[] slotPositions;
        private float[] slotAngles;

        private void Awake()
        {
            if (Instance != null)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void OnDestroy()
        {
            if (Instance == this)
                Instance = null;
        }

        public void AddCardToHand(CardInstance cardInstance)
        {
            if (cardViewPrefab == null || cardContainer == null) return;

            GameObject cardObj = Instantiate(cardViewPrefab, cardContainer);
            CardView cardView = cardObj.GetComponent<CardView>();
            if (cardView != null)
            {
                cardView.Initialize(cardInstance);
                cardsInHand.Add(cardView);
                ArrangeCards();
            }
        }

        public void RemoveCardFromHand(CardView cardView)
        {
            if (cardsInHand.Contains(cardView))
            {
                cardsInHand.Remove(cardView);
                ArrangeCards();
            }
        }

        public void ClearHand()
        {
            foreach (CardView card in cardsInHand)
            {
                if (card != null)
                    Destroy(card.gameObject);
            }
            cardsInHand.Clear();
        }

        public void ArrangeCards()
        {
            int count = cardsInHand.Count;
            if (count == 0) return;

            CalculateLayout(count);

            for (int i = 0; i < count; i++)
            {
                if (cardsInHand[i] == null) continue;
                if (cardsInHand[i] == currentlyDraggedCard) continue;

                Vector3 targetPos = cardContainer.TransformPoint(slotPositions[i]);
                cardsInHand[i].transform.position = targetPos;
                cardsInHand[i].transform.rotation = Quaternion.Euler(0, 0, slotAngles[i]);
            }
        }

        private void CalculateLayout(int count)
        {
            slotPositions = new Vector2[count];
            slotAngles = new float[count];

            if (count == 1)
            {
                slotPositions[0] = Vector2.zero;
                slotAngles[0] = 0f;
                return;
            }

            float totalWidth = (count - 1) * cardSpacing;
            float startX = -totalWidth / 2f;

            for (int i = 0; i < count; i++)
            {
                float normalizedPos = (float)i / (count - 1);
                float x = startX + i * cardSpacing;
                float y = Mathf.Sin(normalizedPos * Mathf.PI) * arcHeight + yOffset;
                float angle = Mathf.Lerp(-maxAngle, maxAngle, normalizedPos);

                slotPositions[i] = new Vector2(x, y);
                slotAngles[i] = angle;
            }
        }

        public void OnCardDragStarted(CardView cardView)
        {
            currentlyDraggedCard = cardView;
        }

        public bool OnCardDragEnded(CardView cardView, UnityEngine.EventSystems.PointerEventData eventData)
        {
            currentlyDraggedCard = null;

            // Check if dropped on a valid target
            var target = FindTargetUnderPointer(eventData);
            if (target != null)
            {
                return TryPlayCard(cardView, target);
            }

            ArrangeCards();
            return false;
        }

        private Combat.CombatEntity FindTargetUnderPointer(UnityEngine.EventSystems.PointerEventData eventData)
        {
            var results = new System.Collections.Generic.List<UnityEngine.EventSystems.RaycastResult>();
            UnityEngine.EventSystems.EventSystem.current.RaycastAll(eventData, results);

            foreach (var result in results)
            {
                var entity = result.gameObject.GetComponent<Combat.CombatEntity>();
                if (entity != null)
                    return entity;
            }

            return null;
        }

        private bool TryPlayCard(CardView cardView, Combat.CombatEntity target)
        {
            if (Combat.CombatManager.Instance == null) return false;
            return Combat.CombatManager.Instance.TryPlayCard(cardView.CardInstance, target);
        }

        public List<CardView> GetCardsInHand()
        {
            return new List<CardView>(cardsInHand);
        }

        public int GetHandSize()
        {
            return cardsInHand.Count;
        }
    }
}
