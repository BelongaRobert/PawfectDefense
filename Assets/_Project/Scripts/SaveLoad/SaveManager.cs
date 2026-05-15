using System;
using System.IO;
using UnityEngine;
using PawfectDefense.Core;

namespace PawfectDefense.SaveLoad
{
    public class SaveManager : MonoBehaviour
    {
        public static SaveManager Instance { get; private set; }

        [Header("Settings")]
        public string saveFileName = "save.json";
        public bool encryptSave = false;
        public string encryptionKey = "PawfectDefense2026";

        public GameSaveData CurrentSave { get; private set; }

        private string SavePath => Path.Combine(Application.persistentDataPath, saveFileName);

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
            LoadGame();
        }

        public void SaveGame()
        {
            try
            {
                CurrentSave ??= new GameSaveData();

                if (Core.GameManager.Instance != null)
                {
                    CurrentSave.meta = Core.GameManager.Instance.MetaData ?? new MetaProgressionData();
                    CurrentSave.currentRun = Core.GameManager.Instance.CurrentRun;
                }

                string json = JsonUtility.ToJson(CurrentSave, true);

                if (encryptSave)
                {
                    json = EncryptString(json, encryptionKey);
                }

                File.WriteAllText(SavePath, json);
                Debug.Log($"Game saved to: {SavePath}");
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to save game: {e.Message}");
            }
        }

        public void LoadGame()
        {
            try
            {
                if (File.Exists(SavePath))
                {
                    string json = File.ReadAllText(SavePath);

                    if (encryptSave)
                    {
                        json = DecryptString(json, encryptionKey);
                    }

                    CurrentSave = JsonUtility.FromJson<GameSaveData>(json);
                    CurrentSave ??= new GameSaveData();

                    // Ensure lists are initialized
                    CurrentSave.meta ??= new MetaProgressionData();
                    CurrentSave.meta.unlockedCardIds ??= new System.Collections.Generic.List<string>();
                    CurrentSave.meta.unlockedPetIds ??= new System.Collections.Generic.List<string>();
                    CurrentSave.meta.unlockedRelicIds ??= new System.Collections.Generic.List<string>();
                    CurrentSave.meta.runHistory ??= new System.Collections.Generic.List<RunHistoryEntry>();

                    Debug.Log("Game loaded successfully.");
                }
                else
                {
                    CurrentSave = new GameSaveData();
                    Debug.Log("No save file found. Created new save.");
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to load game: {e.Message}");
                CurrentSave = new GameSaveData();
            }
        }

        public void DeleteSave()
        {
            try
            {
                if (File.Exists(SavePath))
                {
                    File.Delete(SavePath);
                    CurrentSave = new GameSaveData();
                    Debug.Log("Save file deleted.");
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to delete save: {e.Message}");
            }
        }

        public bool HasSaveFile()
        {
            return File.Exists(SavePath);
        }

        private string EncryptString(string text, string key)
        {
            // Simple XOR encryption for basic obfuscation
            char[] result = new char[text.Length];
            for (int i = 0; i < text.Length; i++)
            {
                result[i] = (char)(text[i] ^ key[i % key.Length]);
            }
            return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(new string(result)));
        }

        private string DecryptString(string encryptedText, string key)
        {
            try
            {
                string text = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(encryptedText));
                char[] result = new char[text.Length];
                for (int i = 0; i < text.Length; i++)
                {
                    result[i] = (char)(text[i] ^ key[i % key.Length]);
                }
                return new string(result);
            }
            catch
            {
                Debug.LogWarning("Decryption failed, returning raw text.");
                return encryptedText;
            }
        }
    }

    [Serializable]
    public class GameSaveData
    {
        public MetaProgressionData meta;
        public RunData currentRun;
        public SettingsData settings;
        public string version = "1.0";

        public GameSaveData()
        {
            meta = new MetaProgressionData();
            settings = new SettingsData();
        }
    }

    [Serializable]
    public class MetaProgressionData
    {
        public System.Collections.Generic.List<string> unlockedCardIds = new System.Collections.Generic.List<string>();
        public System.Collections.Generic.List<string> unlockedPetIds = new System.Collections.Generic.List<string>();
        public System.Collections.Generic.List<string> unlockedRelicIds = new System.Collections.Generic.List<string>();
        public int premiumCurrency = 0;
        public System.Collections.Generic.List<RunHistoryEntry> runHistory = new System.Collections.Generic.List<RunHistoryEntry>();
        public int lifetimeRuns = 0;
        public int lifetimeWins = 0;
    }

    [Serializable]
    public class RunData
    {
        public int currentAct = 1;
        public int currentHealth = 80;
        public int maxHealth = 80;
        public System.Collections.Generic.List<string> currentDeckIds = new System.Collections.Generic.List<string>();
        public System.Collections.Generic.List<string> currentRelicIds = new System.Collections.Generic.List<string>();
        public string mapNodeId = "start";
        public int gold = 0;
        public string petTypeUsed = "Dog";
        public int floorReached = 1;
        public string startDate;
    }

    [Serializable]
    public class RunHistoryEntry
    {
        public string petTypeUsed;
        public int floorReached;
        public bool victory;
        public string date;
    }

    [Serializable]
    public class SettingsData
    {
        public float masterVolume = 1f;
        public float musicVolume = 1f;
        public float sfxVolume = 1f;
        public bool screenShake = true;
        public bool fastMode = false;
        public string language = "en";
    }
}
