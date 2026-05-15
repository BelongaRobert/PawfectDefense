using System.Collections;
using UnityEngine;
using UnityEngine.EventSystems;
using PawfectDefense.Data;

namespace PawfectDefense.Cards
{
    [RequireComponent(typeof(CanvasGroup))]
    [RequireComponent(typeof(RectTransform))]
    public class CardView : MonoBehaviour, IBeginDragHandler, IDragHandler, IEndDragHandler, IPointerEnterHandler, IPointerExitHandler
    {
        [Header("References")]
        public UnityEngine.UI.Image cardArtImage;
        public TMPro.TextMeshProUGUI nameText;
        public TMPro.TextMeshProUGUI descriptionText;
        public TMPro.TextMeshProUGUI costText;
        public UnityEngine.UI.Image frameImage;
        public UnityEngine.UI.Image petTypeIcon;

        [Header("Visual Settings")]
        public float hoverScale = 1.2f;
        public float hoverYOffset = 50f;
        public float dragTiltAmount = 10f;
        public float animDuration = 0.15f;

        [Header("Colors")]
        public Color commonFrameColor = Color.white;
        public Color uncommonFrameColor = new Color(0.3f, 0.8f, 0.3f);
        public Color rareFrameColor = new Color(0.8f, 0.6f, 0.1f);
        public Color validTargetColor = new Color(0.3f, 1f, 0.3f, 0.5f);
        public Color invalidTargetColor = new Color(1f, 0.3f, 0.3f, 0.5f);

        public CardInstance CardInstance { get; private set; }
        public bool IsDragging { get; private set; }
        public bool IsHovering { get; private set; }

        private CanvasGroup canvasGroup;
        private RectTransform rectTransform;
        private Vector3 originalPosition;
        private Vector3 originalScale;
        private Transform originalParent;
        private int originalSiblingIndex;
        private bool isInteractable = true;

        private void Awake()
        {
            canvasGroup = GetComponent<CanvasGroup>();
            rectTransform = GetComponent<RectTransform>();
        }

        public void Initialize(CardInstance cardInstance)
        {
            CardInstance = cardInstance;
            UpdateVisuals();
        }

        private void UpdateVisuals()
        {
            if (CardInstance == null || CardInstance.Data == null) return;

            nameText.text = CardInstance.GetDisplayName();
            descriptionText.text = CardInstance.GetDisplayDescription();
            costText.text = CardInstance.ModifiedEnergyCost.ToString();
            cardArtImage.sprite = CardInstance.Data.cardArt;

            frameImage.color = CardInstance.Data.rarity switch
            {
                CardRarity.Uncommon => uncommonFrameColor,
                CardRarity.Rare => rareFrameColor,
                _ => commonFrameColor
            };
        }

        public void SetInteractable(bool interactable)
        {
            isInteractable = interactable;
            canvasGroup.alpha = interactable ? 1f : 0.5f;
            canvasGroup.blocksRaycasts = interactable;
        }

        public void OnPointerEnter(PointerEventData eventData)
        {
            if (!isInteractable || IsDragging) return;
            IsHovering = true;
            StartCoroutine(AnimateHover(true));
        }

        public void OnPointerExit(PointerEventData eventData)
        {
            if (!isInteractable || IsDragging) return;
            IsHovering = false;
            StartCoroutine(AnimateHover(false));
        }

        public void OnBeginDrag(PointerEventData eventData)
        {
            if (!isInteractable) return;
            IsDragging = true;
            originalPosition = rectTransform.position;
            originalScale = rectTransform.localScale;
            originalParent = transform.parent;
            originalSiblingIndex = transform.GetSiblingIndex();

            canvasGroup.blocksRaycasts = false;
            transform.SetParent(transform.root);
            transform.SetAsLastSibling();

            HandController.Instance?.OnCardDragStarted(this);
        }

        public void OnDrag(PointerEventData eventData)
        {
            if (!IsDragging) return;
            rectTransform.position = eventData.position;

            float tilt = Mathf.Clamp(eventData.delta.x * 0.5f, -dragTiltAmount, dragTiltAmount);
            rectTransform.rotation = Quaternion.Euler(0, 0, -tilt);
        }

        public void OnEndDrag(PointerEventData eventData)
        {
            if (!IsDragging) return;
            IsDragging = false;

            rectTransform.rotation = Quaternion.identity;
            canvasGroup.blocksRaycasts = true;

            bool wasPlayed = HandController.Instance?.OnCardDragEnded(this, eventData) ?? false;

            if (!wasPlayed)
            {
                ReturnToHand();
            }
        }

        public void ReturnToHand()
        {
            transform.SetParent(originalParent);
            transform.SetSiblingIndex(originalSiblingIndex);
            StartCoroutine(AnimateReturn());
        }

        public void PlayCardAnimation(Vector3 targetPosition, System.Action onComplete)
        {
            StartCoroutine(AnimatePlay(targetPosition, onComplete));
        }

        private IEnumerator AnimateHover(bool entering)
        {
            Vector3 targetScale = entering ? Vector3.one * hoverScale : originalScale;
            Vector3 targetPos = entering ? originalPosition + Vector3.up * hoverYOffset : originalPosition;

            float elapsed = 0f;
            Vector3 startScale = rectTransform.localScale;
            Vector3 startPos = rectTransform.position;

            while (elapsed < animDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / animDuration;
                t = Mathf.SmoothStep(0, 1, t);

                rectTransform.localScale = Vector3.Lerp(startScale, targetScale, t);
                rectTransform.position = Vector3.Lerp(startPos, targetPos, t);
                yield return null;
            }
        }

        private IEnumerator AnimateReturn()
        {
            Vector3 startPos = rectTransform.position;
            Vector3 startScale = rectTransform.localScale;
            float elapsed = 0f;

            while (elapsed < animDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / animDuration;
                t = Mathf.SmoothStep(0, 1, t);

                rectTransform.position = Vector3.Lerp(startPos, originalPosition, t);
                rectTransform.localScale = Vector3.Lerp(startScale, originalScale, t);
                yield return null;
            }

            rectTransform.position = originalPosition;
            rectTransform.localScale = originalScale;
        }

        private IEnumerator AnimatePlay(Vector3 targetPosition, System.Action onComplete)
        {
            Vector3 startPos = rectTransform.position;
            float elapsed = 0f;
            float duration = 0.3f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / duration;
                t = Mathf.SmoothStep(0, 1, t);

                rectTransform.position = Vector3.Lerp(startPos, targetPosition, t);
                rectTransform.localScale = Vector3.Lerp(Vector3.one, Vector3.one * 0.5f, t);
                yield return null;
            }

            onComplete?.Invoke();
        }

        public void SnapToPosition(Vector3 position, float duration = 0.2f)
        {
            StartCoroutine(AnimateSnap(position, duration));
        }

        private IEnumerator AnimateSnap(Vector3 targetPosition, float duration)
        {
            Vector3 startPos = rectTransform.position;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / duration;
                t = Mathf.SmoothStep(0, 1, t);
                rectTransform.position = Vector3.Lerp(startPos, targetPosition, t);
                yield return null;
            }

            rectTransform.position = targetPosition;
        }
    }
}
