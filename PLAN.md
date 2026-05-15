# Pawfect Defense — Implementation Plan

## Game Concept
A cozy roguelike deck-builder for iOS where you play as a pet rescuer fighting off Animal Control officers. Cards represent pets (dogs, cats, reptiles, birds) with unique abilities. Slay the Spire-inspired mechanics with a cute, hand-drawn aesthetic.

---

## 1. Unity Project Structure

```
Assets/
  _Project/
    Animations/      — Card flip, draw, attack, hurt animations
    Art/
      Sprites/
        Cards/       — Pet card illustrations (hand-drawn)
        Characters/  — Player, Animal Control officers
        UI/          — Buttons, frames, icons, backgrounds
        VFX/         — Particle effects (hearts, hits, blocks)
      Materials/
    Audio/
      Music/         — Main menu, map, combat, boss themes
      SFX/           — Card draw, play, hit, block, heal sounds
    Data/
      ScriptableObjects/
        Cards/       — All card definitions
        Enemies/     — Enemy types and intents
        Encounters/  — Combat encounter configurations
        Pets/        — Pet types (starting decks)
        Relics/      — Passive relic abilities
    Prefabs/
      Cards/         — Card prefab (art + frame + text)
      Characters/    — Player and enemy battle prefabs
      UI/            — Screen panels, HUD elements
    Scenes/
      Bootstrap.unity      — Persistent managers
      MainMenu.unity       — Title screen
      DeckSelect.unity     — Character + pet type selection
      Map.unity            — Node-based progression
      Combat.unity         — Turn-based battle
      Reward.unity         — Post-combat card choice
      Shop.unity           — Merchant screen
      Event.unity          — Narrative choice events
      Collection.unity     — Unlocked cards viewer
    Scripts/
      Core/        — GameManager, SceneLoader, UIManager
      Data/        — ScriptableObject definitions, CardDatabase
      Combat/      — CombatManager, TurnManager, entities, AI
      Cards/       — CardInstance, CardView, HandController, effects
      Deck/        — DeckManager (draw/discard/exhaust piles)
      Map/         — MapGenerator, MapPlayerToken
      UI/          — Screen controllers, safe area handling
      SaveLoad/    — SaveManager, JSON serialization
      Audio/       — AudioManager, music layers
      Monetization/ — IAP hooks, premium currency
      Utils/       — Extensions, helpers
    Resources/
    StreamingAssets/
```

---

## 2. Core Systems Architecture

### GameManager (Singleton, Bootstrap scene)
- Holds references to all core systems
- Tracks `CurrentRun` (active run data) and `MetaData` (unlocks)
- `DontDestroyOnLoad`

### Card System

**Data Layer**
- `CardDataSO`: ScriptableObject defining card properties
  - `cardId`, `cardName`, `description`, `energyCost` (1-3)
  - `rarity` (Common/Uncommon/Rare)
  - `petType` (Dog/Cat/Reptile/Bird/Neutral)
  - `cardArt` (Sprite reference)
  - `List<CardEffectData> effects`

- `CardEffectData`: Serializable struct
  - `effectType`: Damage, Block, Heal, Draw, ApplyStatus, GainEnergy
  - `target`: Self, SingleEnemy, AllEnemies
  - `value`: integer amount
  - `statusId` (if applicable): Weak, Vulnerable, Poison, Strength

**Runtime Layer**
- `CardInstance`: Runtime wrapper with reference to `CardDataSO`
- `CardView`: MonoBehaviour handling visuals, drag/drop, hover
  - Implements Unity's `IBeginDragHandler`, `IDragHandler`, `IEndDragHandler`
  - Visual states: idle, hover (scale 1.2x), drag (follow finger), target highlight
- `HandController`: Manages card fan layout
  - Arc arrangement with slight rotation per card
  - Dynamic repositioning on play/draw
- `CardEffect`: Abstract base class
  - `DamageEffect`, `BlockEffect`, `HealEffect`, `DrawEffect`, `ApplyStatusEffect`

**Card Database**
- `CardDatabase`: Loads all `CardDataSO` from `Resources/Data/Cards` into Dictionary
- Access by `cardId` for instantiating cards

### Combat System

- `CombatManager`: Singleton, orchestrates the battle
  - Events: `OnCombatStart`, `OnPlayerTurnStart`, `OnEnemyTurnStart`, `OnCombatEnd`
  - Holds `PlayerEntity` and `List<EnemyEntity>`

