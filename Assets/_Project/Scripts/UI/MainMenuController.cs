using UnityEngine;
using UnityEngine.UI;
using PawfectDefense.SaveLoad;
using PawfectDefense.Audio;
using PawfectDefense.Core;

namespace PawfectDefense.UI
{
    public class MainMenuController : MonoBehaviour
    {
        [Header("Buttons")]
        public Button newRunButton;
        public Button continueButton;
        public Button settingsButton;
        public Button quitButton;

        [Header("Title")]
        public TMPro.TextMeshProUGUI titleText;
        public TMPro.TextMeshProUGUI subtitleText;

        [Header("Panels")]
        public GameObject settingsPanel;
        public GameObject creditsPanel;

        [Header("Version")]
        public TMPro.TextMeshProUGUI versionText;
        public string versionString = "v1.0.0";

        private void Awake()
        {
            if (newRunButton != null)
                newRunButton.onClick.AddListener(OnNewRunClicked);

            if (continueButton != null)
                continueButton.onClick.AddListener(OnContinueClicked);

            if (settingsButton != null)
                settingsButton.onClick.AddListener(OnSettingsClicked);

            if (quitButton != null)
                quitButton.onClick.AddListener(OnQuitClicked);

            if (versionText != null)
                versionText.text = versionString;
        }

        private void Start()
        {
            // Check if save exists
            bool hasSave = SaveLoad.SaveManager.Instance?.HasSaveFile() ?? false;
            if (continueButton != null)
                continueButton.interactable = hasSave;

            // Play menu music
            Audio.AudioManager.Instance?.PlayMusic(Audio.MusicType.MainMenu);

            // Hide panels
            if (settingsPanel != null)
                settingsPanel.SetActive(false);
            if (creditsPanel != null)
                creditsPanel.SetActive(false);
        }

        private void OnNewRunClicked()
        {
            Audio.AudioManager.Instance?.PlaySFX(Audio.SFXType.UIClick);
            Core.SceneLoader.Instance?.LoadScene("DeckSelect");
        }

        private void OnContinueClicked()
        {
            Audio.AudioManager.Instance?.PlaySFX(Audio.SFXType.UIClick);

            var save = SaveLoad.SaveManager.Instance?.CurrentSave;
            if (save?.currentRun != null)
            {
                Core.GameManager.Instance.CurrentRun = save.currentRun;
                Core.SceneLoader.Instance?.LoadScene("Map");
            }
            else
            {
                Debug.LogWarning("No active run to continue.");
            }
        }

        private void OnSettingsClicked()
        {
            Audio.AudioManager.Instance?.PlaySFX(Audio.SFXType.UIClick);
            if (settingsPanel != null)
                settingsPanel.SetActive(true);
        }

        private void OnQuitClicked()
        {
            Audio.AudioManager.Instance?.PlaySFX(Audio.SFXType.UIClick);

#if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
#else
            Application.Quit();
#endif
        }

        public void CloseSettings()
        {
            if (settingsPanel != null)
                settingsPanel.SetActive(false);
        }

        public void ShowCredits()
        {
            if (creditsPanel != null)
                creditsPanel.SetActive(true);
        }

        public void CloseCredits()
        {
            if (creditsPanel != null)
                creditsPanel.SetActive(false);
        }
    }
}
