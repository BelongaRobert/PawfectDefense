using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using TMPro;
using PawfectDefense.Core;
using PawfectDefense.UI;
using PawfectDefense.Combat;
using PawfectDefense.Data;
using PawfectDefense.Cards;
using PawfectDefense.Deck;
using PawfectDefense.SaveLoad;
using PawfectDefense.Audio;

namespace PawfectDefense.Editor
{
    public class SceneSetupWizard : EditorWindow
    {
        [MenuItem("Pawfect Defense/Setup All Scenes")]
        public static void ShowWindow()
        {
            GetWindow<SceneSetupWizard>("Pawfect Defense Setup");
        }

        private void OnGUI()
        {
            GUILayout.BeginVertical();
            GUILayout.Label("Pawfect Defense Scene Setup", EditorStyles.boldLabel);
            GUILayout.Space(10);

            if (GUILayout.Button("Setup Bootstrap Scene", GUILayout.Height(30)))
            {
                SetupBootstrapScene();
            }

            if (GUILayout.Button("Setup MainMenu Scene", GUILayout.Height(30)))
            {
                SetupMainMenuScene();
            }

            if (GUILayout.Button("Setup DeckSelect Scene", GUILayout.Height(30)))
            {
                SetupDeckSelectScene();
            }

            if (GUILayout.Button("Setup Map Scene", GUILayout.Height(30)))
            {
                SetupMapScene();
            }

            if (GUILayout.Button("Setup Combat Scene", GUILayout.Height(30)))
            {
                SetupCombatScene();
            }

            GUILayout.Space(10);
            GUILayout.Label("Or setup everything at once:", EditorStyles.label);
            if (GUILayout.Button("SETUP ALL SCENES", GUILayout.Height(40)))
            {
                SetupBootstrapScene();
                SetupMainMenuScene();
                SetupDeckSelectScene();
                SetupMapScene();
                SetupCombatScene();
                EditorUtility.DisplayDialog("Done", "All scenes have been created! Open Bootstrap.unity and press Play to test.", "OK");
            }
            GUILayout.EndVertical();
        }

        private static void SetupBootstrapScene()
        {
            string scenePath = "Assets/_Project/Scenes/Bootstrap.unity";
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            // Main Camera
            var camera = new GameObject("Main Camera");
            var cam = camera.AddComponent<Camera>();
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = Color.black;
            cam.orthographic = true;
            camera.tag = "MainCamera";
            camera.AddComponent<AudioListener>();

            // Directional Light
            var light = new GameObject("Directional Light");
            var dl = light.AddComponent<Light>();
            dl.type = LightType.Directional;

            // EventSystem (needed for UI across all scenes)
            CreateEventSystem();

            // Bootstrap GameObject
            var bootstrapGO = new GameObject("Bootstrap");
            var bootstrap = bootstrapGO.AddComponent<Bootstrap>();

            // Add manager components directly to Bootstrap (they'll be singletons)
            bootstrapGO.AddComponent<GameManager>();
            bootstrapGO.AddComponent<SaveManager>();
            bootstrapGO.AddComponent<AudioManager>();
            bootstrapGO.AddComponent<UIManager>();
            bootstrapGO.AddComponent<SceneLoader>();

            // Data Libraries
            bootstrapGO.AddComponent<CardDatabase>();
            bootstrapGO.AddComponent<CardLibrary>();
            bootstrapGO.AddComponent<EnemyLibrary>();
            bootstrapGO.AddComponent<EncounterLibrary>();
            bootstrapGO.AddComponent<RelicLibrary>();

            EditorSceneManager.SaveScene(scene, scenePath);
            Debug.Log("Bootstrap scene created at: " + scenePath);
        }

        private static void SetupMainMenuScene()
        {
            string scenePath = "Assets/_Project/Scenes/MainMenu.unity";
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            // Main Camera
            var camera = new GameObject("Main Camera");
            var cam = camera.AddComponent<Camera>();
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.1f, 0.1f, 0.15f);
            cam.orthographic = true;
            camera.tag = "MainCamera";
            camera.AddComponent<AudioListener>();

            // EventSystem
            CreateEventSystem();

            // Canvas
            var canvasGO = new GameObject("MainMenuCanvas");
            var canvas = canvasGO.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 0;
            var canvasScaler = canvasGO.AddComponent<CanvasScaler>();
            canvasScaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            canvasScaler.referenceResolution = new Vector2(1920, 1080);
            canvasGO.AddComponent<GraphicRaycaster>();

