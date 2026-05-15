# Pawfect Defense - Unity Setup Guide

## Project Overview
Pawfect Defense is a roguelike deck-builder inspired by Slay the Spire, themed around pet rescue. Built for Unity 2022.3 LTS with iOS target (IL2CPP).

## Prerequisites
- Unity 2022.3 LTS or newer
- .NET Standard 2.1 API Compatibility
- TextMeshPro package (included by default)
- (Optional) DOTween for enhanced animations
- (Optional) Addressables for DLC support

## Import Steps

### 1. Create New Unity Project
- Open Unity Hub
- New Project → 2D (URP or Built-in)
- Unity version: 2022.3 LTS or later

### 2. Copy Scripts
Copy the entire `Assets/_Project` folder into your Unity project's `Assets` directory:
```
Assets/
  _Project/
    Scripts/
      Audio/
      Cards/
      Combat/
      Core/
      Data/
      Deck/
      SaveLoad/
      UI/
```

### 3. Configure Script Execution Order
Go to `Edit → Project Settings → Script Execution Order` and add:
1. `Bootstrap` (order: -100)
2. `GameManager` (order: -50)
3. `SaveManager` (order: -40)
4. All other managers (default order)

### 4. Create Required Scenes
Create these scenes in `Assets/_Project/Scenes/` and add them to Build Settings:
1. **Bootstrap** - Empty scene with a single GameObject containing:
   - `Bootstrap` script
   - Assign all manager prefabs (or leave empty to auto-create)
2. **MainMenu** - Title screen with:
   - Canvas with `MainMenuController`
   - Start Run, Continue, Settings buttons
3. **DeckSelect** - Pet selection screen with:
   - Canvas with `DeckSelectController`
   - 4 pet selection buttons
   - Deck preview text area
4. **Map** - Map progression screen with:
   - Canvas with `MapController`
   - Node prefabs, path line prefabs
5. **Combat** - Battle scene with:
   - Canvas for UI
   - Player spawn point
   - Enemy spawn points
   - `CombatManager` on a manager GameObject
   - `HandController` for card hand
6. **Shop** - Merchant screen (placeholder)
7. **Rest** - Rest site screen (placeholder)
8. **Event** - Event screen (placeholder)

### 5. Create Prefabs
Create the following prefabs in `Assets/_Project/Prefabs/`:

**Card Prefab:**
- GameObject with RectTransform
- Add `CardView` script
- Add `CanvasGroup`
- Add `Image` for background/frame
- Add child Image for card art
- Add child TextMeshPro for name, description, cost
- Add `EventTrigger` components for drag/hover
- Tag: "Card"

**Enemy Prefab:**
- SpriteRenderer for visuals
- Add `EnemyEntity` script
- Add `StatusEffectController`
- Add `BoxCollider2D` for hit detection
- Add Canvas with health bar (Slider + Text)
- Tag: "Enemy"

**Player Prefab:**
- SpriteRenderer for visuals
- Add `PlayerEntity` script
- Add `EnergyManager`
- Add `DeckManager`
- Add `StatusEffectController`
- Add `BoxCollider2D`
- Tag: "Player"

**Map Node Prefab:**
- Button component
- Image for background
- Child Image for icon
- Add `MapNode` script

### 6. UI Setup
Create a persistent UI Canvas in Bootstrap scene with:
- `UIManager` script
- Screens assigned:
  - MainMenuScreen (UIScreen)
  - MapScreen (UIScreen)
  - CombatScreen (UIScreen)
  - RewardScreen (UIScreen)
  - SettingsPopup (UIScreen, IsPopup = true)

### 7. Audio Setup
Create an Audio Manager GameObject in Bootstrap with:
- `AudioManager` script
- 3 AudioSource components (music, sfx, ui)
- Assign AudioClip fields in inspector

### 8. Input Configuration
Go to `Edit → Project Settings → Input Manager` and ensure:
- "Submit" mapped to Return/Enter (for end turn)
- "Cancel" mapped to Escape (for menus)
- Touch input is enabled for mobile

### 9. Build Settings
- Platform: iOS (or PC for testing)
- Architecture: ARM64
- Scripting Backend: IL2CPP
- API Compatibility: .NET Standard 2.1
- Add all scenes to Build Settings in order:
  1. Bootstrap
  2. MainMenu
  3. DeckSelect
  4. Map
  5. Combat
  6. Shop
  7. Rest
  8. Event

### 10. Testing Checklist
- [ ] Bootstrap loads without errors
- [ ] MainMenu appears
- [ ] DeckSelect shows 4 pet types with deck previews
- [ ] Map generates with nodes and paths
- [ ] Combat starts with player and enemies
- [ ] Cards can be drawn and played
- [ ] Enemy AI executes intents
- [ ] Save/Load persists data
- [ ] Audio plays for music and SFX
- [ ] UI transitions work smoothly

## Architecture Notes
- All managers use singleton pattern (`Instance`)
- Bootstrap scene initializes all persistent singletons
- ScriptableObjects are created at runtime via `CreateInstance` in library classes
- For production, convert runtime SO creation to actual `.asset` files
- JSON save system uses `Application.persistentDataPath`
- Optional XOR encryption for save files

## Customization
- Edit `CardLibrary.cs` to modify the 60 card definitions
- Edit `EnemyLibrary.cs` to modify the 6 enemy types
- Edit `EncounterLibrary.cs` to modify map encounters
- Edit `RelicLibrary.cs` to modify relic pool
- Edit `GameManager.cs` `GetStartingDeck()` to modify starting decks

## Known Limitations
- No visual card art assigned (add Sprites to `cardArt` fields)
- No enemy prefab instantiation in `CombatManager.SpawnEnemy()`
- DOTween integration is commented out / optional
- Shop and Rest scenes are placeholders
- Event system is not fully implemented

## Next Steps
1. Assign all Sprite references in ScriptableObjects
2. Create visual card prefabs with animations
3. Implement DOTween for polished card animations
4. Build out Shop and Rest site scenes
5. Add event encounter system
6. Implement meta-progression unlocks
7. Add particle effects for combat
8. Create tutorial flow
