# Forge Character Animation System

This module adds the first production-facing character import and animation database pipeline to the existing Forge Engine editor.

## Implemented

- GLB/GLTF character inspection through the Rust backend.
- Humanoid detection from real GLB node names with a Forge humanoid slot map.
- Forge Auto-Rig JSON generation.
- Foot IK configuration generation when left/right foot bones are detected.
- Animation pack indexing from real `.zip` archives without extracting all clips.
- Locomotion tagging for idle, walk, run, sprint, strafe, jump, fall, land, crouch, turn and lean clips.
- Default WASD player controller profile generation.
- Procedural animation selection from real movement intent:
  - velocity
  - acceleration
  - grounded state
  - jump/crouch/sprint state
  - camera-relative direction
  - last selected state
- Generated locomotion state machine data from indexed animation tags.
- Character manifest output under `Content/Characters/<Name>/`.
- Optional placement into the active level as a real scene object with:
  - `CharacterController`
  - `SkeletalMesh`
  - `AnimationStateMachine`
  - `PlayerStart`
- Editor Characters tab for import, humanoid detection, animation indexing and generated-file review.
- Animation debug tools for testing state selection and generated state machines.
- Inspector display for selected character entities.

## Local Content

The provided character and animation libraries are installed locally for packaging:

- `engine/StarterContent/Characters/rigged_character.glb`
- `engine/AnimationPacks/Universal Animation Library[Standard].zip`
- `engine/AnimationPacks/Universal Animation Library 2[Standard].zip`
- `engine/AnimationPacks/Animations_V1_01.zip`
- `artifacts/windows/AnimationPacks/`

The runtime discovery command searches the current app folder, repository content folders and the user's Downloads folder.

## Current Runtime Contract

The editor writes durable data that the runtime can consume:

- `character.forge_character`
- `Rig/forge_autorig.json`
- `Animations/animation_database.json`
- `Controller/player_controller.json`

Play Mode can now detect the generated `PlayerStart` and character controller components. Full skeletal animation playback, retarget pose solving and runtime foot-placement are the next engine-runtime integration step.

The procedural animation selector reads `animation_database.json` and returns:

- selected state
- selected clip
- movement direction
- speed
- blend time
- selection reasons
- warnings when a state has no exact clip

## Planned

- GPU skinning upload and skeletal pose buffer in `forge_renderer_worker`.
- Retarget solver from Forge humanoid slots to arbitrary imported skeletons.
- Runtime skeletal animation graph evaluator.
- Foot IK ground traces against the physics scene.
- In-viewport animation preview and scrubber.
- Blend tree authoring UI and state transition rules.
- Cooked animation cache format for faster startup with thousands of clips.
