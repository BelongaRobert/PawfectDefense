using System;
using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace PawfectDefense.Core
{
    public class SceneLoader : MonoBehaviour
    {
        public static SceneLoader Instance { get; private set; }

        [Header("Loading Screen")]
        public Canvas loadingCanvas;
        public UnityEngine.UI.Image loadingBarFill;
        public TMPro.TextMeshProUGUI loadingText;
        public float fadeDuration = 0.3f;

        public event Action<string> OnSceneLoaded;
        public event Action OnLoadingStarted;
        public event Action OnLoadingComplete;

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
            if (loadingCanvas != null)
                loadingCanvas.enabled = false;
        }

        public void LoadScene(string sceneName, bool showLoading = true)
        {
            StartCoroutine(LoadSceneAsync(sceneName, showLoading));
        }

        public void LoadSceneAdditive(string sceneName)
        {
            SceneManager.LoadScene(sceneName, LoadSceneMode.Additive);
        }

        public void UnloadScene(string sceneName)
        {
            SceneManager.UnloadSceneAsync(sceneName);
        }

        private IEnumerator LoadSceneAsync(string sceneName, bool showLoading)
        {
            OnLoadingStarted?.Invoke();

            if (showLoading && loadingCanvas != null)
            {
                loadingCanvas.enabled = true;
                yield return StartCoroutine(FadeLoadingScreen(true));
            }

            if (loadingText != null)
                loadingText.text = "Loading...";

            AsyncOperation asyncLoad = SceneManager.LoadSceneAsync(sceneName);
            asyncLoad.allowSceneActivation = false;

            while (asyncLoad.progress < 0.9f)
            {
                if (loadingBarFill != null)
                    loadingBarFill.fillAmount = asyncLoad.progress / 0.9f;
                yield return null;
            }

            if (loadingBarFill != null)
                loadingBarFill.fillAmount = 1f;

            if (loadingText != null)
                loadingText.text = "Ready!";

            yield return new WaitForSeconds(0.2f);

            asyncLoad.allowSceneActivation = true;

            while (!asyncLoad.isDone)
            {
                yield return null;
            }

            if (showLoading && loadingCanvas != null)
            {
                yield return new WaitForSeconds(0.2f);
                yield return StartCoroutine(FadeLoadingScreen(false));
                loadingCanvas.enabled = false;
            }

            OnSceneLoaded?.Invoke(sceneName);
            OnLoadingComplete?.Invoke();
        }

        private IEnumerator FadeLoadingScreen(bool fadeIn)
        {
            if (loadingCanvas == null) yield break;

            CanvasGroup canvasGroup = loadingCanvas.GetComponent<CanvasGroup>();
            if (canvasGroup == null)
                canvasGroup = loadingCanvas.gameObject.AddComponent<CanvasGroup>();

            float startAlpha = fadeIn ? 0f : 1f;
            float endAlpha = fadeIn ? 1f : 0f;
            float elapsed = 0f;

            while (elapsed < fadeDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / fadeDuration;
                canvasGroup.alpha = Mathf.Lerp(startAlpha, endAlpha, t);
                yield return null;
            }

            canvasGroup.alpha = endAlpha;
        }

        public string GetCurrentSceneName()
        {
            return SceneManager.GetActiveScene().name;
        }

        public bool IsSceneLoaded(string sceneName)
        {
            return SceneManager.GetSceneByName(sceneName).isLoaded;
        }
    }
}