            // MainMenuController
            var controller = canvasGO.AddComponent<MainMenuController>();

            // Background Panel
            var bgPanel = CreatePanel(canvasGO.transform, "Background", Color.clear);
            var bgRect = bgPanel.GetComponent<RectTransform>();
            bgRect.anchorMin = Vector2.zero;
            bgRect.anchorMax = Vector2.one;
            bgRect.offsetMin = Vector2.zero;
            bgRect.offsetMax = Vector2.zero;

            // Title Text
            var titleGO = CreateText(canvasGO.transform, "TitleText", "PAWFECT DEFENSE", 72, TextAlignmentOptions.Center);
            var titleRect = titleGO.GetComponent<RectTransform>();
            titleRect.anchorMin = new Vector2(0, 0.7f);
            titleRect.anchorMax = new Vector2(1, 0.9f);
            titleRect.offsetMin = Vector2.zero;
            titleRect.offsetMax = Vector2.zero;
            controller.titleText = titleGO.GetComponent<TextMeshProUGUI>();

            // Subtitle
            var subtitleGO = CreateText(canvasGO.transform, "SubtitleText", "A Card-Based Roguelike", 28, TextAlignmentOptions.Center);
            var subtitleRect = subtitleGO.GetComponent<RectTransform>();
            subtitleRect.anchorMin = new Vector2(0, 0.6f);
            subtitleRect.anchorMax = new Vector2(1, 0.7f);
            subtitleRect.offsetMin = Vector2.zero;
            subtitleRect.offsetMax = Vector2.zero;
            controller.subtitleText = subtitleGO.GetComponent<TextMeshProUGUI>();

            // Buttons Panel
            var btnPanel = CreatePanel(canvasGO.transform, "ButtonsPanel", Color.clear);
            var btnRect = btnPanel.GetComponent<RectTransform>();
            btnRect.anchorMin = new Vector2(0.35f, 0.2f);
            btnRect.anchorMax = new Vector2(0.65f, 0.55f);
            btnRect.offsetMin = Vector2.zero;
            btnRect.offsetMax = Vector2.zero;

            // New Run Button
            controller.newRunButton = CreateButton(btnPanel.transform, "NewRunButton", "Start Run", new Color(0.2f, 0.6f, 0.3f));
            controller.newRunButton.GetComponent<RectTransform>().anchorMin = new Vector2(0, 0.75f);
            controller.newRunButton.GetComponent<RectTransform>().anchorMax = new Vector2(1, 1);

            // Continue Button
            controller.continueButton = CreateButton(btnPanel.transform, "ContinueButton", "Continue", new Color(0.2f, 0.4f, 0.6f));
            controller.continueButton.GetComponent<RectTransform>().anchorMin = new Vector2(0, 0.5f);
            controller.continueButton.GetComponent<RectTransform>().anchorMax = new Vector2(1, 0.72f);

            // Settings Button
            controller.settingsButton = CreateButton(btnPanel.transform, "SettingsButton", "Settings", new Color(0.4f, 0.4f, 0.4f));
            controller.settingsButton.GetComponent<RectTransform>().anchorMin = new Vector2(0, 0.25f);
            controller.settingsButton.GetComponent<RectTransform>().anchorMax = new Vector2(1, 0.47f);

            // Quit Button
            controller.quitButton = CreateButton(btnPanel.transform, "QuitButton", "Quit", new Color(0.6f, 0.2f, 0.2f));
            controller.quitButton.GetComponent<RectTransform>().anchorMin = new Vector2(0, 0);
            controller.quitButton.GetComponent<RectTransform>().anchorMax = new Vector2(1, 0.22f);

            // Version Text
            var versionGO = CreateText(canvasGO.transform, "VersionText", "v1.0.0", 18, TextAlignmentOptions.BottomRight);
            var versionRect = versionGO.GetComponent<RectTransform>();
            versionRect.anchorMin = new Vector2(0.85f, 0);
            versionRect.anchorMax = new Vector2(1, 0.05f);
            versionRect.offsetMin = new Vector2(-10, 5);
            versionRect.offsetMax = new Vector2(-10, 5);
            controller.versionText = versionGO.GetComponent<TextMeshProUGUI>();

