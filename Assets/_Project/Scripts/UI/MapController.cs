using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using PawfectDefense.Data;
using PawfectDefense.Core;
using PawfectDefense.Combat;

namespace PawfectDefense.UI
{
    public class MapController : MonoBehaviour
    {
        [Header("Map Settings")]
        public int floorsPerAct = 15;
        public int nodesPerFloor = 3;
        public float floorSpacingY = 120f;
        public float nodeSpacingX = 200f;

        [Header("Node Prefabs")]
        public GameObject nodePrefab;
        public GameObject pathLinePrefab;
        public Transform mapContainer;
        public Transform pathContainer;

        [Header("Node Types")]
        public Sprite combatIcon;
        public Sprite eliteIcon;
        public Sprite bossIcon;
        public Sprite shopIcon;
        public Sprite restIcon;
        public Sprite eventIcon;
        public Sprite unknownIcon;

        [Header("Colors")]
        public Color availableColor = new Color(0.25f, 0.55f, 0.85f); // bright blue
        public Color visitedColor = new Color(0.3f, 0.3f, 0.3f, 0.4f);
        public Color currentColor = new Color(1f, 0.85f, 0.2f); // golden yellow

        public event Action<MapNode> OnNodeSelected;

        private List<List<MapNode>> mapGrid = new List<List<MapNode>>();
        private MapNode currentNode;
        private int currentAct = 1;

        private void Start()
        {
            int act = GameManager.Instance?.CurrentRun?.currentAct ?? 1;
            GenerateMap(act);
        }

        public void GenerateMap(int act)
        {
            currentAct = act;
            ClearMap();

            // Ensure mapContainer pivot is at top-center so floor 0 starts at the top
            if (mapContainer != null)
            {
                RectTransform mapRect = mapContainer.GetComponent<RectTransform>();
                if (mapRect != null && Mathf.Abs(mapRect.pivot.y - 1f) > 0.01f)
                    mapRect.pivot = new Vector2(0.5f, 1f);
            }

            // Generate nodes floor by floor
            for (int floor = 0; floor < floorsPerAct; floor++)
            {
                List<MapNode> floorNodes = new List<MapNode>();
                int nodesOnFloor = (floor == floorsPerAct - 1) ? 1 : nodesPerFloor;

                for (int i = 0; i < nodesOnFloor; i++)
                {
                    MapNodeType type = DetermineNodeType(floor, floorsPerAct);
                    Vector2 position = CalculateNodePosition(floor, i, nodesOnFloor);
                    MapNode node = CreateNode(type, position, floor, i);
                    floorNodes.Add(node);
                }

                mapGrid.Add(floorNodes);
            }

            // Create connections between floors
            int pathCount = CreateConnections();
            Debug.Log($"MapController: drew {pathCount} paths between nodes.");

            // Set starting node
            if (mapGrid.Count > 0 && mapGrid[0].Count > 0)
            {
                SetCurrentNode(mapGrid[0][0]);
            }

            // Scroll to top so floor 0 is visible
            ScrollRect scrollRect = GetComponentInChildren<ScrollRect>();
            if (scrollRect != null)
                scrollRect.verticalNormalizedPosition = 1f;
        }

        private MapNodeType DetermineNodeType(int floor, int totalFloors)
        {
            if (floor == 0) return MapNodeType.Combat;
            if (floor == totalFloors - 1) return MapNodeType.Boss;

            // Weighted random based on floor progress
            float progress = (float)floor / totalFloors;
            float rand = UnityEngine.Random.value;

            if (progress < 0.2f)
            {
                // Early floors: mostly combat
                if (rand < 0.7f) return MapNodeType.Combat;
                if (rand < 0.85f) return MapNodeType.Event;
                return MapNodeType.Shop;
            }
            else if (progress < 0.6f)
            {
                // Mid floors: more variety
                if (rand < 0.5f) return MapNodeType.Combat;
                if (rand < 0.65f) return MapNodeType.Elite;
                if (rand < 0.8f) return MapNodeType.Event;
                if (rand < 0.9f) return MapNodeType.Shop;
                return MapNodeType.Rest;
            }
            else
            {
                // Late floors: harder encounters
                if (rand < 0.4f) return MapNodeType.Combat;
                if (rand < 0.6f) return MapNodeType.Elite;
                if (rand < 0.75f) return MapNodeType.Event;
                if (rand < 0.9f) return MapNodeType.Shop;
                return MapNodeType.Rest;
            }
        }

