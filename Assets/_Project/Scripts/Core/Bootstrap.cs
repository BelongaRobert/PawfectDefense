using UnityEngine;
using PawfectDefense.SaveLoad;
using PawfectDefense.Audio;
using PawfectDefense.UI;
using PawfectDefense.Data;

namespace PawfectDefense.Core
{
    public class Bootstrap : MonoBehaviour
    {
        [Header("Manager Prefabs")]
        public GameManager gameManagerPrefab;
        public Audio.AudioManager audioManagerPrefab;
        public SaveLoad.SaveManager saveManagerPrefab;
        public UI.UIManager uiManagerPrefab;
        public SceneLoader sceneLoaderPrefab;

        [Header("Data Libraries")]
        public Data.CardDatabase cardDatabasePrefab;
        public Data.EnemyLibrary enemyLibraryPrefab;
        public Data.EncounterLibrary encounterLibraryPrefab;
        public Data.RelicLibrary relicLibraryPrefab;

        [Header("Settings")]
        public string mainMenuSceneName = "MainMenu";
        public string firstSceneToLoad = "MainMenu";

        private void Awake()
        {
            // Ensure only one bootstrap exists
            Bootstrap[] existing = FindObjectsOfType<Bootstrap>();
            if (existing.Length > 1)
            {
                Destroy(gameObject);
                return;
            }

            DontDestroyOnLoad(gameObject);
            InitializeManagers();
        }

        private void Start()
        {
            // Load the target scene after a brief initialization frame
            if (SceneLoader.Instance != null && !string.IsNullOrEmpty(firstSceneToLoad))
            {
                SceneLoader.Instance.LoadScene(firstSceneToLoad, showLoading: true);
            }
            else
            {
                Debug.LogWarning("Bootstrap: SceneLoader not available or no first scene set.");
            }
        }

        private void InitializeManagers()
        {
            EnsureManager(ref gameManagerPrefab);
            EnsureManager(ref saveManagerPrefab);
            EnsureManager(ref audioManagerPrefab);
            EnsureManager(ref uiManagerPrefab);
            EnsureManager(ref sceneLoaderPrefab);

            EnsureManager(ref cardDatabasePrefab);
            EnsureManager(ref enemyLibraryPrefab);
            EnsureManager(ref encounterLibraryPrefab);
            EnsureManager(ref relicLibraryPrefab);

            Debug.Log("Bootstrap: All managers initialized.");
        }

        private void EnsureManager<T>(ref T prefab) where T : MonoBehaviour
        {
            T existing = FindObjectOfType<T>();
            if (existing != null) return;

            if (prefab != null)
            {
                Instantiate(prefab);
            }
            else
            {
                GameObject go = new GameObject(typeof(T).Name);
                go.AddComponent<T>();
            }
        }
    }
}
