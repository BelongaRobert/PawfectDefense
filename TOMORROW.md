# Pawfect Defense — Next Session Plan

## Where We Left Off
- Unity 2022.3.62f3 installed with iOS build support
- VS Code set up as script editor
- Compilation errors fixed (CS0592 `[Header]` on properties)
- `Library/` folder deleted to force clean recompile
- `TagManager.asset` deleted (Unity will regenerate)

## Problem to Resolve First
Unity may be compiling from a GitHub-cloned copy instead of the fixed D:\ drive copy.

**Fix tomorrow:**
1. Open Unity Hub
2. Remove any PawfectDefense project that points to a GitHub/Temp path
3. Add project from: `D:\Claude\Clawsight\projects\PawfectDefense`
4. Open it — should compile clean and exit Safe Mode

## Tomorrow's Work Plan

### Phase 1: Bootstrap Scene
- Create `Bootstrap.unity` scene
- Add empty GameObject named `Bootstrap`
- Attach `Bootstrap.cs` script
- Set up singleton initialization order

### Phase 2: Manager Prefabs
- Create prefabs for: GameManager, AudioManager, SaveManager, UIManager, SceneLoader
- Wire them into Bootstrap
- Test scene loading to MainMenu

### Phase 3: Main Menu Scene
- Create `MainMenu.unity` scene
- Canvas with title, Start Run, Continue, Settings buttons
- Attach `MainMenuController.cs`
- Wire button click events

### Phase 4: Deck Select Scene
- Create `DeckSelect.unity` scene
- 4 pet selection buttons (Dog, Cat, Reptile, Bird)
- Attach `DeckSelectController.cs`
- Show deck preview on hover/select

### Phase 5: Map Scene
- Create `Map.unity` scene
- Canvas with procedural node grid
- Attach `MapController.cs`
- Create `MapNode` prefab
- Test node generation and path connections

### Phase 6: Combat Scene
- Create `Combat.unity` scene
- Player spawn point, enemy spawn points
- Attach `CombatManager.cs`, `TurnManager.cs`
- Create `Card` prefab with `CardView.cs`
- Create `Enemy` prefab with `EnemyEntity.cs`
- Create `Player` prefab with `PlayerEntity.cs`
- Attach `HandController.cs` for card hand UI
- Test draw, play, discard, enemy turn cycle

### Phase 7: Build Settings
- Add all scenes to Build Settings in order:
  1. Bootstrap
  2. MainMenu
  3. DeckSelect
  4. Map
  5. Combat
  6. Shop (placeholder)
  7. Rest (placeholder)
  8. Event (placeholder)

### Phase 8: Inspector Wiring
- Assign ScriptableObject references
- Set up AudioManager audio sources
- Configure UIManager screens
- Set SceneLoader loading screen references

### Phase 9: Testing
- Bootstrap → MainMenu flow
- Deck select → Map flow
- Map node click → Combat flow
- Combat: draw, play, win/lose
- Save/load persistence

## Files Ready
All scripts exist in `Assets/_Project/Scripts/`. Just need scenes, prefabs, and Inspector wiring.