            // Settings Panel (hidden by default)
            var settingsPanel = CreatePanel(canvasGO.transform, "SettingsPanel", new Color(0.1f, 0.1f, 0.1f, 0.95f));
            var spRect = settingsPanel.GetComponent<RectTransform>();
            spRect.anchorMin = new Vector2(0.2f, 0.2f);
            spRect.anchorMax = new Vector2(0.8f, 0.8f);
            settingsPanel.SetActive(false);
            controller.settingsPanel = settingsPanel;

            // Settings Title
            var stGO = CreateText(settingsPanel.transform, "SettingsTitle", "Settings", 48, TextAlignmentOptions.Center);
            stGO.GetComponent<RectTransform>().anchorMin = new Vector2(0, 0.8f);
            stGO.GetComponent<RectTransform>().anchorMax = new Vector2(1, 1);

            // Close Settings Button
            var closeBtn = CreateButton(settingsPanel.transform, "CloseSettingsButton", "Close", new Color(0.6f, 0.2f, 0.2f));
            closeBtn.GetComponent<RectTransform>().anchorMin = new Vector2(0.3f, 0.05f);
            closeBtn.GetComponent<RectTransform>().anchorMax = new Vector2(0.7f, 0.2f);
            closeBtn.onClick.AddListener(() => controller.CloseSettings());

            EditorSceneManager.SaveScene(scene, scenePath);
            Debug.Log("MainMenu scene created at: " + scenePath);
        }

        private static void SetupDeckSelectScene()
        {
            string scenePath = "Assets/_Project/Scenes/DeckSelect.unity";
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            var camera = new GameObject("Main Camera");
            var cam = camera.AddComponent<Camera>();
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.1f, 0.1f, 0.15f);
            cam.orthographic = true;
            camera.tag = "MainCamera";
            camera.AddComponent<AudioListener>();

            CreateEventSystem();

            var canvasGO = new GameObject("DeckSelectCanvas");
            var canvas = canvasGO.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            var canvasScaler = canvasGO.AddComponent<CanvasScaler>();
            canvasScaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            canvasScaler.referenceResolution = new Vector2(1920, 1080);
            canvasGO.AddComponent<GraphicRaycaster>();

            var controller = canvasGO.AddComponent<DeckSelectController>();

            // Title
            var titleGO = CreateText(canvasGO.transform, "TitleText", "Choose Your Pet", 56, TextAlignmentOptions.Center);
            titleGO.GetComponent<RectTransform>().anchorMin = new Vector2(0, 0.85f);
            titleGO.GetComponent<RectTransform>().anchorMax = new Vector2(1, 0.95f);

            // Pet Buttons Panel
            var petPanel = CreatePanel(canvasGO.transform, "PetButtonsPanel", Color.clear);
            petPanel.GetComponent<RectTransform>().anchorMin = new Vector2(0.05f, 0.55f);
            petPanel.GetComponent<RectTransform>().anchorMax = new Vector2(0.95f, 0.8f);

            // Create 4 pet buttons
            string[] petNames = { "Dog", "Cat", "Reptile", "Bird" };
            PetType[] petTypes = { PetType.Dog, PetType.Cat, PetType.Reptile, PetType.Bird };
            Color[] petColors = { new Color(0.8f, 0.5f, 0.2f), new Color(0.2f, 0.5f, 0.8f), new Color(0.2f, 0.7f, 0.3f), new Color(0.8f, 0.2f, 0.6f) };

            for (int i = 0; i < 4; i++)
            {
                var btnGO = CreateButton(petPanel.transform, petNames[i] + "Button", petNames[i], petColors[i]);
                var btnRect = btnGO.GetComponent<RectTransform>();
                btnRect.anchorMin = new Vector2(i * 0.25f, 0);
                btnRect.anchorMax = new Vector2((i + 1) * 0.25f - 0.02f, 1);

                var petBtn = new PetSelectButton
                {
                    button = btnGO.GetComponent<Button>(),
                    buttonImage = btnGO.GetComponent<Image>(),
                    petType = petTypes[i]
                };
                controller.petButtons.Add(petBtn);

                var displayData = new PetDisplayData
                {
                    petType = petTypes[i],
                    displayName = petNames[i],
                    description = $"The {petNames[i]} deck focuses on unique tactics."
                };
                controller.petDisplayData.Add(displayData);
            }

