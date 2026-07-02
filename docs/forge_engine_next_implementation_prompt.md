# Forge Engine Next Implementation Prompt

Je bent een senior Rust/Tauri desktop engineer, React/TypeScript engineer, ECS/scene architect, game runtime engineer, animation systems engineer, UX designer en build/release engineer.

Werk verder in de bestaande Forge Engine codebase. Dit is geen rewrite en geen losse demo. Alles moet in de bestaande editor, installer, runtime, renderer workers, projectstructuur en artifact/release-flow geïntegreerd worden.

## Belangrijk

- Geen mock UI.
- Geen fake success.
- Geen fake components.
- Geen fake animation playback.
- Geen hardcoded demo-state als echte engine-state wordt verwacht.
- Alles moet custom Forge UI gebruiken volgens `docs/custom_ui_contract.md`.
- Alle data moet in echte projectbestanden, engine folders of AppData/project folders staan.
- Als iets niet volledig runtime-klaar is, toon een duidelijke warning/state en schrijf een TODO in docs, maar toon geen nepwerkende status.

## Inspiratiebron

Gebruik de Unreal Engine PCG overview alleen als conceptuele referentie voor node graphs, point data, attributes, templates, live update en debug panels:

https://dev.epicgames.com/documentation/unreal-engine/procedural-content-generation-overview

Vertaal dit naar Forge Engine-systemen. Kopieer geen Unreal-specifieke namen of implementatie.

## 1. Inspector System

Maak de Inspector een volledig generiek Forge property editor systeem.

De Inspector moet alle geselecteerde objecten, assets, levels, graph nodes, materials, scripts, characters, animations, skyboxes, lights, cameras, physics components en plugins kunnen bewerken.

### Requirements

- Custom UI voor elk veldtype.
- Geen native browser `<select>` styling zichtbaar.
- Alle dropdowns moeten `CustomSelect` gebruiken.
- Alle toggles moeten Forge switches gebruiken.
- Alle numeric values moeten custom stepper/slider/input krijgen.
- Alle color fields krijgen custom color swatch + picker.
- Alle asset references krijgen een custom asset picker.
- Alle component arrays krijgen custom reorder/add/remove controls.
- Alle errors blijven binnen een vaste panelhoogte en mogen de layout niet omhoog duwen.
- Custom scrollbars overal.
- Inspector sections zijn collapsible.
- Details worden per componenttype gerenderd via een registry.
- Onbekende componenttypes krijgen een veilige JSON editor fallback.

### Component Dropdown

Voeg in de Inspector een `Add Component` dropdown toe.

Categorieën:

- Transform
- Rendering
- Lighting
- Physics
- Audio
- Gameplay
- Character
- Animation
- Blueprint
- Script
- AI
- Procedural Generation
- Networking
- Editor-only

Componenten moeten echte scene components toevoegen aan het levelbestand via backend save/update commands.

Voorbeelden:

- Static Mesh
- Skeletal Mesh
- Character Controller
- Animation State Machine
- Camera
- Directional Light
- Point Light
- Spot Light
- Skybox
- Physics Body
- Collider
- Audio Source
- Blueprint Instance
- Forge Script
- PCG Graph Instance

## 2. Installer Folder Fixes

De Forge installer moet bij install en project creation echte folders maken voor:

- `Content/Blueprints`
- `Content/Graphs`
- `Content/Scripts`
- `Content/Characters`
- `Content/Animations`
- `Content/AnimationPacks`
- `Content/Procedural`
- `Content/Materials`
- `Content/Meshes`
- `Content/Scenes`
- `Content/Textures`
- `Content/Audio`
- `Content/UI`
- `Saved/Logs`
- `Saved/Autosaves`
- `Saved/Backups`
- `Intermediate`
- `Build`
- `Exports`

Ook de installed engine folder moet engine templates bevatten voor:

- Blueprint templates
- Forge Script templates
- Character controller templates
- PCG/procedural graph templates
- Starter character
- Starter animation database

## 3. New Graph Custom Modal

Vervang simpele prompt/dialogs voor graph creation door een custom modal.

Modal requirements:

- Donkere Forge UI.
- Graph type cards.
- Search/filter.
- Template picker.
- Folder picker.
- Name validation.
- Duplicate-name validation.
- Preview van wat wordt aangemaakt.

Graph types:

- Actor Blueprint
- Component Blueprint
- UI Blueprint
- Animation Blueprint
- Material Graph
- PCG / Procedural Graph
- AI Behavior Graph
- Audio Graph
- Forge Script Graph

Bij Create:

- Schrijf een echt graph-bestand naar project disk.
- Open het graph automatisch.
- Voeg het toe aan Content Browser.
- Toon errors zonder layout jump.

## 4. “Reageert Niet” Bug Fixes

Voorkom dat Forge Engine Setup/Editor Windows “reageert niet” krijgt.

Rules:

- Geen zware file copy, zip indexing, worker extraction, shader build of animation indexing op de UI thread.
- Alle lange taken moeten async/backend worker-driven zijn.
- UI krijgt progress events.
- Elke operatie moet cancelbaar zijn waar praktisch.
- Startup splash moet niet blokkeren.
- Health checks moeten streamen naar UI.
- Grote zips indexeren in chunks.
- Logs moeten virtualized worden.
- Errors moeten capped height hebben.

## 5. Forge Script Language