- `CombatEntity`: Abstract base
  - Fields: `currentHealth`, `maxHealth`, `currentBlock`, `StatusEffectController`
  - `PlayerEntity`: Has `EnergyManager` and `DeckManager`
  - `EnemyEntity`: Has `EnemyAI` and `IntentSystem`

- `EnergyManager`: Tracks current/max energy (default 3, reset each player turn)
- `DamageCalculator`: Computes final damage considering strength, vulnerable, weak, block

### Turn Manager

State machine driven by coroutines:
```
StartOfCombat → PlayerTurn → EnemyTurn → EndOfCombat
```

- **StartOfCombat**: Apply relics, shuffle deck, draw 5 cards
- **PlayerTurn**: Reset energy, enable input, wait for End Turn
- **EnemyTurn**: Disable input, resolve each enemy's intent
- **EndOfCombat**: Check win/lose, trigger rewards

### Enemy AI

- `EnemyAI`: Abstract base, `GetNextIntent()` returns `EnemyIntent`
  - `RandomAI`: Weighted random selection
  - `PatternAI`: Fixed sequence cycling
  - `ConditionalAI`: Behavior changes at health thresholds

- `EnemyIntent`: Data holder
  - `intentType`: Attack, Defend, Buff, Debuff
  - `baseValue`, `target`, `associatedStatus`

- `IntentVisualizer`: Shows icon + number above enemy head (sword for attack, shield for defend)

### Deck Management

`DeckManager` handles all pile operations:
- `drawPile`, `handPile`, `discardPile`, `exhaustPile`
- `ShuffleDiscardIntoDraw()`: Auto-called when draw empty
- `Draw(int amount)`: Animate cards from draw to hand
- `PlayCard()`: Validate energy, execute effects, move to discard/exhaust
- `DiscardHand()`: End of player turn

---

## 3. Data Architecture

### ScriptableObjects

| Asset | Path | Key Fields |
|-------|------|------------|
| `CardDataSO` | `Data/ScriptableObjects/Cards/` | id, name, cost, rarity, petType, art, effects |
| `PetDataSO` | `Data/ScriptableObjects/Pets/` | petId, petName, petType, startingDeckId |
| `EnemyDataSO` | `Data/ScriptableObjects/Enemies/` | id, name, health, aiType, intents[], art |
| `EncounterDataSO` | `Data/ScriptableObjects/Encounters/` | id, enemy list, gold reward |
| `RelicDataSO` | `Data/ScriptableObjects/Relics/` | id, name, description, rarity, passiveEffect |
| `StartingDeckSO` | `Data/ScriptableObjects/Decks/` | deckId, petType, cardIds list |

### Save System

- `SaveManager`: Singleton, serializes to `Application.persistentDataPath/save.json`
- `GameSaveData`: Top-level serializable class
  - `MetaProgressionData meta`
  - `RunData currentRun` (null if no active run)
  - `SettingsData settings`

- `MetaProgressionData`:
  - `List<string> unlockedCardIds`
  - `List<string> unlockedPetIds`
  - `List<string> unlockedRelicIds`
  - `int premiumCurrency` ("Gems")
  - `List<RunHistoryEntry> runHistory`
  - `int lifetimeRuns`, `int lifetimeWins`

- `RunData` (snapshot of active run):
  - `currentAct`, `currentHealth`, `maxHealth`
  - `List<string> currentDeckIds`
  - `List<string> currentRelicIds`
  - `string mapNodeId`, `int gold`

### Addressables vs Resources

**MVP**: Use `Resources.Load` for simplicity. All SOs in `Resources/Data/...`
**Post-MVP**: Migrate to Addressables for DLC/expansion support

---

## 4. Game Loop Flow

```
[MainMenu]
  ├─ New Run
  │   └─ [DeckSelect] Choose Character (Male/Female) + Pet Type
  │       └─ [Map] Procedurally generated Act 1
  │           └─ Node traversal
  │               ├─ Combat → [Combat] → Victory/Defeat
  │               │   └─ Victory → [Reward] → Back to Map
  │               │   └─ Defeat → [Run Over] → Unlock check → MainMenu
  │               ├─ Elite → Harder combat → Better reward
  │               ├─ Shop → Buy/remove cards → Back to Map
  │               ├─ Event → Choice outcome → Back to Map
  │               ├─ Rest → Heal or upgrade card → Back to Map
  │               └─ Boss → Combat → Act Complete or Victory
  │
  ├─ Continue
  │   └─ Load RunData → [Map] at saved node
  ├─ Collection
  │   └─ View all unlocked cards, pets, relics
  └─ Settings
```

### Combat Flow (Detailed)

