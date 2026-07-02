import type { BlueprintDataType, BlueprintNode, BlueprintNodeDefinition, BlueprintPin } from "../types/blueprint-types";

type PinDirection = "input" | "output";
type PinKind = "execution" | "data";

interface NodeSpec {
  type: string;
  name: string;
  category: string;
  description: string;
  mode: BlueprintNode["executionMode"];
  runtime?: boolean;
  inputs?: BlueprintPin[];
  outputs?: BlueprintPin[];
  properties?: Record<string, unknown>;
  keywords?: string[];
  icon?: string;
  color?: string;
}

const categoryColors: Record<string, string> = {
  "Event Nodes": "#8B5CF6",
  "Flow Control Nodes": "#4F7BFF",
  "Variable Nodes": "#30D158",
  "Math Nodes": "#48C78E",
  "Vector/Transform Nodes": "#64D2FF",
  "Entity/Actor Nodes": "#2997FF",
  "Component Nodes": "#5E9BFF",
  "Input Nodes": "#A78BFA",
  "Physics Nodes": "#FF9F0A",
  "Character Movement Nodes": "#FFB340",
  "Camera Nodes": "#5AC8FA",
  "UI Nodes": "#FF5AC8",
  "Audio Nodes": "#BF5AF2",
  "Animation Nodes": "#FF6482",
  "AI Nodes": "#FFD60A",
  "Gameplay Nodes": "#30D158",
  "Scene/Level Nodes": "#1E7BFF",
  "Asset Nodes": "#AF52DE",
  "Save/Load Nodes": "#AC8E68",
  "Networking Nodes": "#00C7BE",
  "Debug Nodes": "#FF453A",
  "Custom/User Nodes": "#8E8E93"
};

export const blueprintCategories = [
  "Favorites",
  "Event Nodes",
  "Flow Control Nodes",
  "Variable Nodes",
  "Math Nodes",
  "Vector/Transform Nodes",
  "Entity/Actor Nodes",
  "Component Nodes",
  "Input Nodes",
  "Physics Nodes",
  "Character Movement Nodes",
  "Camera Nodes",
  "UI Nodes",
  "Audio Nodes",
  "Animation Nodes",
  "AI Nodes",
  "Gameplay Nodes",
  "Scene/Level Nodes",
  "Asset Nodes",
  "Save/Load Nodes",
  "Networking Nodes",
  "Debug Nodes",
  "Custom/User Nodes"
] as const;

const execIn = pin("exec", "Exec", "input", "execution", "Exec", true);
const thenOut = pin("then", "Then", "output", "execution", "Exec", false, true);

function pin(id: string, name: string, direction: PinDirection, pinKind: PinKind, dataType: BlueprintDataType, required = false, multipleConnectionsAllowed = false, defaultValue?: unknown): BlueprintPin {
  return { id, name, direction, pinKind, dataType, required, multipleConnectionsAllowed, defaultValue };
}

function node(spec: NodeSpec): BlueprintNodeDefinition {
  return {
    type: spec.type,
    displayName: spec.name,
    category: spec.category,
    description: spec.description,
    inputs: spec.inputs ?? [],
    outputs: spec.outputs ?? [],
    properties: spec.properties ?? {},
    executionMode: spec.mode,
    runtimeSupported: Boolean(spec.runtime),
    icon: spec.icon ?? spec.name.slice(0, 1).toUpperCase(),
    color: spec.color ?? categoryColors[spec.category] ?? "#2997FF",
    keywords: spec.keywords ?? []
  };
}