Maak een custom game scripting language voor Forge projects.

Naam:

- Forge Script

Bestandsextensies:

- `.forge`
- `.forge_script`

Project folders:

- `Content/Scripts`
- `Content/Scripts/Gameplay`
- `Content/Scripts/UI`
- `Content/Scripts/AI`
- `Content/Scripts/Procedural`

Features:

- Syntax highlighting in editor.
- New Script custom modal.
- Script asset metadata.
- Script compile/check command.
- Script errors panel.
- Script attach component in Inspector.
- Script lifecycle:
  - `on_start`
  - `on_update(delta)`
  - `on_trigger_enter`
  - `on_trigger_exit`
  - `on_destroy`

Do not fake execution. First milestone may parse/validate and attach scripts, then runtime execution comes in next milestone.

## 6. Project Export And Share From Header

Voeg in de header een custom `Share / Export` menu toe.

Options:

- Export Project Zip
- Export Playable Build
- Export Asset Pack
- Export Blueprint Pack
- Export Character Pack
- Copy Project Share Manifest
- Open Exports Folder

Requirements:

- Exports are real files.
- Use backend commands.
- Show real progress.
- Do not delete user projects.
- Include project manifest, content, scripts, graphs, selected assets and dependency metadata.

## 7. Character Model And Animation Pack

De meegeleverde GLB character en duizenden animaties moeten onderdeel zijn van de engine distribution.

Current assets:

- `engine/StarterContent/Characters/rigged_character.glb`
- `engine/AnimationPacks/Animations_V1_01.zip`
- `engine/AnimationPacks/Universal Animation Library[Standard].zip`
- `engine/AnimationPacks/Universal Animation Library 2[Standard].zip`

Build/release requirements:

- De Windows download moet deze content bevatten.
- Als content niet in de exe zelf past of te groot is, package het naast de exe in `AnimationPacks/` en laat de engine die folder automatisch ontdekken.
- Geen ontbrekende-worker of ontbrekende-animation errors bij normale startup.
- Als een pack ontbreekt, toon een echte missing-content warning met repair/install action.

## 8. Procedural Character Animation

Maak een echte procedural animation selection layer.

Wanneer een GLB character in de wereld staat en Play wordt gestart:

- De engine kiest automatisch de beste animation clip voor de huidige movement intent.
- WASD bestuurt het character meteen.
- Shift sprint.
- Space jump.
- Ctrl crouch.
- Movement blendt soepel.
- Camera/player movement moet niet schokken.

Supported states:

- idle
- walk
- run
- sprint
- strafe left
- strafe right
- backward walk
- backward run
- jump start
- in air / fall
- land
- crouch idle
- crouch walk
- turn left
- turn right
- lean left
- lean right

Selection inputs:

- velocity
- acceleration
- movement direction
- grounded state
- jump state
- crouch state
- sprint state
- camera-relative input
- last state
- blend time
- available tagged clips

Backend/runtime data:

- `animation_database.json`
- `forge_autorig.json`
- `player_controller.json`
- generated animation state machine
- runtime pose state
- optional cooked animation cache

Do not pretend skeletal playback works until the renderer/runtime actually evaluates pose data.

Milestone 1:

- Build clip classifier from indexed packs.
- Generate state machine from tags.
- WASD preview moves the character marker/model.
- Show animation choice in debug panel.

Milestone 2:

- Runtime skeletal clip playback.
- Blend between clips.
- Camera-relative locomotion.

Milestone 3:

- Retargeting.
- Foot IK.
- Turn-in-place.
- Lean.
- Jump/fall/land transitions.

Milestone 4:

- Motion matching style selection.
- Procedural additive layers.
- Network prediction hooks.

## 9. Procedural Graph / PCG System

Maak een Forge Procedural Graph systeem geïnspireerd op PCG concepts.

Data concepts:

- Points
- Density
- Bounds
- Seed
- Attributes
- Attribute domains:
  - `@Data`
  - `@Points`
  - `@Elements`
- Debug views
- Templates
- Live viewport update

Node categories:

- Input
- Sampler
- Point Ops
- Density
- Filter
- Metadata
- Spatial
- Spawner
- Subgraph
- Debug
- Blueprint
- Forge Script

Output:

- Spawn scene objects
- Spawn static meshes
- Scatter foliage/props
- Generate procedural helper data

Again: no fake generated content. Generated objects must be real scene objects or a real procedural preview cache.

## 10. GitHub / Local Sync

Before final release work:

- Fetch latest from GitHub.
- If local branch is behind, merge/rebase safely.
- Do not overwrite user changes.
- Commit all intended local changes.
- Push branch to GitHub.
- If direct main push is not allowed, create a Codex branch and PR.

## Acceptance Criteria

- Inspector can edit every known component through custom UI.
- Components can be added through a custom dropdown.
- Installer/project creation creates Blueprint/script/character/animation/procedural folders.
- New Graph flow uses a custom modal.
- UI no longer jumps when errors appear.
- Long startup/install/index tasks do not freeze the window.
- Forge Script files can be created, edited, validated and attached.
- Header has real export/share commands.
- Character GLB can be placed in the world.
- Animation packs are indexed from disk.
- Play Mode can control a placed character with WASD.
- Animation state selection is based on real input/state/tag data.
- Desktop artifact includes or discovers the animation packs.
- All changes are committed and uploaded to GitHub.