1. **Start of Combat**
   - Spawn player and enemies from encounter data
   - Apply start-of-combat relics
   - Initialize deck and shuffle
   - Draw 5 cards

2. **Player Turn**
   - Reset energy to 3
   - Enable card drag interaction
   - Player drags cards to targets
   - Valid play: deduct energy, execute effects, animate to discard
   - Press End Turn → discard hand → Enemy Turn

3. **Enemy Turn**
   - Iterate enemies, resolve intents sequentially
   - Show intent icon → animate attack → apply damage/block/buffs
   - Check player health, defeat if <= 0

4. **End of Combat**
   - Victory: calculate rewards (gold + 1 of 3 cards + relic chance)
   - Defeat: run ends, check unlocks

### Map Generation

- `MapGenerator`: Creates directed acyclic graph per Act
- 5 columns (floors), 2-4 nodes per column
- Connections only forward
- First column: always Combat
- Last column: always Boss
- Middle columns: weighted (60% Combat, 15% Event, 10% Shop, 10% Rest, 5% Elite)

---

## 5. UI/UX Design

### Setup
- **Canvas**: Screen Space - Overlay
- **Base Resolution**: Design for 19.5:9 (iPhone), use 1920x1080 reference with CanvasScaler
- **Safe Area**: Custom component on all root panels for notch/home indicator
- **Text**: TextMeshPro with SDF shaders

### Screen Specifications

| Screen | Key Elements |
|--------|--------------|
| **MainMenu** | Animated logo, New Run, Continue, Collection, Settings. Parallax cozy shelter background |
| **DeckSelect** | Character carousel (Male/Female). Pet type buttons (Dog/Cat/Reptile/Bird). Preview starting deck. Begin button |
| **Combat** | Bottom: HandPanel (fan), EnergyPanel (3 orbs), EndTurnButton. Top: EnemyArea (1-3 enemies, health, intent). Left: PlayerPortrait (health, block, relics) |
| **Reward** | 3 CardViews face-up. Tap to add to deck. Skip button. Gold amount |
| **Shop** | Grid of purchasable cards/relics. Remove Card service. Gold top-right |
| **Map** | Scrollable background. Node buttons. Player token animates between nodes. Top bar: Act, deck count, relic count |
| **Collection** | Filter bar (All/Dog/Cat/Reptile/Bird/Relics). Grid of cards. Tap for detail popup |

### Hand Layout Algorithm

`HandController` arranges cards in a fan:
- Arc distribution along quadratic Bezier curve
- Angle: -10 to +10 degrees per card
- Vertical offset: edge cards lower than center
- Hover: translate up 50px, scale 1.2x
- Drag: break from layout, follow pointer, tilt by velocity
- Play: fly to target, shrink into discard

### Touch Input (Mobile Critical)

- Minimum button: 88x88 units (Apple HIG)
- Card drag threshold: >20px before breaking from hand
- Target selection: drag over enemy → enemy highlights red → release to confirm
- End Turn: single tap, 0.3s cooldown to prevent double-tap

### Animations

- Use **DOTween** for all UI tweening (not Unity Animator)
- Card draw: spawn at deck, tween to hand slot (0.25s, Ease.OutCubic)
- Damage: flash white→red→shake, float damage numbers
- Block: green shield icon scales up/down
- Screen transitions: fade to black (0.3s), load, fade in

---

## 6. Monetization Hooks

**Launch**: Premium $1-5, no IAP
**Future**: Architecture supports these hooks:

1. **Cosmetic Pets** (Player Skins)
   - Alternate character appearances
   - Locked in DeckSelect with gem icon

2. **Bonus Starting Decks**
   - Alternate deck templates per pet type
   - "Aggressive Dog", "Defensive Cat", etc.

3. **Starter Relics**
   - Choose one before run starts
   - Purchased from Relic Shop

4. **Card Backs & Battlefields**
   - Visual customization only

5. **New Pet Types / Acts**
   - Expansion content (e.g., "Aquatic" pet type)
   - Addressables for DLC download

### Implementation

- `IAPManager`: Wraps Unity IAP
- `EntitlementManager`: Tracks owned products in MetaProgressionData
- `PremiumCurrency`: "Gems" integer
- `AdManager`: Placeholder for rewarded video (if free version tested)

---

## 7. Art Asset List (MVP)

### Characters & Enemies
- [ ] Player Male — idle, hurt, attack (3 poses)
- [ ] Player Female — idle, hurt, attack (3 poses)
- [ ] Officer Basic (3 variants) — idle, attack, hurt
- [ ] Officer Elite — idle, attack, hurt
- [ ] Officer Boss — idle, attack, hurt, special