const specs: NodeSpec[] = [
  { type: "event.begin_play", name: "Event Begin Play", category: "Event Nodes", description: "Runs when an actor or level starts.", mode: "event", runtime: true, outputs: [thenOut], keywords: ["start", "level", "actor"], icon: "EV" },
  { type: "event.tick", name: "Event Tick", category: "Event Nodes", description: "Runs every frame with Delta Time.", mode: "event", runtime: true, outputs: [thenOut, pin("deltaTime", "Delta Time", "output", "data", "Float")], keywords: ["frame", "update"], icon: "TK" },
  { type: "event.key_pressed", name: "Event On Key Pressed", category: "Event Nodes", description: "Runs when a keyboard key is pressed.", mode: "event", runtime: true, outputs: [thenOut, pin("key", "Key", "output", "data", "String")], properties: { key: "E" }, keywords: ["input", "keyboard"], icon: "KY" },
  { type: "event.key_released", name: "Event On Key Released", category: "Event Nodes", description: "Runs when a keyboard key is released.", mode: "event", runtime: false, outputs: [thenOut, pin("key", "Key", "output", "data", "String")], properties: { key: "E" }, icon: "KY" },
  { type: "event.trigger_enter", name: "Event On Trigger Enter", category: "Event Nodes", description: "Runs when an entity enters a trigger zone.", mode: "event", runtime: true, outputs: [thenOut, pin("other", "Other Actor", "output", "data", "EntityRef")], keywords: ["collision", "trigger"], icon: "TR" },
  { type: "event.trigger_exit", name: "Event On Trigger Exit", category: "Event Nodes", description: "Runs when an entity exits a trigger zone.", mode: "event", runtime: false, outputs: [thenOut, pin("other", "Other Actor", "output", "data", "EntityRef")], icon: "TR" },
  { type: "event.collision_enter", name: "Event On Collision Enter", category: "Event Nodes", description: "Runs when collision begins.", mode: "event", outputs: [thenOut, pin("other", "Other Actor", "output", "data", "EntityRef")], icon: "CL" },
  { type: "event.collision_exit", name: "Event On Collision Exit", category: "Event Nodes", description: "Runs when collision ends.", mode: "event", outputs: [thenOut, pin("other", "Other Actor", "output", "data", "EntityRef")], icon: "CL" },
  { type: "event.damage_taken", name: "Event On Damage Taken", category: "Event Nodes", description: "Runs when an actor receives damage.", mode: "event", outputs: [thenOut, pin("damage", "Damage", "output", "data", "Float")], keywords: ["health"], icon: "DM" },
  { type: "event.health_changed", name: "Event On Health Changed", category: "Event Nodes", description: "Runs when health changes.", mode: "event", outputs: [thenOut, pin("health", "Health", "output", "data", "Float")], icon: "HP" },
  { type: "event.death", name: "Event On Death", category: "Event Nodes", description: "Runs when an actor dies.", mode: "event", outputs: [thenOut], icon: "DE" },
  { type: "event.scene_loaded", name: "Event On Scene Loaded", category: "Event Nodes", description: "Runs after a scene loads.", mode: "event", outputs: [thenOut, pin("scene", "Scene", "output", "data", "SceneRef")], icon: "SC" },
  { type: "event.ui_button_clicked", name: "Event On UI Button Clicked", category: "Event Nodes", description: "Runs when a UI button is clicked.", mode: "event", outputs: [thenOut, pin("buttonId", "Button Id", "output", "data", "String")], icon: "UI" },
  { type: "event.network_message", name: "Event On Network Message", category: "Event Nodes", description: "Runs when a network event arrives.", mode: "event", outputs: [thenOut, pin("payload", "Payload", "output", "data", "String")], icon: "NW" },
  { type: "event.custom", name: "Custom Event", category: "Event Nodes", description: "User-defined event entry point.", mode: "event", outputs: [thenOut], properties: { eventName: "CustomEvent" }, icon: "CE" },

  { type: "flow.branch", name: "Branch", category: "Flow Control Nodes", description: "Routes execution based on a boolean condition.", mode: "impure", runtime: true, inputs: [execIn, pin("condition", "Condition", "input", "data", "Bool", true, false, false)], outputs: [pin("then", "True", "output", "execution", "Exec", false, true), pin("else", "False", "output", "execution", "Exec", false, true)], properties: { condition: true }, keywords: ["if", "else"], icon: "IF" },
  { type: "flow.sequence", name: "Sequence", category: "Flow Control Nodes", description: "Runs multiple execution outputs in order.", mode: "impure", runtime: true, inputs: [execIn], outputs: [pin("then0", "Then 0", "output", "execution", "Exec", false, true), pin("then1", "Then 1", "output", "execution", "Exec", false, true)], icon: "SQ" },
  { type: "flow.delay", name: "Delay", category: "Flow Control Nodes", description: "Schedules the next execution after a non-blocking delay.", mode: "latent", runtime: true, inputs: [execIn, pin("seconds", "Seconds", "input", "data", "Float", false, false, 1)], outputs: [thenOut], properties: { seconds: 1 }, keywords: ["timer", "wait"], icon: "DL" },
  { type: "flow.do_once", name: "Do Once", category: "Flow Control Nodes", description: "Runs once until reset.", mode: "impure", runtime: true, inputs: [execIn, pin("reset", "Reset", "input", "execution", "Exec")], outputs: [thenOut], icon: "1X" },
  { type: "flow.do_n", name: "Do N Times", category: "Flow Control Nodes", description: "Runs up to N times.", mode: "impure", inputs: [execIn, pin("n", "N", "input", "data", "Int", false, false, 3)], outputs: [thenOut], properties: { n: 3 }, icon: "DN" },
  { type: "flow.gate", name: "Gate", category: "Flow Control Nodes", description: "Opens or closes execution flow.", mode: "impure", inputs: [execIn, pin("open", "Open", "input", "execution", "Exec"), pin("close", "Close", "input", "execution", "Exec")], outputs: [thenOut], icon: "GT" },
  { type: "flow.flip_flop", name: "Flip Flop", category: "Flow Control Nodes", description: "Alternates between A and B.", mode: "impure", inputs: [execIn], outputs: [pin("a", "A", "output", "execution", "Exec", false, true), pin("b", "B", "output", "execution", "Exec", false, true)], icon: "FF" },
  { type: "flow.for_loop", name: "For Loop", category: "Flow Control Nodes", description: "Loops from first index to last index.", mode: "impure", inputs: [execIn, pin("first", "First", "input", "data", "Int"), pin("last", "Last", "input", "data", "Int")], outputs: [pin("loop", "Loop Body", "output", "execution", "Exec", false, true), thenOut, pin("index", "Index", "output", "data", "Int")], icon: "FL" },
  { type: "flow.while_loop", name: "While Loop", category: "Flow Control Nodes", description: "Loops while condition is true with safety limits.", mode: "impure", inputs: [execIn, pin("condition", "Condition", "input", "data", "Bool", true)], outputs: [pin("loop", "Loop Body", "output", "execution", "Exec", false, true), thenOut], icon: "WL" },
  { type: "flow.timer", name: "Timer", category: "Flow Control Nodes", description: "Starts a timer and triggers a callback.", mode: "latent", inputs: [execIn, pin("seconds", "Seconds", "input", "data", "Float", false, false, 5)], outputs: [thenOut], properties: { seconds: 5, looping: true }, keywords: ["loop"], icon: "TM" },
  { type: "flow.switch_int", name: "Switch On Int", category: "Flow Control Nodes", description: "Routes execution by integer value.", mode: "impure", inputs: [execIn, pin("value", "Value", "input", "data", "Int")], outputs: [pin("case0", "0", "output", "execution", "Exec", false, true), pin("default", "Default", "output", "execution", "Exec", false, true)], icon: "SI" },
  { type: "flow.return", name: "Return", category: "Flow Control Nodes", description: "Stops graph or function execution.", mode: "impure", inputs: [execIn], outputs: [], icon: "RT" },

  { type: "variable.get", name: "Get Variable", category: "Variable Nodes", description: "Reads a graph variable.", mode: "pure", runtime: true, inputs: [pin("name", "Name", "input", "data", "String", false, false, "Variable")], outputs: [pin("value", "Value", "output", "data", "Any")], properties: { name: "Variable" }, keywords: ["read"], icon: "GV" },
  { type: "variable.set", name: "Set Variable", category: "Variable Nodes", description: "Writes a graph variable.", mode: "impure", runtime: true, inputs: [execIn, pin("name", "Name", "input", "data", "String", false, false, "Variable"), pin("value", "Value", "input", "data", "Any", false)], outputs: [thenOut], properties: { name: "Variable", value: 0 }, keywords: ["write"], icon: "SV" },
  { type: "variable.toggle_bool", name: "Toggle Bool", category: "Variable Nodes", description: "Toggles a boolean variable.", mode: "impure", runtime: true, inputs: [execIn], outputs: [thenOut, pin("value", "Value", "output", "data", "Bool")], properties: { name: "Flag" }, icon: "TB" },
  { type: "variable.increment_int", name: "Increment Int", category: "Variable Nodes", description: "Adds one to an integer variable.", mode: "impure", inputs: [execIn], outputs: [thenOut, pin("value", "Value", "output", "data", "Int")], properties: { name: "Counter" }, icon: "+1" },
  { type: "variable.decrement_int", name: "Decrement Int", category: "Variable Nodes", description: "Subtracts one from an integer variable.", mode: "impure", inputs: [execIn], outputs: [thenOut, pin("value", "Value", "output", "data", "Int")], properties: { name: "Counter" }, icon: "-1" },
  { type: "variable.watch", name: "Watch Variable", category: "Variable Nodes", description: "Shows a live debug value.", mode: "debug", inputs: [pin("value", "Value", "input", "data", "Any")], outputs: [], icon: "WV" },

  { type: "math.add", name: "Add Float", category: "Math Nodes", description: "Adds two floats.", mode: "pure", runtime: true, inputs: [pin("a", "A", "input", "data", "Float", false, false, 0), pin("b", "B", "input", "data", "Float", false, false, 0)], outputs: [pin("result", "Result", "output", "data", "Float")], keywords: ["plus"], icon: "+" },
  { type: "math.subtract", name: "Subtract Float", category: "Math Nodes", description: "Subtracts B from A.", mode: "pure", runtime: true, inputs: [pin("a", "A", "input", "data", "Float"), pin("b", "B", "input", "data", "Float")], outputs: [pin("result", "Result", "output", "data", "Float")], icon: "-" },
  { type: "math.multiply", name: "Multiply Float", category: "Math Nodes", description: "Multiplies two floats.", mode: "pure", runtime: true, inputs: [pin("a", "A", "input", "data", "Float"), pin("b", "B", "input", "data", "Float")], outputs: [pin("result", "Result", "output", "data", "Float")], icon: "*" },
  { type: "math.divide", name: "Divide Float", category: "Math Nodes", description: "Divides A by B.", mode: "pure", runtime: true, inputs: [pin("a", "A", "input", "data", "Float"), pin("b", "B", "input", "data", "Float")], outputs: [pin("result", "Result", "output", "data", "Float")], icon: "/" },
  { type: "math.less_equal", name: "Less Or Equal Float", category: "Math Nodes", description: "Returns true when A is <= B.", mode: "pure", runtime: true, inputs: [pin("a", "A", "input", "data", "Float"), pin("b", "B", "input", "data", "Float", false, false, 250)], outputs: [pin("result", "Result", "output", "data", "Bool")], properties: { b: 250 }, icon: "<=" },
  { type: "math.greater_than", name: "Greater Than Float", category: "Math Nodes", description: "Returns true when A is > B.", mode: "pure", runtime: true, inputs: [pin("a", "A", "input", "data", "Float"), pin("b", "B", "input", "data", "Float")], outputs: [pin("result", "Result", "output", "data", "Bool")], icon: ">" },
  { type: "math.equal_bool", name: "Equal Bool", category: "Math Nodes", description: "Compares booleans.", mode: "pure", runtime: true, inputs: [pin("a", "A", "input", "data", "Bool"), pin("b", "B", "input", "data", "Bool")], outputs: [pin("result", "Result", "output", "data", "Bool")], icon: "==" },
  ...simplePureMath(["Modulo", "Power", "Square Root", "Abs", "Min", "Max", "Clamp", "Round", "Floor", "Ceil", "Random Float", "Random Int", "Map Range", "Lerp Float"]),

  { type: "transform.make_vector3", name: "Make Vector3", category: "Vector/Transform Nodes", description: "Builds a Vector3.", mode: "pure", inputs: [pin("x", "X", "input", "data", "Float"), pin("y", "Y", "input", "data", "Float"), pin("z", "Z", "input", "data", "Float")], outputs: [pin("vector", "Vector", "output", "data", "Vector3")], icon: "V3" },
  { type: "transform.break_vector3", name: "Break Vector3", category: "Vector/Transform Nodes", description: "Splits a Vector3.", mode: "pure", inputs: [pin("vector", "Vector", "input", "data", "Vector3")], outputs: [pin("x", "X", "output", "data", "Float"), pin("y", "Y", "output", "data", "Float"), pin("z", "Z", "output", "data", "Float")], icon: "BV" },
  { type: "transform.get_location", name: "Get Location", category: "Vector/Transform Nodes", description: "Reads an entity location.", mode: "pure", runtime: true, inputs: [pin("entity", "Entity", "input", "data", "EntityRef")], outputs: [pin("location", "Location", "output", "data", "Vector3")], icon: "GL" },
  { type: "transform.set_location", name: "Set Location", category: "Vector/Transform Nodes", description: "Sets entity location.", mode: "impure", runtime: true, inputs: [execIn, pin("entity", "Entity", "input", "data", "EntityRef"), pin("location", "Location", "input", "data", "Vector3")], outputs: [thenOut], icon: "SL" },
  { type: "transform.add_location_offset", name: "Add Location Offset", category: "Vector/Transform Nodes", description: "Moves an entity by an offset.", mode: "impure", runtime: true, inputs: [execIn, pin("entity", "Entity", "input", "data", "EntityRef"), pin("offset", "Offset", "input", "data", "Vector3")], outputs: [thenOut], icon: "AO" },
  { type: "transform.distance_between", name: "Distance Between", category: "Vector/Transform Nodes", description: "Returns distance between two entities or vectors.", mode: "pure", runtime: true, inputs: [pin("a", "A", "input", "data", "EntityRef"), pin("b", "B", "input", "data", "EntityRef")], outputs: [pin("distance", "Distance", "output", "data", "Float")], icon: "DB" },
  ...simpleVectorNodes(["Vector Add", "Vector Subtract", "Vector Multiply", "Vector Length", "Normalize Vector", "Dot Product", "Cross Product", "Lerp Vector", "Make Transform", "Break Transform", "Get Rotation", "Set Rotation", "Get Scale", "Set Scale", "Look At", "Forward Vector", "Right Vector", "Up Vector"]),

  { type: "entity.self", name: "Get Self", category: "Entity/Actor Nodes", description: "Returns the current entity.", mode: "pure", runtime: true, outputs: [pin("entity", "Entity", "output", "data", "EntityRef")], keywords: ["actor"], icon: "ME" },
  { type: "entity.spawn", name: "Spawn Entity", category: "Entity/Actor Nodes", description: "Queues a safe engine command to spawn an entity.", mode: "impure", runtime: true, inputs: [execIn, pin("prefab", "Prefab", "input", "data", "AssetRef", false)], outputs: [thenOut, pin("entity", "Entity", "output", "data", "EntityRef")], properties: { prefab: "Enemy" }, icon: "SP" },
  { type: "entity.destroy", name: "Destroy Entity", category: "Entity/Actor Nodes", description: "Queues a command to destroy an entity.", mode: "impure", runtime: true, inputs: [execIn, pin("entity", "Entity", "input", "data", "EntityRef", true)], outputs: [thenOut], icon: "DX" },
  { type: "entity.find_by_name", name: "Find Entity By Name", category: "Entity/Actor Nodes", description: "Finds an entity by name.", mode: "pure", runtime: true, inputs: [pin("name", "Name", "input", "data", "String")], outputs: [pin("entity", "Entity", "output", "data", "EntityRef")], icon: "FN" },
  { type: "entity.find_by_tag", name: "Find Entity By Tag", category: "Entity/Actor Nodes", description: "Finds an entity by tag.", mode: "pure", runtime: true, inputs: [pin("tag", "Tag", "input", "data", "String")], outputs: [pin("entity", "Entity", "output", "data", "EntityRef")], icon: "FT" },
  ...simpleImpureEntity(["Enable Entity", "Disable Entity", "Attach Entity", "Detach Entity", "Get Parent", "Get Children", "Add Component", "Remove Component", "Has Component", "Set Entity Tag", "Compare Entity", "Is Valid Entity"]),

  ...simpleComponentNodes(["Get Transform Component", "Get Mesh Component", "Get Camera Component", "Get Light Component", "Get Physics Body", "Get Collider", "Get Audio Source", "Set Mesh", "Set Material", "Set Visibility", "Set Active", "Enable Component", "Disable Component"]),
  ...simpleInputNodes(["Get Axis Value", "Get Action Value", "Is Key Down", "Is Mouse Button Down", "Get Mouse Position", "Get Mouse Delta", "Get Gamepad Axis", "Get Gamepad Button", "Set Input Enabled", "Consume Input"]),
  { type: "physics.add_force", name: "Add Force", category: "Physics Nodes", description: "Queues a physics force command.", mode: "impure", runtime: true, inputs: [execIn, pin("entity", "Entity", "input", "data", "EntityRef"), pin("force", "Force", "input", "data", "Vector3")], outputs: [thenOut], icon: "AF" },
  { type: "physics.set_velocity", name: "Set Velocity", category: "Physics Nodes", description: "Queues a velocity command.", mode: "impure", runtime: true, inputs: [execIn, pin("entity", "Entity", "input", "data", "EntityRef"), pin("velocity", "Velocity", "input", "data", "Vector3")], outputs: [thenOut], icon: "SV" },
  { type: "physics.raycast", name: "Raycast", category: "Physics Nodes", description: "Casts a ray through the physics world.", mode: "impure", runtime: true, inputs: [execIn, pin("origin", "Origin", "input", "data", "Vector3"), pin("direction", "Direction", "input", "data", "Vector3")], outputs: [thenOut, pin("hit", "Hit", "output", "data", "Bool")], keywords: ["trace"], icon: "RC" },
  ...simplePhysicsNodes(["Add Impulse", "Add Torque", "Get Velocity", "Set Gravity Enabled", "Set Mass", "Set Drag", "Sphere Cast", "Box Cast", "Line Trace", "Get Hit Location", "Get Hit Normal", "Get Hit Entity", "Set Collider Enabled", "Wake Rigid Body", "Sleep Rigid Body"]),
  ...simpleCharacterNodes(["Move Forward", "Move Right", "Jump", "Crouch", "Sprint", "Set Walk Speed", "Set Sprint Speed", "Set Jump Force", "Is Grounded", "Get Character Velocity", "Move To Location", "Stop Movement"]),
  ...simpleCameraNodes(["Get Active Camera", "Set Active Camera", "Set Camera FOV", "Shake Camera", "Camera Fade In", "Camera Fade Out", "Set Camera Target", "Follow Entity", "Orbit Around Entity", "Screen To World Ray", "World To Screen Position"]),
  ...simpleUiNodes(["Create Widget", "Add Widget To Viewport", "Remove Widget", "Set Text", "Set Image", "Set Progress Bar", "Set Visibility", "Set UI Position", "Set UI Scale", "Animate UI Opacity", "Bind Button Click", "Show Cursor", "Hide Cursor"]),
  { type: "audio.play_sound", name: "Play Sound 2D", category: "Audio Nodes", description: "Queues a 2D sound command.", mode: "impure", runtime: true, inputs: [execIn, pin("sound", "Sound", "input", "data", "AudioRef")], outputs: [thenOut], properties: { sound: "door_open" }, icon: "S2" },
  { type: "audio.play_sound_at_location", name: "Play Sound At Location", category: "Audio Nodes", description: "Queues a positioned sound command.", mode: "impure", runtime: true, inputs: [execIn, pin("sound", "Sound", "input", "data", "AudioRef"), pin("location", "Location", "input", "data", "Vector3")], outputs: [thenOut], icon: "SL" },
  ...simpleAudioNodes(["Play Music", "Stop Music", "Pause Music", "Resume Music", "Set Volume", "Set Pitch", "Fade Audio In", "Fade Audio Out", "Attach Sound To Entity", "Stop Sound", "Is Sound Playing"]),
  ...simpleAnimationNodes(["Play Animation", "Stop Animation", "Pause Animation", "Blend Animation", "Set Animation Speed", "Set Animation Parameter Bool", "Set Animation Parameter Float", "Set Animation Parameter Trigger", "Get Current Animation", "Is Animation Playing", "On Animation Finished"]),
  { type: "ai.line_of_sight", name: "AI Has Line Of Sight", category: "AI Nodes", description: "Checks whether AI can see a target.", mode: "pure", inputs: [pin("target", "Target", "input", "data", "EntityRef")], outputs: [pin("visible", "Visible", "output", "data", "Bool")], icon: "LOS" },
  { type: "ai.chase_target", name: "AI Chase Target", category: "AI Nodes", description: "Starts chase movement toward a target.", mode: "impure", inputs: [execIn, pin("target", "Target", "input", "data", "EntityRef")], outputs: [thenOut], icon: "CH" },
  { type: "ai.patrol_path", name: "AI Patrol Path", category: "AI Nodes", description: "Moves AI along a patrol path.", mode: "impure", inputs: [execIn], outputs: [thenOut], icon: "PT" },
  ...simpleAiNodes(["AI Move To", "AI Stop", "AI Look At", "AI Flee From Target", "AI Find Nearest Entity With Tag", "AI Set Blackboard Value", "AI Get Blackboard Value", "AI Run Behavior", "AI Stop Behavior", "AI Random Wander", "AI Attack Target"]),
  { type: "gameplay.open_door", name: "Open Door", category: "Gameplay Nodes", description: "Queues an Open Door gameplay command.", mode: "impure", inputs: [execIn, pin("door", "Door", "input", "data", "EntityRef")], outputs: [thenOut], icon: "OD" },
  { type: "gameplay.add_item", name: "Add Item", category: "Gameplay Nodes", description: "Adds an item to inventory.", mode: "impure", inputs: [execIn, pin("item", "Item", "input", "data", "String", false, false, "Pickup")], outputs: [thenOut], properties: { item: "Pickup" }, icon: "AI" },
  ...simpleGameplayNodes(["Apply Damage", "Heal", "Kill Actor", "Get Health", "Set Health", "Add Score", "Set Score", "Remove Item", "Has Item", "Give Weapon", "Equip Weapon", "Fire Weapon", "Reload Weapon", "Start Quest", "Complete Quest", "Unlock Door", "Lock Door", "Close Door", "Trigger Checkpoint", "Respawn Player"]),
  { type: "scene.load", name: "Load Scene", category: "Scene/Level Nodes", description: "Queues a scene load command.", mode: "latent", runtime: true, inputs: [execIn, pin("scene", "Scene", "input", "data", "SceneRef")], outputs: [thenOut], icon: "LS" },
  { type: "scene.reload", name: "Reload Scene", category: "Scene/Level Nodes", description: "Queues a scene reload command.", mode: "latent", runtime: true, inputs: [execIn], outputs: [thenOut], icon: "RS" },
  ...simpleSceneNodes(["Unload Scene", "Get Current Scene", "Set Time Scale", "Pause Game", "Resume Game", "Quit Game", "Spawn Prefab", "Set Skybox", "Set Fog", "Set Environment Lighting", "Get Level Bounds"]),
  ...simpleAssetNodes(["Load Asset", "Async Load Asset", "Is Asset Loaded", "Get Asset By Path", "Preload Asset", "Unload Asset", "Set Texture", "Set Material Parameter", "Set Mesh Asset", "Play Loaded Audio Asset"]),
  ...simpleSaveNodes(["Save Game", "Load Game", "Delete Save", "Does Save Exist", "Set Save Value", "Get Save Value", "Save Player Position", "Load Player Position", "Save Inventory", "Load Inventory"]),
  ...simpleNetworkNodes(["Is Server", "Is Client", "Is Host", "Send Network Event", "Broadcast Network Event", "RPC To Server", "RPC To Client", "Spawn Network Entity", "Despawn Network Entity", "Set Replicated Variable", "Get Replicated Variable", "On Player Joined", "On Player Left", "Get Local Player"]),
  { type: "debug.print_string", name: "Print String", category: "Debug Nodes", description: "Writes a line to the Blueprint console.", mode: "debug", runtime: true, inputs: [execIn, pin("message", "Message", "input", "data", "String", false, false, "Hello Forge")], outputs: [thenOut], properties: { message: "Hello Forge" }, keywords: ["log"], icon: "PS" },
  { type: "debug.print_warning", name: "Print Warning", category: "Debug Nodes", description: "Writes a warning to the Blueprint console.", mode: "debug", runtime: true, inputs: [execIn, pin("message", "Message", "input", "data", "String", false, false, "Warning")], outputs: [thenOut], icon: "PW" },
  { type: "debug.breakpoint", name: "Breakpoint", category: "Debug Nodes", description: "Pauses execution in debug mode.", mode: "debug", runtime: true, inputs: [execIn], outputs: [thenOut], icon: "BP" },
  { type: "debug.watch_value", name: "Watch Value", category: "Debug Nodes", description: "Shows a live pin value.", mode: "debug", runtime: true, inputs: [pin("value", "Value", "input", "data", "Any")], outputs: [], icon: "WV" },
  ...simpleDebugNodes(["Print Error", "Draw Debug Line", "Draw Debug Sphere", "Draw Debug Box", "Draw Debug Text", "Log Entity Info", "Measure Execution Time", "Assert", "Is Debug Mode"]),
  ...simpleCustomNodes(["Custom Function Node", "Custom Event Node", "Macro Node", "Collapsed Graph Node", "Comment Box", "Reroute Node", "Variable Getter", "Variable Setter", "Enum Switch Node", "Struct Make Node", "Struct Break Node", "Plugin Node", "Native Rust Node Wrapper"])
];