            // Preview Panel
            var previewPanel = CreatePanel(canvasGO.transform, "PreviewPanel", new Color(0.1f, 0.1f, 0.15f, 0.8f));
            previewPanel.GetComponent<RectTransform>().anchorMin = new Vector2(0.05f, 0.15f);
            previewPanel.GetComponent<RectTransform>().anchorMax = new Vector2(0.5f, 0.5f);

            // Pet Name
            var petNameGO = CreateText(previewPanel.transform, "PetNameText", "Dog", 36, TextAlignmentOptions.Center);
            petNameGO.GetComponent<RectTransform>().anchorMin = new Vector2(0, 0.75f);
            petNameGO.GetComponent<RectTransform>().anchorMax = new Vector2(1, 1);
            controller.petNameText = petNameGO.GetComponent<TextMeshProUGUI>();

            // Pet Description
            var petDescGO = CreateText(previewPanel.transform, "PetDescriptionText", "Loyal and protective.", 22, TextAlignmentOptions.Center);
            petDescGO.GetComponent<RectTransform>().anchorMin = new Vector2(0.05f, 0.3f);
            petDescGO.GetComponent<RectTransform>().anchorMax = new Vector2(0.95f, 0.7f);
            controller.petDescriptionText = petDescGO.GetComponent<TextMeshProUGUI>();

            // Pet Preview Image (placeholder)
            var previewImgGO = new GameObject("PetPreviewImage");
            previewImgGO.transform.SetParent(previewPanel.transform);
            var previewImg = previewImgGO.AddComponent<Image>();
            previewImg.color = new Color(0.3f, 0.3f, 0.3f);
            var pImgRect = previewImgGO.GetComponent<RectTransform>();
            pImgRect.anchorMin = new Vector2(0.35f, 0.05f);
            pImgRect.anchorMax = new Vector2(0.65f, 0.25f);
            controller.petPreviewImage = previewImg;

            // Deck Preview Panel
            var deckPanel = CreatePanel(canvasGO.transform, "DeckPreviewPanel", new Color(0.1f, 0.1f, 0.15f, 0.8f));
            deckPanel.GetComponent<RectTransform>().anchorMin = new Vector2(0.52f, 0.15f);
            deckPanel.GetComponent<RectTransform>().anchorMax = new Vector2(0.95f, 0.5f);

            var deckTitleGO = CreateText(deckPanel.transform, "DeckTitle", "Starting Deck", 28, TextAlignmentOptions.Center);
            deckTitleGO.GetComponent<RectTransform>().anchorMin = new Vector2(0, 0.85f);
            deckTitleGO.GetComponent<RectTransform>().anchorMax = new Vector2(1, 1);

            var deckTextGO = CreateText(deckPanel.transform, "DeckPreviewText", "Loading deck...", 18, TextAlignmentOptions.TopLeft);
            deckTextGO.GetComponent<RectTransform>().anchorMin = new Vector2(0.05f, 0.05f);
            deckTextGO.GetComponent<RectTransform>().anchorMax = new Vector2(0.95f, 0.8f);
            controller.deckPreviewText = deckTextGO.GetComponent<TextMeshProUGUI>();

            // Bottom Buttons
            controller.startRunButton = CreateButton(canvasGO.transform, "StartRunButton", "Start Run", new Color(0.2f, 0.6f, 0.3f));
            controller.startRunButton.GetComponent<RectTransform>().anchorMin = new Vector2(0.3f, 0.03f);
            controller.startRunButton.GetComponent<RectTransform>().anchorMax = new Vector2(0.48f, 0.12f);

            controller.backButton = CreateButton(canvasGO.transform, "BackButton", "Back", new Color(0.4f, 0.4f, 0.4f));
            controller.backButton.GetComponent<RectTransform>().anchorMin = new Vector2(0.52f, 0.03f);
            controller.backButton.GetComponent<RectTransform>().anchorMax = new Vector2(0.7f, 0.12f);

