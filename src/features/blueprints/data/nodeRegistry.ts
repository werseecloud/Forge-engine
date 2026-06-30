import type { BlueprintDataType, BlueprintNode, BlueprintNodeDefinition, BlueprintPin } from "../types/blueprint-types";

const execIn = pin("exec", "Exec", "input", "execution", "Exec", true);
const thenOut = pin("then", "Then", "output", "execution", "Exec", false, true);

function pin(id: string, name: string, direction: "input" | "output", pinKind: "execution" | "data", dataType: BlueprintDataType, required = false, multipleConnectionsAllowed = false, defaultValue?: unknown): BlueprintPin {
  return { id, name, direction, pinKind, dataType, required, multipleConnectionsAllowed, defaultValue };
}

function node(type: string, displayName: string, category: string, description: string, executionMode: BlueprintNode["executionMode"], runtimeSupported: boolean, inputs: BlueprintPin[], outputs: BlueprintPin[], properties: Record<string, unknown> = {}, keywords: string[] = [], icon = "◇", color = "#2997FF"): BlueprintNodeDefinition {
  return { type, displayName, category, description, inputs, outputs, properties, executionMode, runtimeSupported, icon, color, keywords };
}

export const nodeRegistry: BlueprintNodeDefinition[] = [
  node("event.begin_play", "Event Begin Play", "Event Nodes", "Runs when an actor or level starts.", "event", true, [], [thenOut], {}, ["start", "level", "actor"], "▶", "#30D158"),
  node("event.tick", "Event Tick", "Event Nodes", "Runs every frame with Delta Time.", "event", true, [], [thenOut, pin("deltaTime", "Delta Time", "output", "data", "Float")], {}, ["frame", "update"], "⟳", "#30D158"),
  node("event.key_pressed", "Event On Key Pressed", "Event Nodes", "Runs when a keyboard key is pressed.", "event", false, [], [thenOut, pin("key", "Key", "output", "data", "String")], { key: "E" }, ["input", "keyboard"], "⌨", "#30D158"),
  node("event.trigger_enter", "Event On Trigger Enter", "Event Nodes", "Runs when an entity enters a trigger zone.", "event", false, [], [thenOut, pin("other", "Other", "output", "data", "EntityRef")], {}, ["collision", "trigger"], "◇", "#30D158"),
  node("event.damage_taken", "Event On Damage Taken", "Event Nodes", "Runs when an actor receives damage.", "event", false, [], [thenOut, pin("damage", "Damage", "output", "data", "Float")], {}, ["health"], "✚", "#30D158"),
  node("event.custom", "Custom Event", "Event Nodes", "User-defined event entry point.", "event", false, [], [thenOut], { eventName: "CustomEvent" }, ["event"], "★", "#30D158"),

  node("flow.branch", "Branch", "Flow Control Nodes", "Routes execution based on a boolean condition.", "impure", true, [execIn, pin("condition", "Condition", "input", "data", "Bool", true, false, false)], [pin("then", "True", "output", "execution", "Exec", false, true), pin("else", "False", "output", "execution", "Exec", false, true)], { condition: true }, ["if", "else"], "?", "#1E7BFF"),
  node("flow.sequence", "Sequence", "Flow Control Nodes", "Runs multiple execution outputs in order.", "impure", false, [execIn], [pin("then0", "Then 0", "output", "execution", "Exec", false, true), pin("then1", "Then 1", "output", "execution", "Exec", false, true)], {}, ["order"], "≡", "#1E7BFF"),
  node("flow.delay", "Delay", "Flow Control Nodes", "Schedules the next execution after a non-blocking delay.", "latent", true, [execIn, pin("seconds", "Seconds", "input", "data", "Float", false, false, 1)], [thenOut], { seconds: 1 }, ["timer", "wait"], "⏱", "#5E9BFF"),
  node("flow.timer", "Timer", "Flow Control Nodes", "Starts a timer and triggers a callback.", "latent", false, [execIn, pin("seconds", "Seconds", "input", "data", "Float", false, false, 5)], [thenOut], { seconds: 5, looping: true }, ["loop"], "⏲", "#5E9BFF"),

  node("variable.get", "Get Variable", "Variable Nodes", "Reads a graph variable.", "pure", true, [pin("name", "Name", "input", "data", "String", false, false, "Variable")], [pin("value", "Value", "output", "data", "Any")], { name: "Variable" }, ["read"], "↥", "#B78CFF"),
  node("variable.set", "Set Variable", "Variable Nodes", "Writes a graph variable.", "impure", true, [execIn, pin("name", "Name", "input", "data", "String", false, false, "Variable"), pin("value", "Value", "input", "data", "Any", false)], [thenOut], { name: "Variable", value: 0 }, ["write"], "↧", "#B78CFF"),
  node("variable.toggle_bool", "Toggle Bool", "Variable Nodes", "Toggles a boolean variable.", "impure", false, [execIn], [thenOut, pin("value", "Value", "output", "data", "Bool")], { name: "Flag" }, ["bool"], "⇄", "#B78CFF"),

  node("math.add", "Add", "Math Nodes", "Adds two numbers.", "pure", true, [pin("a", "A", "input", "data", "Float", false, false, 0), pin("b", "B", "input", "data", "Float", false, false, 0)], [pin("result", "Result", "output", "data", "Float")], {}, ["plus"], "+", "#FFD60A"),
  node("math.subtract", "Subtract", "Math Nodes", "Subtracts B from A.", "pure", false, [pin("a", "A", "input", "data", "Float"), pin("b", "B", "input", "data", "Float")], [pin("result", "Result", "output", "data", "Float")], {}, ["minus"], "-", "#FFD60A"),
  node("math.compare", "Compare", "Math Nodes", "Compares two values.", "pure", true, [pin("a", "A", "input", "data", "Float", false, false, 0), pin("b", "B", "input", "data", "Float", false, false, 0)], [pin("equal", "Equal", "output", "data", "Bool"), pin("greater", "Greater", "output", "data", "Bool"), pin("less", "Less", "output", "data", "Bool")], {}, ["==", ">", "<"], "=", "#FFD60A"),
  node("math.random_float", "Random Float", "Math Nodes", "Returns a random float in range.", "pure", false, [pin("min", "Min", "input", "data", "Float", false, false, 0), pin("max", "Max", "input", "data", "Float", false, false, 1)], [pin("value", "Value", "output", "data", "Float")], {}, ["random"], "⚂", "#FFD60A"),

  node("transform.set_location", "Set Location", "Vector/Transform Nodes", "Sets entity location.", "impure", false, [execIn, pin("entity", "Entity", "input", "data", "EntityRef"), pin("location", "Location", "input", "data", "Vector3")], [thenOut], {}, ["move"], "↗", "#64D2FF"),
  node("transform.make_vector3", "Make Vector3", "Vector/Transform Nodes", "Builds a Vector3.", "pure", false, [pin("x", "X", "input", "data", "Float"), pin("y", "Y", "input", "data", "Float"), pin("z", "Z", "input", "data", "Float")], [pin("vector", "Vector", "output", "data", "Vector3")], {}, ["vec"], "XYZ", "#64D2FF"),

  node("entity.self", "Get Self", "Entity/Actor Nodes", "Returns the current entity.", "pure", false, [], [pin("entity", "Entity", "output", "data", "EntityRef")], {}, ["actor"], "●", "#64D2FF"),
  node("entity.spawn", "Spawn Entity", "Entity/Actor Nodes", "Queues a safe engine command to spawn an entity.", "impure", true, [execIn, pin("prefab", "Prefab", "input", "data", "AssetRef", false)], [thenOut, pin("entity", "Entity", "output", "data", "EntityRef")], { prefab: "Enemy" }, ["create", "prefab"], "+", "#64D2FF"),
  node("entity.destroy", "Destroy Entity", "Entity/Actor Nodes", "Queues a command to destroy an entity.", "impure", false, [execIn, pin("entity", "Entity", "input", "data", "EntityRef", true)], [thenOut], {}, ["delete"], "×", "#64D2FF"),

  node("physics.raycast", "Raycast", "Physics Nodes", "Casts a ray through the physics world.", "impure", false, [execIn, pin("origin", "Origin", "input", "data", "Vector3"), pin("direction", "Direction", "input", "data", "Vector3")], [thenOut, pin("hit", "Hit", "output", "data", "Bool")], {}, ["trace"], "—", "#FF9F0A"),
  node("ai.chase_target", "AI Chase Target", "AI Nodes", "Starts chase movement toward a target.", "impure", false, [execIn, pin("target", "Target", "input", "data", "EntityRef")], [thenOut], {}, ["enemy"], "◆", "#FF9F0A"),
  node("ai.line_of_sight", "AI Has Line Of Sight", "AI Nodes", "Checks whether AI can see a target.", "pure", false, [pin("target", "Target", "input", "data", "EntityRef")], [pin("visible", "Visible", "output", "data", "Bool")], {}, ["vision"], "◉", "#FF9F0A"),
  node("ai.patrol_path", "AI Patrol Path", "AI Nodes", "Moves AI along a patrol path.", "impure", false, [execIn], [thenOut], {}, ["wander"], "◇", "#FF9F0A"),
  node("ui.set_progress", "Set Progress Bar", "UI Nodes", "Updates a UI progress bar.", "impure", false, [execIn, pin("value", "Value", "input", "data", "Float")], [thenOut], {}, ["health", "hud"], "▰", "#5AC8FA"),
  node("audio.play_sound", "Play Sound 2D", "Audio Nodes", "Plays a 2D sound asset.", "impure", false, [execIn, pin("sound", "Sound", "input", "data", "AudioRef")], [thenOut], {}, ["sfx"], "♪", "#FF6482"),
  node("camera.fade_out", "Camera Fade Out", "Camera Nodes", "Fades the active camera to black.", "latent", false, [execIn, pin("seconds", "Seconds", "input", "data", "Float", false, false, 1)], [thenOut], { seconds: 1 }, ["transition"], "◐", "#5AC8FA"),
  node("gameplay.open_door", "Open Door", "Gameplay Nodes", "Queues an Open Door gameplay command.", "impure", false, [execIn, pin("door", "Door", "input", "data", "EntityRef")], [thenOut], {}, ["door"], "▯", "#30D158"),
  node("gameplay.add_item", "Add Item", "Gameplay Nodes", "Adds an item to inventory.", "impure", false, [execIn, pin("item", "Item", "input", "data", "String", false, false, "Pickup")], [thenOut], { item: "Pickup" }, ["inventory"], "+", "#30D158"),
  node("gameplay.get_health", "Get Health", "Gameplay Nodes", "Reads actor health.", "pure", false, [pin("actor", "Actor", "input", "data", "EntityRef")], [pin("health", "Health", "output", "data", "Float")], {}, ["hp"], "♥", "#30D158"),
  node("gameplay.set_health", "Set Health", "Gameplay Nodes", "Writes actor health.", "impure", false, [execIn, pin("health", "Health", "input", "data", "Float")], [thenOut], {}, ["hp"], "♥", "#30D158"),
  node("gameplay.on_death", "On Death", "Gameplay Nodes", "Triggers death handling.", "impure", false, [execIn], [thenOut], {}, ["kill"], "☠", "#FF453A"),
  node("scene.load", "Load Scene", "Scene/Level Nodes", "Queues a scene load command.", "latent", false, [execIn, pin("scene", "Scene", "input", "data", "SceneRef")], [thenOut], {}, ["level"], "▣", "#2997FF"),
  node("debug.print_string", "Print String", "Debug Nodes", "Writes a line to the Blueprint console.", "debug", true, [execIn, pin("message", "Message", "input", "data", "String", false, false, "Hello Forge")], [thenOut], { message: "Hello Forge" }, ["log"], ">", "#30D158"),
  node("debug.breakpoint", "Breakpoint", "Debug Nodes", "Pauses execution in debug mode.", "debug", false, [execIn], [thenOut], {}, ["debug"], "●", "#FF453A"),
  node("custom.function", "Custom Function Node", "Custom/User Nodes", "Calls a user-authored function graph.", "function", false, [execIn], [thenOut], { functionName: "Function" }, ["user"], "ƒ", "#AF52DE"),
  node("custom.comment", "Comment Box", "Custom/User Nodes", "Groups nodes with an editor comment.", "debug", false, [], [], { text: "Comment" }, ["note"], "#", "#8E8E93")
];

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
    metadata: { runtimeSupported: definition.runtimeSupported, description: definition.description }
  };
}