export const nodeRegistry: BlueprintNodeDefinition[] = specs.map(node);

export const graphTypes = [
  "Actor Blueprint",
  "Component Blueprint",
  "Level Blueprint",
  "UI Blueprint",
  "AI Blueprint",
  "Animation Blueprint",
  "Material/Shader Blueprint",
  "Global System Blueprint"
] as const;

export function findNodeDefinition(type: string) {
  return nodeRegistry.find((definition) => definition.type === type);
}

export function createNodeFromDefinition(definition: BlueprintNodeDefinition, x: number, y: number): BlueprintNode {
  return {
    id: crypto.randomUUID(),
    type: definition.type,
    title: definition.displayName,
    category: definition.category,
    position: { x, y },
    inputs: definition.inputs.map((input) => ({ ...input })),
    outputs: definition.outputs.map((output) => ({ ...output })),
    properties: { ...definition.properties },
    executionMode: definition.executionMode,
    breakpointEnabled: false,
    comment: "",
    disabled: false,
    metadata: { runtimeSupported: definition.runtimeSupported, description: definition.description, color: definition.color }
  };
}

function idFromName(prefix: string, name: string) {
  return `${prefix}.${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;
}

function simplePureMath(names: string[]): NodeSpec[] {
  return names.map((name) => ({ type: idFromName("math", name), name, category: "Math Nodes", description: `${name} math operation.`, mode: "pure", inputs: [pin("a", "A", "input", "data", "Float"), pin("b", "B", "input", "data", "Float")], outputs: [pin("result", "Result", "output", "data", name.includes("Random") ? "Float" : "Float")], icon: name.slice(0, 2).toUpperCase() }));
}

function simpleVectorNodes(names: string[]): NodeSpec[] {
  return names.map((name) => ({ type: idFromName("transform", name), name, category: "Vector/Transform Nodes", description: `${name} transform operation.`, mode: name.startsWith("Set") || name.startsWith("Add") ? "impure" : "pure", inputs: name.startsWith("Set") || name.startsWith("Add") ? [execIn, pin("entity", "Entity", "input", "data", "EntityRef")] : [pin("value", "Value", "input", "data", "Vector3")], outputs: name.startsWith("Set") || name.startsWith("Add") ? [thenOut] : [pin("result", "Result", "output", "data", "Vector3")], icon: "VT" }));
}

function simpleImpureEntity(names: string[]): NodeSpec[] {
  return names.map((name) => ({ type: idFromName("entity", name), name, category: "Entity/Actor Nodes", description: `${name} entity operation.`, mode: name.startsWith("Get") || name.startsWith("Has") || name.startsWith("Is") || name.startsWith("Compare") ? "pure" : "impure", inputs: [pin("entity", "Entity", "input", "data", "EntityRef")], outputs: name.startsWith("Get") || name.startsWith("Has") || name.startsWith("Is") || name.startsWith("Compare") ? [pin("result", "Result", "output", "data", name.startsWith("Has") || name.startsWith("Is") || name.startsWith("Compare") ? "Bool" : "Any")] : [thenOut], icon: "EN" }));
}

function simpleComponentNodes(names: string[]): NodeSpec[] {
  return names.map((name) => ({ type: idFromName("component", name), name, category: "Component Nodes", description: `${name} component operation.`, mode: name.startsWith("Get") ? "pure" : "impure", inputs: name.startsWith("Get") ? [pin("entity", "Entity", "input", "data", "EntityRef")] : [execIn, pin("component", "Component", "input", "data", "ComponentRef")], outputs: name.startsWith("Get") ? [pin("component", "Component", "output", "data", "ComponentRef")] : [thenOut], icon: "CP" }));
}

function simpleInputNodes(names: string[]): NodeSpec[] {
  return names.map((name) => ({ type: idFromName("input", name), name, category: "Input Nodes", description: `${name} input query.`, mode: name.startsWith("Set") || name.startsWith("Consume") ? "impure" : "pure", inputs: [pin("name", "Name", "input", "data", "String")], outputs: name.startsWith("Set") || name.startsWith("Consume") ? [thenOut] : [pin("value", "Value", "output", "data", name.includes("Position") || name.includes("Delta") ? "Vector2" : name.includes("Down") || name.includes("Button") ? "Bool" : "Float")], icon: "IN" }));
}

function simplePhysicsNodes(names: string[]): NodeSpec[] {
  return names.map((name) => ({ type: idFromName("physics", name), name, category: "Physics Nodes", description: `${name} physics command.`, mode: name.startsWith("Get") ? "pure" : "impure", inputs: [execIn, pin("entity", "Entity", "input", "data", "EntityRef")], outputs: name.startsWith("Get") ? [pin("value", "Value", "output", "data", "Any")] : [thenOut], icon: "PH" }));
}

function simpleCharacterNodes(names: string[]): NodeSpec[] {
  return names.map((name) => ({ type: idFromName("character", name), name, category: "Character Movement Nodes", description: `${name} character movement operation.`, mode: name.startsWith("Is") || name.startsWith("Get") ? "pure" : "impure", inputs: [execIn, pin("entity", "Entity", "input", "data", "EntityRef")], outputs: name.startsWith("Is") || name.startsWith("Get") ? [pin("value", "Value", "output", "data", name.startsWith("Is") ? "Bool" : "Vector3")] : [thenOut], icon: "CH" }));
}

function simpleCameraNodes(names: string[]): NodeSpec[] {
  return names.map((name) => ({ type: idFromName("camera", name), name, category: "Camera Nodes", description: `${name} camera operation.`, mode: name.startsWith("Get") || name.includes("To") ? "pure" : "impure", inputs: name.startsWith("Get") ? [] : [execIn], outputs: name.startsWith("Get") || name.includes("To") ? [pin("value", "Value", "output", "data", "Any")] : [thenOut], icon: "CA" }));
}

function simpleUiNodes(names: string[]): NodeSpec[] {
  return names.map((name) => ({ type: idFromName("ui", name), name, category: "UI Nodes", description: `${name} UI command.`, mode: "impure", inputs: [execIn], outputs: [thenOut], icon: "UI" }));
}

function simpleAudioNodes(names: string[]): NodeSpec[] {
  return names.map((name) => ({ type: idFromName("audio", name), name, category: "Audio Nodes", description: `${name} audio command.`, mode: name.startsWith("Is") ? "pure" : "impure", inputs: name.startsWith("Is") ? [pin("sound", "Sound", "input", "data", "AudioRef")] : [execIn, pin("sound", "Sound", "input", "data", "AudioRef")], outputs: name.startsWith("Is") ? [pin("playing", "Playing", "output", "data", "Bool")] : [thenOut], icon: "AU" }));
}

function simpleAnimationNodes(names: string[]): NodeSpec[] {
  return names.map((name) => ({ type: idFromName("animation", name), name, category: "Animation Nodes", description: `${name} animation operation.`, mode: name.startsWith("Get") || name.startsWith("Is") || name.startsWith("On") ? "pure" : "impure", inputs: [pin("entity", "Entity", "input", "data", "EntityRef")], outputs: name.startsWith("Get") || name.startsWith("Is") || name.startsWith("On") ? [pin("value", "Value", "output", "data", name.startsWith("Is") ? "Bool" : "Any")] : [thenOut], icon: "AN" }));
}

function simpleAiNodes(names: string[]): NodeSpec[] {
  return names.map((name) => ({ type: idFromName("ai", name), name, category: "AI Nodes", description: `${name} AI operation.`, mode: name.startsWith("AI Find") || name.includes("Get") ? "pure" : "impure", inputs: [execIn, pin("target", "Target", "input", "data", "EntityRef", false)], outputs: name.startsWith("AI Find") || name.includes("Get") ? [pin("value", "Value", "output", "data", "Any")] : [thenOut], icon: "AI" }));
}

function simpleGameplayNodes(names: string[]): NodeSpec[] {
  return names.map((name) => ({ type: idFromName("gameplay", name), name, category: "Gameplay Nodes", description: `${name} gameplay operation.`, mode: name.startsWith("Get") || name.startsWith("Has") ? "pure" : "impure", inputs: name.startsWith("Get") || name.startsWith("Has") ? [] : [execIn], outputs: name.startsWith("Get") || name.startsWith("Has") ? [pin("value", "Value", "output", "data", name.startsWith("Has") ? "Bool" : "Any")] : [thenOut], icon: "GP" }));
}

function simpleSceneNodes(names: string[]): NodeSpec[] {
  return names.map((name) => ({ type: idFromName("scene", name), name, category: "Scene/Level Nodes", description: `${name} scene operation.`, mode: name.startsWith("Get") ? "pure" : "latent", inputs: name.startsWith("Get") ? [] : [execIn], outputs: name.startsWith("Get") ? [pin("value", "Value", "output", "data", "Any")] : [thenOut], icon: "SC" }));
}

function simpleAssetNodes(names: string[]): NodeSpec[] {
  return names.map((name) => ({ type: idFromName("asset", name), name, category: "Asset Nodes", description: `${name} asset operation.`, mode: name.startsWith("Is") || name.startsWith("Get") ? "pure" : "latent", inputs: [pin("asset", "Asset", "input", "data", "AssetRef", false)], outputs: name.startsWith("Is") ? [pin("loaded", "Loaded", "output", "data", "Bool")] : [pin("asset", "Asset", "output", "data", "AssetRef")], icon: "AS" }));
}

function simpleSaveNodes(names: string[]): NodeSpec[] {
  return names.map((name) => ({ type: idFromName("save", name), name, category: "Save/Load Nodes", description: `${name} save operation.`, mode: name.startsWith("Does") || name.startsWith("Get") ? "pure" : "latent", inputs: [pin("slot", "Slot", "input", "data", "String", false, false, "Save01")], outputs: name.startsWith("Does") || name.startsWith("Get") ? [pin("value", "Value", "output", "data", "Any")] : [thenOut], icon: "SV" }));
}

function simpleNetworkNodes(names: string[]): NodeSpec[] {
  return names.map((name) => ({ type: idFromName("network", name), name, category: "Networking Nodes", description: `${name} networking operation.`, mode: name.startsWith("Is") || name.startsWith("Get") || name.startsWith("On") ? "pure" : "impure", inputs: name.startsWith("Is") || name.startsWith("Get") || name.startsWith("On") ? [] : [execIn], outputs: name.startsWith("Is") ? [pin("value", "Value", "output", "data", "Bool")] : name.startsWith("Get") ? [pin("value", "Value", "output", "data", "Any")] : [thenOut], icon: "NW" }));
}

function simpleDebugNodes(names: string[]): NodeSpec[] {
  return names.map((name) => ({ type: idFromName("debug", name), name, category: "Debug Nodes", description: `${name} debug operation.`, mode: "debug", inputs: [execIn], outputs: [thenOut], icon: "DB" }));
}

function simpleCustomNodes(names: string[]): NodeSpec[] {
  return names.map((name) => ({ type: idFromName("custom", name), name, category: "Custom/User Nodes", description: `${name} custom graph feature.`, mode: name.includes("Function") ? "function" : name.includes("Macro") ? "macro" : "debug", inputs: name.includes("Comment") || name.includes("Reroute") ? [] : [execIn], outputs: name.includes("Comment") ? [] : [thenOut], properties: { name }, icon: "CU" }));
}