### Pet Card Art (36 cards for MVP)
**Dog Deck (9 cards):**
- [ ] Golden Retriever, German Shepherd, Beagle, Poodle, Bulldog, Husky, Corgi, Dachshund, Labrador

**Cat Deck (9 cards):**
- [ ] Siamese, Maine Coon, Tabby, Sphynx, Ragdoll, Persian, Bengal, Scottish Fold, Russian Blue

**Reptile Deck (9 cards):**
- [ ] Leopard Gecko, Ball Python, Iguana, Bearded Dragon, Chameleon, Corn Snake, Blue-Tongued Skink, Crested Gecko, Red-Eared Slider

**Bird Deck (9 cards):**
- [ ] Parakeet, Cockatiel, Macaw, Crow, Parrotlet, Lovebird, Conure, Finch, Pigeon

### UI & Environment
- [ ] bg_main_menu — cozy shelter exterior
- [ ] bg_combat_shelter — indoor kennel
- [ ] bg_combat_park — grassy park
- [ ] bg_map_act1 — suburban neighborhood
- [ ] ui_card_frame (Common/Uncommon/Rare variants)
- [ ] ui_card_back
- [ ] ui_healthbar_frame + fill
- [ ] ui_block_icon
- [ ] ui_energy_orb
- [ ] ui_intent_attack, defend, buff, debuff
- [ ] ui_button_primary, secondary
- [ ] ui_node_combat, elite, rest, shop, event, boss
- [ ] ui_status icons (weak, vulnerable, poison, strength)

### Effects
- [ ] vfx_hit_slash — red slash particle
- [ ] vfx_block_shield — blue hexagon burst
- [ ] vfx_heal_heart — green particles + heart
- [ ] vfx_card_play_sparkle — small burst

### Audio
- [ ] sfx_ui_click, hover
- [ ] sfx_card_draw (paper slide), play (whoosh)
- [ ] sfx_damage_hit (thud), block (metal), heal (chime)
- [ ] sfx_enemy_attack (grunt + swing)
- [ ] bgm_main_menu (acoustic, cozy)
- [ ] bgm_map (light percussion)
- [ ] bgm_combat (tense but not dark)
- [ ] bgm_boss (elevated intensity)

---

## 8. Build Pipeline

### Unity Settings

| Setting | Value |
|---------|-------|
| Unity Version | 2022.3 LTS |
| Render Pipeline | Built-in RP (or URP for 2D lighting) |
| Scripting Backend | IL2CPP |
| API Compatibility | .NET Standard 2.1 |
| Target | iOS 13.0+ |
| Architecture | ARM64 |
| Orientation | Portrait |
| Status Bar | Hidden |

### Sprite Optimization
- Import as Sprite (2D and UI)
- Max texture: 1024 card art, 512 UI, 2048 backgrounds
- Compression: ASTC 6x6 (iOS)
- Sprite Atlases: UI_Common, Cards, Characters

### Performance
- Target 30fps (`Application.targetFrameRate = 30`)
- Object pooling for damage numbers and card views

### App Store & TestFlight
1. App Store Connect: Create app, fill Privacy Nutrition Label (no data collected)
2. Content Rating: Mild cartoon violence
3. Price tier: $0.99 - $4.99
4. Xcode: Build, sign, archive, upload to TestFlight
5. Internal testing: up to 100 team members (no review)

---

## 9. Milestone Breakdown (8 Weeks)

### Week 1: Foundation & Card System
- Unity project setup, folder structure
- Import TextMeshPro, DOTween
- Create `CardDataSO`, `CardEffectData`, `CardDatabase`
- Implement `CardInstance`, `CardView` with drag/hover
- Build `HandController` with fan layout
- Create 5 test cards
- **Deliverable**: Test scene with draggable cards and effect logging

### Week 2: Combat & Turn Management
- `CombatManager`, `CombatEntity`, `PlayerEntity`, `EnemyEntity`
- `TurnManager` state machine
- `EnergyManager`, `DeckManager`
- `DamageCalculator`
- Basic `EnemyAI` (random attack/defend)
- Combat UI: health bars, block, energy, end turn
- **Deliverable**: Playable 1v1 combat

### Week 3: Scenes & Game Flow
- `SceneLoader` with loading screen
- `MainMenu`, `DeckSelect`, `Combat`, `Reward` scenes
- Starting deck assignment by pet type (4 decks, 10 cards each)
- Hardcoded `Map` with 3 nodes
- Flow: Menu → DeckSelect → Map → Combat → Reward → Map
- **Deliverable**: Full run loop with 3 combats