            EditorSceneManager.SaveScene(scene, scenePath);
            Debug.Log("DeckSelect scene created at: " + scenePath);
        }

        private static void SetupMapScene()
        {
            string scenePath = "Assets/_Project/Scenes/Map.unity";
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            var camera = new GameObject("Main Camera");
            var cam = camera.AddComponent<Camera>();
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.08f, 0.08f, 0.12f);
            cam.orthographic = true;
            camera.tag = "MainCamera";
            camera.AddComponent<AudioListener>();

            CreateEventSystem();

            var canvasGO = new GameObject("MapCanvas");
            var canvas = canvasGO.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            var canvasScaler = canvasGO.AddComponent<CanvasScaler>();
            canvasScaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            canvasScaler.referenceResolution = new Vector2(1920, 1080);
            canvasGO.AddComponent<GraphicRaycaster>();

            var controller = canvasGO.AddComponent<MapController>();

            // Map Container (Scrollable)
            var scrollGO = new GameObject("MapScrollView", typeof(RectTransform));
            scrollGO.transform.SetParent(canvasGO.transform);
            var scrollRect = scrollGO.AddComponent<ScrollRect>();
            scrollRect.horizontal = false;
            scrollRect.movementType = ScrollRect.MovementType.Clamped;
            var scrollRt = scrollGO.GetComponent<RectTransform>();
            scrollRt.anchorMin = new Vector2(0, 0);
            scrollRt.anchorMax = new Vector2(1, 1);
            scrollRt.offsetMin = new Vector2(50, 80);
            scrollRt.offsetMax = new Vector2(-50, -80);

            // Viewport
            var viewportGO = new GameObject("Viewport");
            viewportGO.transform.SetParent(scrollGO.transform);
            var viewportImg = viewportGO.AddComponent<Image>();
            viewportImg.color = Color.clear;
            // No mask for now — ensure full visibility during debugging
            var vpRect = viewportGO.GetComponent<RectTransform>();
            vpRect.anchorMin = Vector2.zero;
            vpRect.anchorMax = Vector2.one;
            vpRect.offsetMin = Vector2.zero;
            vpRect.offsetMax = Vector2.zero;
            scrollRect.viewport = vpRect;

            // Content
            var contentGO = new GameObject("Content", typeof(RectTransform));
            contentGO.transform.SetParent(viewportGO.transform);
            var contentRect = contentGO.GetComponent<RectTransform>();
            contentRect.anchorMin = new Vector2(0, 1);
            contentRect.anchorMax = Vector2.one;
            contentRect.pivot = new Vector2(0.5f, 1f);
            contentRect.sizeDelta = new Vector2(0, 2000);
            scrollRect.content = contentRect;

            // Map Container (inside Content) — match Content layout exactly
            var mapContainerGO = new GameObject("MapContainer", typeof(RectTransform));
            mapContainerGO.transform.SetParent(contentGO.transform);
            var mapContainerRect = mapContainerGO.GetComponent<RectTransform>();
            mapContainerRect.anchorMin = new Vector2(0, 1);
            mapContainerRect.anchorMax = Vector2.one;
            mapContainerRect.pivot = new Vector2(0.5f, 1f);
            mapContainerRect.sizeDelta = new Vector2(0, 2000);
            controller.mapContainer = mapContainerGO.transform;

            // Path Container
            var pathContainerGO = new GameObject("PathContainer", typeof(RectTransform));
            pathContainerGO.transform.SetParent(mapContainerGO.transform);
            var pathRect = pathContainerGO.GetComponent<RectTransform>();
            pathRect.anchorMin = new Vector2(0, 1);
            pathRect.anchorMax = Vector2.one;
            pathRect.pivot = new Vector2(0.5f, 1f);
            pathRect.sizeDelta = new Vector2(0, 2000);
            controller.pathContainer = pathContainerGO.transform;

            // Node Prefab (for runtime instantiation)
            var nodePrefabGO = new GameObject("NodePrefab");
            nodePrefabGO.transform.SetParent(mapContainerGO.transform);
            var nodeImg = nodePrefabGO.AddComponent<Image>();
            nodeImg.sprite = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/UISprite.psd");
            nodeImg.type = Image.Type.Sliced;
            nodeImg.color = new Color(0.3f, 0.35f, 0.4f); // visible default background
            nodePrefabGO.AddComponent<Button>();
            var nodeRect = nodePrefabGO.GetComponent<RectTransform>();
            nodeRect.sizeDelta = new Vector2(80, 80);
            nodePrefabGO.SetActive(false);

            // Icon inside node
            var iconGO = new GameObject("Icon");
            iconGO.transform.SetParent(nodePrefabGO.transform);
            var iconImg = iconGO.AddComponent<Image>();
            iconGO.GetComponent<RectTransform>().anchorMin = Vector2.zero;
            iconGO.GetComponent<RectTransform>().anchorMax = Vector2.one;
            iconGO.GetComponent<RectTransform>().offsetMin = new Vector2(10, 10);
            iconGO.GetComponent<RectTransform>().offsetMax = new Vector2(-10, -10);

            PrefabUtility.SaveAsPrefabAsset(nodePrefabGO, "Assets/_Project/Prefabs/MapNode.prefab");
            controller.nodePrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/_Project/Prefabs/MapNode.prefab");

            // Path Line Prefab — thicker and brighter
            var linePrefabGO = new GameObject("PathLinePrefab");
            linePrefabGO.transform.SetParent(pathContainerGO.transform);
            var lineImg = linePrefabGO.AddComponent<Image>();
            lineImg.color = new Color(0.85f, 0.85f, 0.9f, 1f); // bright, fully opaque
            linePrefabGO.GetComponent<RectTransform>().sizeDelta = new Vector2(100, 8);
            linePrefabGO.SetActive(false);

            PrefabUtility.SaveAsPrefabAsset(linePrefabGO, "Assets/_Project/Prefabs/PathLine.prefab");
            controller.pathLinePrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/_Project/Prefabs/PathLine.prefab");

            // Floor Label
            var floorGO = CreateText(canvasGO.transform, "FloorText", "Floor 1 / 15", 24, TextAlignmentOptions.TopLeft);
            floorGO.GetComponent<RectTransform>().anchorMin = new Vector2(0.02f, 0.95f);
            floorGO.GetComponent<RectTransform>().anchorMax = new Vector2(0.2f, 1);

            // Gold Label
            var goldGO = CreateText(canvasGO.transform, "GoldText", "Gold: 0", 24, TextAlignmentOptions.TopRight);
            goldGO.GetComponent<RectTransform>().anchorMin = new Vector2(0.8f, 0.95f);
            goldGO.GetComponent<RectTransform>().anchorMax = new Vector2(0.98f, 1);

            // HP Label
            var hpGO = CreateText(canvasGO.transform, "HPText", "HP: 80/80", 24, TextAlignmentOptions.TopRight);
            hpGO.GetComponent<RectTransform>().anchorMin = new Vector2(0.6f, 0.95f);
            hpGO.GetComponent<RectTransform>().anchorMax = new Vector2(0.78f, 1);

            EditorSceneManager.SaveScene(scene, scenePath);
            Debug.Log("Map scene created at: " + scenePath);
        }

        private static void SetupCombatScene()
        {
            string scenePath = "Assets/_Project/Scenes/Combat.unity";
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            var camera = new GameObject("Main Camera");
            var cam = camera.AddComponent<Camera>();
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.05f, 0.05f, 0.08f);
            cam.orthographic = true;
            camera.tag = "MainCamera";
            camera.AddComponent<AudioListener>();

            CreateEventSystem();

            // Combat Manager
            var combatMgrGO = new GameObject("CombatManager");
            combatMgrGO.AddComponent<CombatManager>();

            // Canvas
            var canvasGO = new GameObject("CombatCanvas");
            var canvas = canvasGO.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            var canvasScaler = canvasGO.AddComponent<CanvasScaler>();
            canvasScaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            canvasScaler.referenceResolution = new Vector2(1920, 1080);
            canvasGO.AddComponent<GraphicRaycaster>();

            // Player Area
            var playerAreaGO = CreatePanel(canvasGO.transform, "PlayerArea", Color.clear);
            playerAreaGO.GetComponent<RectTransform>().anchorMin = new Vector2(0, 0.35f);
            playerAreaGO.GetComponent<RectTransform>().anchorMax = new Vector2(0.4f, 0.7f);

            // Player Entity (will be spawned by CombatManager, but placeholder here)
            var playerEntityGO = new GameObject("PlayerEntity");
            playerEntityGO.AddComponent<PlayerEntity>();
            playerEntityGO.AddComponent<EnergyManager>();
            playerEntityGO.AddComponent<DeckManager>();
            playerEntityGO.AddComponent<StatusEffectController>();
            var playerSprite = playerEntityGO.AddComponent<SpriteRenderer>();
            playerSprite.color = new Color(0.2f, 0.6f, 0.9f);
            playerEntityGO.transform.position = new Vector3(-4, 0, 0);

            // Player HP Bar
            var playerHpGO = CreateText(playerAreaGO.transform, "PlayerHP", "80/80", 28, TextAlignmentOptions.Center);
            playerHpGO.GetComponent<RectTransform>().anchorMin = new Vector2(0.2f, 0.7f);
            playerHpGO.GetComponent<RectTransform>().anchorMax = new Vector2(0.8f, 0.9f);

            // Player Block
            var playerBlockGO = CreateText(playerAreaGO.transform, "PlayerBlock", "Block: 0", 22, TextAlignmentOptions.Center);
            playerBlockGO.GetComponent<RectTransform>().anchorMin = new Vector2(0.2f, 0.55f);
            playerBlockGO.GetComponent<RectTransform>().anchorMax = new Vector2(0.8f, 0.7f);

            // Player Energy
            var playerEnergyGO = CreateText(playerAreaGO.transform, "PlayerEnergy", "Energy: 3/3", 24, TextAlignmentOptions.Center);
            playerEnergyGO.GetComponent<RectTransform>().anchorMin = new Vector2(0.2f, 0.4f);
            playerEnergyGO.GetComponent<RectTransform>().anchorMax = new Vector2(0.8f, 0.55f);

            // Enemy Area
            var enemyAreaGO = CreatePanel(canvasGO.transform, "EnemyArea", Color.clear);
            enemyAreaGO.GetComponent<RectTransform>().anchorMin = new Vector2(0.6f, 0.35f);
            enemyAreaGO.GetComponent<RectTransform>().anchorMax = new Vector2(1, 0.7f);

            // Enemy HP
            var enemyHpGO = CreateText(enemyAreaGO.transform, "EnemyHP", "??/??", 28, TextAlignmentOptions.Center);
            enemyHpGO.GetComponent<RectTransform>().anchorMin = new Vector2(0.2f, 0.7f);
            enemyHpGO.GetComponent<RectTransform>().anchorMax = new Vector2(0.8f, 0.9f);

            // Enemy Intent
            var enemyIntentGO = CreateText(enemyAreaGO.transform, "EnemyIntent", "Intent: Attack 5", 22, TextAlignmentOptions.Center);
            enemyIntentGO.GetComponent<RectTransform>().anchorMin = new Vector2(0.1f, 0.85f);
            enemyIntentGO.GetComponent<RectTransform>().anchorMax = new Vector2(0.9f, 1);

            // Hand Area
            var handAreaGO = CreatePanel(canvasGO.transform, "HandArea", new Color(0.05f, 0.05f, 0.1f, 0.5f));
            handAreaGO.GetComponent<RectTransform>().anchorMin = new Vector2(0.1f, 0.02f);
            handAreaGO.GetComponent<RectTransform>().anchorMax = new Vector2(0.9f, 0.3f);

            // Hand Controller
            var handGO = new GameObject("HandController");
            handGO.AddComponent<HandController>();
            var handCtrl = handGO.GetComponent<HandController>();
            handCtrl.cardContainer = handAreaGO.transform;

            // End Turn Button
            var endTurnBtn = CreateButton(canvasGO.transform, "EndTurnButton", "End Turn", new Color(0.8f, 0.3f, 0.2f));
            endTurnBtn.GetComponent<RectTransform>().anchorMin = new Vector2(0.85f, 0.32f);
            endTurnBtn.GetComponent<RectTransform>().anchorMax = new Vector2(0.97f, 0.4f);

            // Top Bar - Floor info
            var topBarGO = CreatePanel(canvasGO.transform, "TopBar", new Color(0.1f, 0.1f, 0.15f, 0.8f));
            topBarGO.GetComponent<RectTransform>().anchorMin = new Vector2(0, 0.92f);
            topBarGO.GetComponent<RectTransform>().anchorMax = new Vector2(1, 1);

            var floorTextGO = CreateText(topBarGO.transform, "FloorText", "Floor 1", 20, TextAlignmentOptions.Left);
            floorTextGO.GetComponent<RectTransform>().anchorMin = new Vector2(0.02f, 0);
            floorTextGO.GetComponent<RectTransform>().anchorMax = new Vector2(0.2f, 1);

            var goldTextGO = CreateText(topBarGO.transform, "GoldText", "Gold: 0", 20, TextAlignmentOptions.Right);
            goldTextGO.GetComponent<RectTransform>().anchorMin = new Vector2(0.8f, 0);
            goldTextGO.GetComponent<RectTransform>().anchorMax = new Vector2(0.98f, 1);

            var relicTextGO = CreateText(topBarGO.transform, "RelicText", "Relics: 0", 20, TextAlignmentOptions.Right);
            relicTextGO.GetComponent<RectTransform>().anchorMin = new Vector2(0.6f, 0);
            relicTextGO.GetComponent<RectTransform>().anchorMax = new Vector2(0.78f, 1);

            // Card Prefab
            var cardPrefabGO = new GameObject("CardPrefab");
            var cardImg = cardPrefabGO.AddComponent<Image>();
            cardImg.sprite = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/UISprite.psd");
            cardImg.type = Image.Type.Sliced;
            cardImg.color = new Color(0.15f, 0.15f, 0.2f);
            var cardRect = cardPrefabGO.GetComponent<RectTransform>();
            cardRect.sizeDelta = new Vector2(160, 220);

            // Card Name
            var cardNameGO = CreateText(cardPrefabGO.transform, "CardName", "Card Name", 16, TextAlignmentOptions.Center);
            cardNameGO.GetComponent<RectTransform>().anchorMin = new Vector2(0.05f, 0.75f);
            cardNameGO.GetComponent<RectTransform>().anchorMax = new Vector2(0.95f, 0.95f);

            // Card Cost
            var cardCostGO = CreateText(cardPrefabGO.transform, "CardCost", "1", 20, TextAlignmentOptions.Center);
            cardCostGO.GetComponent<RectTransform>().anchorMin = new Vector2(0.05f, 0.55f);
            cardCostGO.GetComponent<RectTransform>().anchorMax = new Vector2(0.25f, 0.7f);

            // Card Description
            var cardDescGO = CreateText(cardPrefabGO.transform, "CardDescription", "Deal 5 damage.", 14, TextAlignmentOptions.Center);
            cardDescGO.GetComponent<RectTransform>().anchorMin = new Vector2(0.05f, 0.1f);
            cardDescGO.GetComponent<RectTransform>().anchorMax = new Vector2(0.95f, 0.5f);

            // Add CardView component
            cardPrefabGO.AddComponent<CardView>();

            PrefabUtility.SaveAsPrefabAsset(cardPrefabGO, "Assets/_Project/Prefabs/CardView.prefab");
            handCtrl.cardViewPrefab = AssetDatabase.LoadAssetAtPath<GameObject>("Assets/_Project/Prefabs/CardView.prefab");

            EditorSceneManager.SaveScene(scene, scenePath);
            Debug.Log("Combat scene created at: " + scenePath);
        }

        // Helper Methods
        private static GameObject CreatePanel(Transform parent, string name, Color color)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent);
            var img = go.AddComponent<Image>();
            img.color = color;
            var rect = go.GetComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;
            return go;
        }

        private static GameObject CreateText(Transform parent, string name, string text, int fontSize, TextAlignmentOptions alignment)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent);
            var tmp = go.AddComponent<TextMeshProUGUI>();
            tmp.text = text;
            tmp.fontSize = fontSize;
            tmp.alignment = alignment;
            tmp.color = Color.white;
            var rect = go.GetComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;
            return go;
        }

        private static Button CreateButton(Transform parent, string name, string text, Color color)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent);
            var img = go.AddComponent<Image>();
            img.sprite = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/UISprite.psd");
            img.type = Image.Type.Sliced;
            img.color = color;
            var btn = go.AddComponent<Button>();
            var rect = go.GetComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;

            var textGO = CreateText(go.transform, name + "Text", text, 24, TextAlignmentOptions.Center);
            textGO.GetComponent<RectTransform>().anchorMin = Vector2.zero;
            textGO.GetComponent<RectTransform>().anchorMax = Vector2.one;
            textGO.GetComponent<RectTransform>().offsetMin = new Vector2(10, 5);
            textGO.GetComponent<RectTransform>().offsetMax = new Vector2(-10, -5);
            var tmp = textGO.GetComponent<TextMeshProUGUI>();
            tmp.fontStyle = FontStyles.Bold;

            return btn;
        }
        private static void CreateEventSystem()
        {
            var es = new GameObject("EventSystem");
            es.AddComponent<EventSystem>();
            es.AddComponent<StandaloneInputModule>();
        }
    }
}
