using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine.UI;
using UnityEngine.EventSystems;

namespace PawfectDefense.Editor
{
    public class PawfectDefenseSetup : EditorWindow
    {
        // Legacy setup methods - kept for reference but disabled from menu
        // Use SceneSetupWizard (Window → Pawfect Defense) instead
        /*
        [MenuItem("Pawfect Defense/Legacy/Setup Bootstrap Scene")]
        public static void SetupBootstrapScene()
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            GameObject bootstrap = new GameObject("Bootstrap");
            bootstrap.AddComponent<Core.Bootstrap>();
            GameObject eventSystem = new GameObject("EventSystem");
            eventSystem.AddComponent<EventSystem>();
            eventSystem.AddComponent<StandaloneInputModule>();
            EditorSceneManager.SaveScene(scene, "Assets/_Project/Scenes/Bootstrap.unity");
            Debug.Log("Bootstrap scene setup complete.");
        }

        [MenuItem("Pawfect Defense/Legacy/Setup MainMenu Scene")]
        public static void SetupMainMenuScene()
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            GameObject canvasObj = new GameObject("Canvas");
            Canvas canvas = canvasObj.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 0;
            CanvasScaler scaler = canvasObj.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
            scaler.matchWidthOrHeight = 0.5f;
            canvasObj.AddComponent<GraphicRaycaster>();
            GameObject menuObj = new GameObject("MainMenuController");
            menuObj.transform.SetParent(canvasObj.transform);
            menuObj.AddComponent<UI.MainMenuController>();
            EditorSceneManager.SaveScene(scene, "Assets/_Project/Scenes/MainMenu.unity");
            Debug.Log("MainMenu scene setup complete.");
        }

        [MenuItem("Pawfect Defense/Legacy/Setup Combat Scene")]
        public static void SetupCombatScene()
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            Camera.main.transform.position = new Vector3(0, 0, -10);
            GameObject combatMgr = new GameObject("CombatManager");
            combatMgr.AddComponent<Combat.CombatManager>();
            GameObject player = new GameObject("Player");
            player.tag = "Player";
            player.AddComponent<Combat.PlayerEntity>();
            player.AddComponent<Combat.EnergyManager>();
            player.AddComponent<Deck.DeckManager>();
            player.AddComponent<Combat.StatusEffectController>();
            player.AddComponent<BoxCollider2D>();
            SpriteRenderer sr = player.AddComponent<SpriteRenderer>();
            sr.color = Color.green;
            GameObject enemySpawns = new GameObject("EnemySpawns");
            for (int i = 0; i < 3; i++)
            {
                GameObject spawn = new GameObject($"EnemySpawn_{i}");
                spawn.transform.SetParent(enemySpawns.transform);
                spawn.transform.position = new Vector3(3 + i * 2, 0, 0);
            }
            GameObject canvasObj = new GameObject("Canvas");
            Canvas canvas = canvasObj.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            CanvasScaler scaler = canvasObj.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            canvasObj.AddComponent<GraphicRaycaster>();
            GameObject handObj = new GameObject("HandController");
            handObj.transform.SetParent(canvasObj.transform);
            handObj.AddComponent<Cards.HandController>();
            GameObject eventSystem = new GameObject("EventSystem");
            eventSystem.AddComponent<EventSystem>();
            eventSystem.AddComponent<StandaloneInputModule>();
            EditorSceneManager.SaveScene(scene, "Assets/_Project/Scenes/Combat.unity");
            Debug.Log("Combat scene setup complete.");
        }

        [MenuItem("Pawfect Defense/Legacy/Setup All Scenes")]
        public static void SetupAllScenes()
        {
            SetupBootstrapScene();
            SetupMainMenuScene();
            SetupCombatScene();
            Debug.Log("All scenes setup complete.");
        }
        */
    }
}
