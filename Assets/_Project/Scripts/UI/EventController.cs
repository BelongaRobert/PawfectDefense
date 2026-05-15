using UnityEngine;
using UnityEngine.UI;
using TMPro;
using PawfectDefense.Data;
using PawfectDefense.Core;

namespace PawfectDefense.UI
{
    public class EventController : MonoBehaviour
    {
        [Header("UI References")]
        public TextMeshProUGUI eventTitleText;
        public TextMeshProUGUI eventDescriptionText;
        public Button choiceAButton;
        public Button choiceBButton;
        public Button leaveButton;

        private EventData currentEvent;

        private void Start()
        {
            choiceAButton?.onClick.AddListener(OnChoiceAClicked);
            choiceBButton?.onClick.AddListener(OnChoiceBClicked);
            leaveButton?.onClick.AddListener(OnLeaveClicked);
            GenerateRandomEvent();
        }

        private void GenerateRandomEvent()
        {
            int roll = Random.Range(0, 4);
            currentEvent = roll switch
            {
                0 => CreateEvent(
                    "Stray in Need",
                    "You find a wounded stray hiding behind a crate. It looks scared but friendly.",
                    "Offer food (Lose 10 HP, Gain a random relic)",
                    "Keep moving (Nothing happens)"),
                1 => CreateEvent(
                    "Abandoned Toy Box",
                    "An old toy box sits in the corner, slightly ajar. Something gleams inside.",
                    "Open it (Gain 50 gold)",
                    "Leave it (Nothing happens)"),
                2 => CreateEvent(
                    "Mysterious Vet",
                    "A figure in a white coat offers you a syringe. 'This will help,' they say.",
                    "Accept (Heal 15 HP)",
                    "Decline (Nothing happens)"),
                3 => CreateEvent(
                    "Training Ground",
                    "An empty training area with old equipment. A good place to practice.",
                    "Train hard (Lose 5 HP, Upgrade a random card)",
                    "Rest instead (Heal 10 HP)"),
                _ => CreateEvent(
                    "Quiet Corner",
                    "Nothing of interest here. Just a quiet place to catch your breath.",
                    "Continue",
                    "Continue")
            };

            DisplayEvent();
        }

        private EventData CreateEvent(string title, string description, string choiceA, string choiceB)
        {
            return new EventData
            {
                Title = title,
                Description = description,
                ChoiceAText = choiceA,
                ChoiceBText = choiceB
            };
        }

        private void DisplayEvent()
        {
            if (eventTitleText != null)
                eventTitleText.text = currentEvent.Title;

            if (eventDescriptionText != null)
                eventDescriptionText.text = currentEvent.Description;

            if (choiceAButton != null)
            {
                var btnText = choiceAButton.GetComponentInChildren<TextMeshProUGUI>();
                if (btnText != null) btnText.text = currentEvent.ChoiceAText;
            }

            if (choiceBButton != null)
            {
                var btnText = choiceBButton.GetComponentInChildren<TextMeshProUGUI>();
                if (btnText != null) btnText.text = currentEvent.ChoiceBText;
            }
        }

        private void OnChoiceAClicked()
        {
            ApplyOutcomeA();
            EndEvent();
        }

        private void OnChoiceBClicked()
        {
            ApplyOutcomeB();
            EndEvent();
        }

        private void ApplyOutcomeA()
        {
            if (Core.GameManager.Instance?.CurrentRun == null) return;

            var run = Core.GameManager.Instance.CurrentRun;

            switch (currentEvent.Title)
            {
                case "Stray in Need":
                    run.currentHealth = Mathf.Max(1, run.currentHealth - 10);
                    var relics = RelicLibrary.Instance?.GetRandomRelics(1);
                    if (relics != null && relics.Count > 0)
                        run.currentRelicIds.Add(relics[0].relicId);
                    Debug.Log("You helped the stray and gained a relic!");
                    break;
                case "Abandoned Toy Box":
                    run.gold += 50;
                    Debug.Log("You found 50 gold!");
                    break;
                case "Mysterious Vet":
                    run.currentHealth = Mathf.Min(run.maxHealth, run.currentHealth + 15);
                    Debug.Log("The syringe healed you!");
                    break;
                case "Training Ground":
                    run.currentHealth = Mathf.Max(1, run.currentHealth - 5);
                    if (run.currentDeckIds.Count > 0)
                    {
                        string cardId = run.currentDeckIds[Random.Range(0, run.currentDeckIds.Count)];
                        Debug.Log($"Your {cardId} has been upgraded!");
                    }
                    break;
            }
        }

        private void ApplyOutcomeB()
        {
            if (Core.GameManager.Instance?.CurrentRun == null) return;

            var run = Core.GameManager.Instance.CurrentRun;

            switch (currentEvent.Title)
            {
                case "Stray in Need":
                case "Abandoned Toy Box":
                    Debug.Log("You decided to move on.");
                    break;
                case "Mysterious Vet":
                    Debug.Log("You declined the offer.");
                    break;
                case "Training Ground":
                    run.currentHealth = Mathf.Min(run.maxHealth, run.currentHealth + 10);
                    Debug.Log("You rested and recovered 10 HP.");
                    break;
            }
        }

        private void EndEvent()
        {
            choiceAButton?.gameObject.SetActive(false);
            choiceBButton?.gameObject.SetActive(false);
            leaveButton?.gameObject.SetActive(true);
        }

        private void OnLeaveClicked()
        {
            Core.SceneLoader.Instance?.LoadScene("Map");
        }
    }

    public class EventData
    {
        public string Title;
        public string Description;
        public string ChoiceAText;
        public string ChoiceBText;
    }
}