### Week 4: Content & Encounters
- 5 unique enemies with distinct AI (Pattern, Conditional)
- `EncounterDataSO` for 1/2/3-enemy fights
- Elite and Boss encounters
- Status effects: Vulnerable, Weak, Poison, Strength
- 3 relics with passive effects
- **Deliverable**: Full Act 1 with boss

### Week 5: Save/Load & Meta-Progression
- `SaveManager` with JSON serialization
- `RunData` persistence (continue after app close)
- `MetaProgressionData` and unlock system
- `Collection` screen
- `Settings` screen
- **Deliverable**: Saves progress, unlocks new cards after win

### Week 6: Events, Shop & Map Generation
- Procedural `MapGenerator` (DAG, weighted nodes)
- `Shop` scene (buy/remove cards)
- 5 narrative `EventDataSO` with choices
- `Event` scene UI
- Map token movement animation
- **Deliverable**: Random map, shop, rest, events

### Week 7: Audio, VFX & Mobile Polish
- `AudioManager` with music layers
- Particle effects (hit, block, heal)
- Screen shake on heavy damage
- Touch input polish (drag thresholds, safe areas)
- iOS build test on device
- **Deliverable**: iOS build with audio and VFX

### Week 8: QA, Balance & App Store Prep
- Playtest all 4 decks, balance costs/effects
- Edge cases (simultaneous death, empty draw, full hand)
- App Store Connect record
- Screenshots for 6.5" and 5.5" iPhone
- TestFlight internal testing
- **Deliverable**: TestFlight build submitted

### Post-MVP Roadmap
- Month 2: IAP integration, cosmetic store, alternate decks
- Month 3: Act 2 content (new enemies, map, music)
- Month 4: Daily Challenge, Game Center leaderboards
- Month 5: Localization (ES, FR, DE, JP, KR)

---

## 10. Key Design Decisions (Need User Input)

### 10.1 Pet Type Archetypes

| Pet Type | Theme | Playstyle |
|----------|-------|-----------|
| **Dog** | Loyal, protective | Balanced offense/defense |
| **Cat** | Agile, sneaky | Discard synergy, quick combos |
| **Reptile** | Slow, powerful | High cost, big payoff |
| **Bird** | Flock tactics | Swarm, multi-hit, evasion |

*Does this match your vision? Any archetype changes?*

### 10.2 Card Naming Convention

Example cards by pet type:
- **Dog**: "Golden Retriever — 2 damage, heal 1", "German Shepherd — 3 damage, gain 1 Strength"
- **Cat**: "Siamese — 1 damage, draw 1", "Maine Coon — 2 damage, discard to deal +2"
- **Reptile**: "Ball Python — 4 damage, costs 2", "Leopard Gecko — Gain 5 Block"
- **Bird**: "Parakeet — 1 damage x3", "Macaw — All enemies take 2 damage"

*Do you want actual breed names, or generic names like "Stray Dog" / "Alley Cat"?*

### 10.3 Enemy Types (Animal Control)

Proposed enemy roster:
- **Rookie Officer** — basic attacks, low health
- **Veteran Officer** — attacks and blocks
- **Net Specialist** — applies Weak/Vulnerable
- **Captain** — buffs other officers
- **Elite: Animal Control Van** — high health, summons officers
- **Boss: The Warden** — multiple phases, special attacks

*Thoughts on enemy names and difficulty curve?*

### 10.4 Relic Examples

- **Leash of Friendship** — Start each combat with 1 extra energy
- **Treat Pouch** — Heal 2 HP after each combat
- **Squeaky Toy** — First attack each turn deals +2 damage
- **Adoption Papers** — Card rewards offer 4 choices instead of 3

*Any relic ideas you want included?*

### 10.5 Event Examples

- **"Stray on the Street"** — Find a stray pet. Options: Adopt (add card), Ignore (gain gold), Feed (heal 5 HP)
- **"Lost Pet Poster"** — See a missing pet. Options: Help (lose gold, gain relic), Ignore
- **"Pet Store Break-in"** — Sneak into pet store. Options: Steal cards (gain 2 cards, gain curse), Buy (lose gold, gain card), Leave

*Any event scenarios you want?*

---

## Next Steps

1. **Approve the plan** — Confirm archetypes, naming, enemies, events
2. **Create Unity project** — Set up folder structure, install packages
3. **Begin Week 1** — Card system foundation

**Ready to proceed? Let me know your thoughts on the design decisions above.**