        private Vector2 CalculateNodePosition(int floor, int index, int totalNodesOnFloor)
        {
            float x = (index - (totalNodesOnFloor - 1) * 0.5f) * nodeSpacingX;
            float y = -floor * floorSpacingY;
            return new Vector2(x, y);
        }

        private MapNode CreateNode(MapNodeType type, Vector2 position, int floor, int index)
        {
            if (nodePrefab == null)
            {
                Debug.LogError("MapController: nodePrefab is null! Cannot create node.");
                return null;
            }

            GameObject nodeObj = Instantiate(nodePrefab, mapContainer);
            nodeObj.SetActive(true);
            RectTransform rt = nodeObj.GetComponent<RectTransform>();
            rt.anchoredPosition = position;

            MapNode node = nodeObj.GetComponent<MapNode>();
            if (node == null)
                node = nodeObj.AddComponent<MapNode>();

            node.Initialize(type, floor, index, this);
            return node;
        }

        private int CreateConnections()
        {
            int pathCount = 0;
            System.Random rng = new System.Random();

            for (int floor = 0; floor < mapGrid.Count - 1; floor++)
            {
                List<MapNode> currentFloor = mapGrid[floor];
                List<MapNode> nextFloor = mapGrid[floor + 1];

                // Track which next-floor nodes have at least one incoming connection
                bool[] hasIncoming = new bool[nextFloor.Count];

                for (int i = 0; i < currentFloor.Count; i++)
                {
                    MapNode node = currentFloor[i];
                    int connections = rng.Next(1, 3); // 1 or 2 connections

                    for (int c = 0; c < connections; c++)
                    {
                        // Bias toward adjacent columns for clean paths
                        int preferredStart = Mathf.Max(0, i - 1);
                        int preferredEnd = Mathf.Min(nextFloor.Count - 1, i + 1);
                        if (preferredStart > preferredEnd) preferredStart = preferredEnd;
                        int targetIndex = rng.Next(preferredStart, preferredEnd + 1);

                        MapNode target = nextFloor[targetIndex];
                        if (!node.ConnectedNodes.Contains(target))
                        {
                            node.ConnectTo(target);
                            DrawPath(node, target);
                            pathCount++;
                            hasIncoming[targetIndex] = true;
                        }
                    }
                }

                // Ensure every node on the next floor has at least one parent
                for (int t = 0; t < nextFloor.Count; t++)
                {
                    if (!hasIncoming[t])
                    {
                        // Pick the closest parent
                        int parentIdx = Mathf.Clamp(t, 0, currentFloor.Count - 1);
                        MapNode parent = currentFloor[parentIdx];
                        MapNode target = nextFloor[t];
                        if (!parent.ConnectedNodes.Contains(target))
                        {
                            parent.ConnectTo(target);
                            DrawPath(parent, target);
                            pathCount++;
                        }
                    }
                }
            }
            return pathCount;
        }

        private void DrawPath(MapNode from, MapNode to)
        {
            if (pathLinePrefab == null)
            {
                Debug.LogWarning("MapController: pathLinePrefab is null, cannot draw path.");
                return;
            }
            if (pathContainer == null)
            {
                Debug.LogWarning("MapController: pathContainer is null, cannot draw path.");
                return;
            }

            GameObject lineObj = Instantiate(pathLinePrefab, pathContainer);
            lineObj.SetActive(true);
            RectTransform rt = lineObj.GetComponent<RectTransform>();

            Vector2 start = from.GetPosition();
            Vector2 end = to.GetPosition();
            Vector2 dir = end - start;
            float distance = dir.magnitude;
            float angle = Mathf.Atan2(dir.y, dir.x) * Mathf.Rad2Deg;

            rt.anchoredPosition = (start + end) / 2f;
            rt.sizeDelta = new Vector2(distance, 6f);
            rt.rotation = Quaternion.Euler(0, 0, angle);
            rt.pivot = new Vector2(0.5f, 0.5f);
        }

        private void ClearMap()
        {
            mapGrid.Clear();
            currentNode = null;

            foreach (Transform child in mapContainer)
                Destroy(child.gameObject);
            foreach (Transform child in pathContainer)
                Destroy(child.gameObject);
        }

