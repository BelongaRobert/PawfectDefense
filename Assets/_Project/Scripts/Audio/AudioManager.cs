using System.Collections.Generic;
using UnityEngine;

namespace PawfectDefense.Audio
{
    public class AudioManager : MonoBehaviour
    {
        public static AudioManager Instance { get; private set; }

        [Header("Audio Sources")]
        public AudioSource musicSource;
        public AudioSource sfxSource;
        public AudioSource uiSource;

        [Header("Volume Settings")]
        [Range(0f, 1f)] public float masterVolume = 1f;
        [Range(0f, 1f)] public float musicVolume = 1f;
        [Range(0f, 1f)] public float sfxVolume = 1f;

        [Header("Music Clips")]
        public AudioClip mainMenuMusic;
        public AudioClip mapMusic;
        public AudioClip combatMusic;
        public AudioClip bossMusic;

        [Header("SFX Clips")]
        public AudioClip uiClickSfx;
        public AudioClip uiHoverSfx;
        public AudioClip cardDrawSfx;
        public AudioClip cardPlaySfx;
        public AudioClip damageSfx;
        public AudioClip blockSfx;
        public AudioClip healSfx;
        public AudioClip enemyAttackSfx;

        [Header("SFX Pool")]
        public int sfxPoolSize = 10;
        private Queue<AudioSource> sfxPool = new Queue<AudioSource>();

        private void Awake()
        {
            if (Instance != null)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;

            InitializeSFXPool();
        }

        private void InitializeSFXPool()
        {
            for (int i = 0; i < sfxPoolSize; i++)
            {
                GameObject sfxObj = new GameObject($"SFX_Pool_{i}");
                sfxObj.transform.SetParent(transform);
                AudioSource source = sfxObj.AddComponent<AudioSource>();
                source.playOnAwake = false;
                sfxPool.Enqueue(source);
            }
        }

        public void PlayMusic(AudioClip clip, bool loop = true, float fadeDuration = 0.5f)
        {
            if (clip == null || musicSource == null) return;

            StartCoroutine(FadeMusic(clip, loop, fadeDuration));
        }

        public void PlayMusic(MusicType musicType, bool loop = true)
        {
            AudioClip clip = musicType switch
            {
                MusicType.MainMenu => mainMenuMusic,
                MusicType.Map => mapMusic,
                MusicType.Combat => combatMusic,
                MusicType.Boss => bossMusic,
                _ => null
            };

            PlayMusic(clip, loop);
        }

        public void PlaySFX(AudioClip clip, float volume = 1f)
        {
            if (clip == null) return;

            AudioSource source = GetAvailableSFXSource();
            if (source != null)
            {
                source.clip = clip;
                source.volume = volume * sfxVolume * masterVolume;
                source.Play();
            }
        }

        public void PlaySFX(SFXType sfxType, float volume = 1f)
        {
            AudioClip clip = sfxType switch
            {
                SFXType.UIClick => uiClickSfx,
                SFXType.UIHover => uiHoverSfx,
                SFXType.CardDraw => cardDrawSfx,
                SFXType.CardPlay => cardPlaySfx,
                SFXType.Damage => damageSfx,
                SFXType.Block => blockSfx,
                SFXType.Heal => healSfx,
                SFXType.EnemyAttack => enemyAttackSfx,
                _ => null
            };

            PlaySFX(clip, volume);
        }

        public void PlayUI(AudioClip clip, float volume = 1f)
        {
            if (clip == null || uiSource == null) return;
            uiSource.PlayOneShot(clip, volume * sfxVolume * masterVolume);
        }

        public void StopMusic(float fadeDuration = 0.5f)
        {
            StartCoroutine(FadeOutMusic(fadeDuration));
        }

        public void SetMasterVolume(float volume)
        {
            masterVolume = Mathf.Clamp01(volume);
            UpdateVolumes();
        }

        public void SetMusicVolume(float volume)
        {
            musicVolume = Mathf.Clamp01(volume);
            UpdateVolumes();
        }

        public void SetSFXVolume(float volume)
        {
            sfxVolume = Mathf.Clamp01(volume);
            UpdateVolumes();
        }

        private void UpdateVolumes()
        {
            if (musicSource != null)
                musicSource.volume = musicVolume * masterVolume;

            if (uiSource != null)
                uiSource.volume = sfxVolume * masterVolume;
        }

        private AudioSource GetAvailableSFXSource()
        {
            foreach (AudioSource source in sfxPool)
            {
                if (!source.isPlaying)
                    return source;
            }

            // If all are playing, reuse the oldest one
            return sfxPool.Count > 0 ? sfxPool.Dequeue() : null;
        }

        private System.Collections.IEnumerator FadeMusic(AudioClip newClip, bool loop, float duration)
        {
            float startVolume = musicSource.volume;
            float elapsed = 0f;

            // Fade out
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                musicSource.volume = Mathf.Lerp(startVolume, 0f, elapsed / duration);
                yield return null;
            }

            // Swap clip
            musicSource.clip = newClip;
            musicSource.loop = loop;
            musicSource.Play();

            // Fade in
            elapsed = 0f;
            float targetVolume = musicVolume * masterVolume;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                musicSource.volume = Mathf.Lerp(0f, targetVolume, elapsed / duration);
                yield return null;
            }
        }

        private System.Collections.IEnumerator FadeOutMusic(float duration)
        {
            float startVolume = musicSource.volume;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                musicSource.volume = Mathf.Lerp(startVolume, 0f, elapsed / duration);
                yield return null;
            }

            musicSource.Stop();
        }
    }

    public enum MusicType
    {
        MainMenu,
        Map,
        Combat,
        Boss
    }

    public enum SFXType
    {
        UIClick,
        UIHover,
        CardDraw,
        CardPlay,
        Damage,
        Block,
        Heal,
        EnemyAttack
    }
}
