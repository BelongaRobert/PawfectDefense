using UnityEngine;
using PawfectDefense.Data;
using PawfectDefense.SaveLoad;
using PawfectDefense.Audio;
using PawfectDefense.UI;

namespace PawfectDefense.Core
{
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("Managers")]
        public SaveLoad.SaveManager SaveManager;
        public Audio.AudioManager AudioManager;
        public UI.UIManager UIManager;
        public SceneLoader SceneLoader;

        public SaveLoad.RunData CurrentRun { get; set; }
        public SaveLoad.MetaProgressionData MetaData { get; set; }

        private void Awake()
        {
            if (Instance != null)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
            InitializeGame();
        }

        private void InitializeGame()
        {
            if (SaveManager != null)
            {
                SaveManager.LoadGame();
                MetaData = SaveManager.CurrentSave?.meta ?? new SaveLoad.MetaProgressionData();
                CurrentRun = SaveManager.CurrentSave?.currentRun;
            }
            else
            {
                MetaData = new SaveLoad.MetaProgressionData();
            }
        }

        public void StartNewRun(PetType petType)
        {
            CurrentRun = new SaveLoad.RunData
            {
                currentAct = 1,
                currentHealth = 80,
                maxHealth = 80,
                petTypeUsed = petType.ToString(),
                gold = 0,
                currentDeckIds = GetStartingDeck(petType),
                currentRelicIds = new System.Collections.Generic.List<string>(),
                mapNodeId = "start"
            };

            SaveManager?.SaveGame();
        }

        public void EndRun(bool victory)
        {
            MetaData.lifetimeRuns++;
            if (victory)
                MetaData.lifetimeWins++;

            CurrentRun = null;
            SaveManager?.SaveGame();
        }

        public void UnlockCard(string cardId)
        {
            if (!MetaData.unlockedCardIds.Contains(cardId))
            {
                MetaData.unlockedCardIds.Add(cardId);
                SaveManager?.SaveGame();
            }
        }

        public bool IsCardUnlocked(string cardId)
        {
            return MetaData.unlockedCardIds.Contains(cardId);
        }

        public System.Collections.Generic.List<string> GetStartingDeck(PetType petType)
        {
            // Returns the default starting deck for each pet type
            return petType switch
            {
                PetType.Dog => new System.Collections.Generic.List<string>
                {
                    "stray_mutt", "stray_mutt",
                    "loyal_retriever", "loyal_retriever",
                    "protective_shepherd",
                    "playful_beagle",
                    "gentle_labrador",
                    "fierce_bulldog",
                    "swift_husky",
                    "bouncy_corgi",
                    "digging_dachshund",
                    "howling_hound",
                    "pack_leader",
                    "guard_dog"
                },
                PetType.Cat => new System.Collections.Generic.List<string>
                {
                    "alley_cat", "alley_cat",
                    "sly_siamese", "sly_siamese",
                    "fluffy_maine_coon",
                    "curious_tabby",
                    "hairless_sphynx",
                    "cuddly_ragdoll",
                    "grumpy_persian",
                    "wild_bengal",
                    "folded_scottish",
                    "blue_russian",
                    "sneaky_ninja",
                    "nine_lives"
                },
                PetType.Reptile => new System.Collections.Generic.List<string>
                {
                    "gecko_grip", "gecko_grip",
                    "coiled_python", "coiled_python",
                    "basking_iguana",
                    "bearded_defender",
                    "colorful_chameleon",
                    "slithering_corn",
                    "blue_tongue",
                    "crested_climber",
                    "slider_swimmer",
                    "turtle_shell",
                    "venom_strike",
                    "shed_skin"
                },
                PetType.Bird => new System.Collections.Generic.List<string>
                {
                    "chirpy_parakeet", "chirpy_parakeet",
                    "singing_cockatiel", "singing_cockatiel",
                    "colorful_macaw",
                    "clever_crow",
                    "tiny_parrotlet",
                    "loving_lovebird",
                    "loud_conure",
                    "fluttering_finch",
                    "messenger_pigeon",
                    "flock_call",
                    "bird_of_prey",
                    "migration"
                },
                _ => new System.Collections.Generic.List<string>()
            };
        }

        private void OnApplicationPause(bool pause)
        {
            if (pause)
                SaveManager?.SaveGame();
        }

        private void OnApplicationQuit()
        {
            SaveManager?.SaveGame();
        }
    }
}