        public void SetCurrentNode(MapNode node)
        {
            if (currentNode != null)
                currentNode.SetState(MapNodeState.Visited);

            currentNode = node;
            currentNode.SetState(MapNodeState.Current);

            // Update available next nodes
            foreach (var next in node.ConnectedNodes)
            {
                if (next.State == MapNodeState.Locked)
                    next.SetState(MapNodeState.Available);
            }
        }

        public void OnNodeClicked(MapNode node)
        {
            if (node.State != MapNodeState.Available && node.State != MapNodeState.Current)
                return;

            OnNodeSelected?.Invoke(node);

            switch (node.NodeType)
            {
                case MapNodeType.Combat:
                case MapNodeType.Elite:
                case MapNodeType.Boss:
                    StartCombat(node);
                    break;
                case MapNodeType.Shop:
                    OpenShop();
                    break;
                case MapNodeType.Rest:
                    OpenRestSite();
                    break;
                case MapNodeType.Event:
                    OpenEvent();
                    break;
            }
        }

        private void StartCombat(MapNode node)
        {
            bool elite = node.NodeType == MapNodeType.Elite;
            bool boss = node.NodeType == MapNodeType.Boss;

            var encounter = Data.EncounterLibrary.Instance?.GetRandomEncounterForAct(currentAct, elite, boss);
            if (encounter != null)
            {
                // Store encounter for CombatManager to pick up on scene load
                Combat.CombatManager.NextEncounter = encounter;
                Core.SceneLoader.Instance?.LoadScene("Combat");
            }
        }

        private void OpenShop()
        {
            Core.SceneLoader.Instance?.LoadScene("Shop");
        }

        private void OpenRestSite()
        {
            Core.SceneLoader.Instance?.LoadScene("Rest");
        }

        private void OpenEvent()
        {
            Core.SceneLoader.Instance?.LoadScene("Event");
        }
    }

    public enum MapNodeType { Combat, Elite, Boss, Shop, Rest, Event, Unknown }
    public enum MapNodeState { Locked, Available, Visited, Current }

    public class MapNode : MonoBehaviour
    {
        public MapNodeType NodeType { get; private set; }
        public MapNodeState State { get; private set; }
        public int Floor { get; private set; }
        public int Index { get; private set; }
        public List<MapNode> ConnectedNodes { get; private set; } = new List<MapNode>();

        private MapController controller;
        private Button button;
        private Image iconImage;
        private Image bgImage;

        public void Initialize(MapNodeType type, int floor, int index, MapController ctrl)
        {
            NodeType = type;
            Floor = floor;
            Index = index;
            controller = ctrl;
            State = MapNodeState.Locked;

            button = GetComponent<Button>();
            if (button != null)
                button.onClick.AddListener(() => controller.OnNodeClicked(this));

            bgImage = GetComponent<Image>();
            iconImage = transform.GetChild(0)?.GetComponent<Image>();

            UpdateVisuals();
        }

        public void ConnectTo(MapNode other)
        {
            if (!ConnectedNodes.Contains(other))
                ConnectedNodes.Add(other);
        }

        public void SetState(MapNodeState newState)
        {
            State = newState;
            UpdateVisuals();
        }

        public Vector2 GetPosition()
        {
            RectTransform rt = GetComponent<RectTransform>();
            return rt != null ? rt.anchoredPosition : Vector2.zero;
        }

        private void UpdateVisuals()
        {
            if (bgImage == null) return;

            bgImage.color = State switch
            {
                MapNodeState.Available => controller.availableColor,
                MapNodeState.Visited => controller.visitedColor,
                MapNodeState.Current => controller.currentColor,
                _ => Color.gray
            };

            if (iconImage != null)
            {
                iconImage.sprite = NodeType switch
                {
                    MapNodeType.Combat => controller.combatIcon,
                    MapNodeType.Elite => controller.eliteIcon,
                    MapNodeType.Boss => controller.bossIcon,
                    MapNodeType.Shop => controller.shopIcon,
                    MapNodeType.Rest => controller.restIcon,
                    MapNodeType.Event => controller.eventIcon,
                    _ => controller.unknownIcon
                };
            }

            if (button != null)
                button.interactable = State == MapNodeState.Available || State == MapNodeState.Current;
        }
    }
}
