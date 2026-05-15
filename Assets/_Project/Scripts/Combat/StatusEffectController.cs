using System.Collections.Generic;
using UnityEngine;
using PawfectDefense.Data;

namespace PawfectDefense.Combat
{
    public class StatusEffectController : MonoBehaviour
    {
        [System.Serializable]
        public class StatusInstance
        {
            public StatusType type;
            public int stacks;
            public int duration;

            public StatusInstance(StatusType type, int stacks, int duration)
            {
                this.type = type;
                this.stacks = stacks;
                this.duration = duration;
            }
        }

        [Header("Active Statuses")]
        [SerializeField] private List<StatusInstance> activeStatuses = new List<StatusInstance>();

        public List<StatusInstance> ActiveStatuses => activeStatuses;

        public void AddStatus(StatusType type, int stacks, int duration)
        {
            if (type == StatusType.None || stacks <= 0) return;

            var existing = activeStatuses.Find(s => s.type == type);
            if (existing != null)
            {
                existing.stacks += stacks;
                existing.duration = Mathf.Max(existing.duration, duration);
            }
            else
            {
                activeStatuses.Add(new StatusInstance(type, stacks, duration));
            }

            OnStatusApplied(type, stacks);
        }

        public void ReduceStatusStacks(StatusType type, int amount)
        {
            var status = activeStatuses.Find(s => s.type == type);
            if (status != null)
            {
                status.stacks -= amount;
                if (status.stacks <= 0)
                {
                    activeStatuses.Remove(status);
                    OnStatusRemoved(type);
                }
            }
        }

        public void ReduceStatusDuration(StatusType type)
        {
            var status = activeStatuses.Find(s => s.type == type);
            if (status != null)
            {
                status.duration--;
                if (status.duration <= 0)
                {
                    activeStatuses.Remove(status);
                    OnStatusRemoved(type);
                }
            }
        }

        public void RemoveStatus(StatusType type)
        {
            var status = activeStatuses.Find(s => s.type == type);
            if (status != null)
            {
                activeStatuses.Remove(status);
                OnStatusRemoved(type);
            }
        }

        public bool HasStatus(StatusType type)
        {
            return activeStatuses.Exists(s => s.type == type && s.stacks > 0);
        }

        public int GetStatusStacks(StatusType type)
        {
            var status = activeStatuses.Find(s => s.type == type);
            return status?.stacks ?? 0;
        }

        public void ProcessTurnStart()
        {
            // Reduce duration of temporary statuses
            var toRemove = new List<StatusInstance>();
            foreach (var status in activeStatuses)
            {
                if (status.duration > 0)
                {
                    status.duration--;
                    if (status.duration <= 0)
                        toRemove.Add(status);
                }
            }

            foreach (var status in toRemove)
            {
                activeStatuses.Remove(status);
                OnStatusRemoved(status.type);
            }
        }

        public void ProcessTurnEnd()
        {
            // Handle end-of-turn status effects
        }

        public void ClearAllStatuses()
        {
            activeStatuses.Clear();
        }

        private void OnStatusApplied(StatusType type, int stacks)
        {
            Debug.Log($"Applied {stacks} stacks of {type}");
            // Visual feedback: show status icon
        }

        private void OnStatusRemoved(StatusType type)
        {
            Debug.Log($"Removed {type}");
            // Visual feedback: remove status icon
        }
    }
}
