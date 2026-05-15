using System;
using System.Collections.Generic;
using UnityEngine;

namespace PawfectDefense.UI
{
    public class UIManager : MonoBehaviour
    {
        public static UIManager Instance { get; private set; }

        [Header("Screens")]
        public List<UIScreen> screens = new List<UIScreen>();

        [Header("Transitions")]
        public float transitionDuration = 0.3f;

        [Header("Safe Area")]
        public bool respectSafeArea = true;

        private UIScreen currentScreen;
        private Stack<UIScreen> screenHistory = new Stack<UIScreen>();

        private void Awake()
        {
            if (Instance != null)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Start()
        {
            // Apply safe area to all root canvases
            if (respectSafeArea)
            {
                ApplySafeAreaToAllCanvases();
            }
        }

        public void ShowScreen(string screenName, bool addToHistory = true)
        {
            UIScreen targetScreen = screens.Find(s => s.ScreenName == screenName);
            if (targetScreen == null)
            {
                Debug.LogError($"Screen not found: {screenName}");
                return;
            }

            if (currentScreen != null)
            {
                if (addToHistory)
                    screenHistory.Push(currentScreen);
                currentScreen.Hide();
            }

            targetScreen.Show();
            currentScreen = targetScreen;
        }

        public void GoBack()
        {
            if (screenHistory.Count > 0)
            {
                UIScreen previousScreen = screenHistory.Pop();
                if (currentScreen != null)
                    currentScreen.Hide();
                previousScreen.Show();
                currentScreen = previousScreen;
            }
        }

        public void ShowPopup(string popupName)
        {
            UIScreen popup = screens.Find(s => s.ScreenName == popupName && s.IsPopup);
            popup?.Show();
        }

        public void HidePopup(string popupName)
        {
            UIScreen popup = screens.Find(s => s.ScreenName == popupName && s.IsPopup);
            popup?.Hide();
        }

        private void ApplySafeAreaToAllCanvases()
        {
            Canvas[] canvases = FindObjectsOfType<Canvas>();
            foreach (Canvas canvas in canvases)
            {
                SafeArea safeArea = canvas.GetComponent<SafeArea>();
                if (safeArea == null)
                    canvas.gameObject.AddComponent<SafeArea>();
            }
        }
    }

    public class UIScreen : MonoBehaviour
    {
        [Header("Screen Info")]
        public string ScreenName;
        public bool IsPopup = false;

        [Header("Animation")]
        public bool animateOnShow = true;
        public bool animateOnHide = true;
        public float animDuration = 0.3f;

        private CanvasGroup canvasGroup;
        private RectTransform rectTransform;

        private void Awake()
        {
            canvasGroup = GetComponent<CanvasGroup>();
            if (canvasGroup == null)
                canvasGroup = gameObject.AddComponent<CanvasGroup>();

            rectTransform = GetComponent<RectTransform>();
        }

        public virtual void Show()
        {
            gameObject.SetActive(true);
            if (animateOnShow && canvasGroup != null)
            {
                StartCoroutine(AnimateShow());
            }
            else if (canvasGroup != null)
            {
                canvasGroup.alpha = 1f;
                canvasGroup.interactable = true;
                canvasGroup.blocksRaycasts = true;
            }
        }

        public virtual void Hide()
        {
            if (animateOnHide && canvasGroup != null)
            {
                StartCoroutine(AnimateHide());
            }
            else
            {
                gameObject.SetActive(false);
            }
        }

        private System.Collections.IEnumerator AnimateShow()
        {
            canvasGroup.interactable = false;
            canvasGroup.blocksRaycasts = true;

            float elapsed = 0f;
            while (elapsed < animDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / animDuration;
                canvasGroup.alpha = Mathf.Lerp(0f, 1f, t);
                yield return null;
            }

            canvasGroup.alpha = 1f;
            canvasGroup.interactable = true;
        }

        private System.Collections.IEnumerator AnimateHide()
        {
            canvasGroup.interactable = false;

            float elapsed = 0f;
            while (elapsed < animDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / animDuration;
                canvasGroup.alpha = Mathf.Lerp(1f, 0f, t);
                yield return null;
            }

            canvasGroup.alpha = 0f;
            canvasGroup.blocksRaycasts = false;
            gameObject.SetActive(false);
        }
    }

    public class SafeArea : MonoBehaviour
    {
        private RectTransform rectTransform;

        private void Awake()
        {
            rectTransform = GetComponent<RectTransform>();
            ApplySafeArea();
        }

        private void ApplySafeArea()
        {
            if (rectTransform == null) return;

            Rect safeArea = Screen.safeArea;
            Vector2 anchorMin = safeArea.position;
            Vector2 anchorMax = safeArea.position + safeArea.size;

            anchorMin.x /= Screen.width;
            anchorMin.y /= Screen.height;
            anchorMax.x /= Screen.width;
            anchorMax.y /= Screen.height;

            rectTransform.anchorMin = anchorMin;
            rectTransform.anchorMax = anchorMax;
        }
    }
}
