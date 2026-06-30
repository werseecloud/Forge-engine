import { createNodeFromDefinition, findNodeDefinition } from "./nodeRegistry";
import type { BlueprintGraph, BlueprintNode } from "../types/blueprint-types";

interface ExampleNode {
  type: string;
  x: number;
  y: number;
  properties?: Record<string, unknown>;
}

interface ExampleSpec {
  name: string;
  graphType: string;
  nodes: ExampleNode[];
  edges: Array<[number, string, number, string]>;
}

const examples: ExampleSpec[] = [
  {
    name: "Door Open Example",
    graphType: "Actor Blueprint",
    nodes: [
      { type: "event.key_pressed", x: 80, y: 110, properties: { key: "E" } },
      { type: "flow.branch", x: 390, y: 110, properties: { condition: true } },
      { type: "gameplay.open_door", x: 710, y: 80 },
      { type: "audio.play_sound", x: 1020, y: 80 }
    ],
    edges: [[0, "then", 1, "exec"], [1, "then", 2, "exec"], [2, "then", 3, "exec"]]
  },
  {
    name: "Pickup Example",
    graphType: "Actor Blueprint",
    nodes: [
      { type: "event.trigger_enter", x: 80, y: 100 },
      { type: "flow.branch", x: 380, y: 100, properties: { condition: true } },
      { type: "gameplay.add_item", x: 700, y: 80, properties: { item: "Health Potion" } },
      { type: "entity.destroy", x: 1010, y: 80 },
      { type: "audio.play_sound", x: 1320, y: 80 }
    ],
    edges: [[0, "then", 1, "exec"], [1, "then", 2, "exec"], [2, "then", 3, "exec"], [3, "then", 4, "exec"]]
  },
  {
    name: "Enemy Chase Example",
    graphType: "AI Blueprint",
    nodes: [
      { type: "event.tick", x: 80, y: 140 },
      { type: "ai.line_of_sight", x: 370, y: 40 },
      { type: "flow.branch", x: 680, y: 140, properties: { condition: true } },
      { type: "ai.chase_target", x: 1000, y: 80 },
      { type: "ai.patrol_path", x: 1000, y: 230 }
    ],
    edges: [[0, "then", 2, "exec"], [2, "then", 3, "exec"], [2, "else", 4, "exec"]]
  },
  {
    name: "Health Example",
    graphType: "Actor Blueprint",
    nodes: [
      { type: "event.damage_taken", x: 80, y: 130 },
      { type: "gameplay.get_health", x: 360, y: 20 },
      { type: "math.subtract", x: 640, y: 20 },
      { type: "gameplay.set_health", x: 640, y: 130 },
      { type: "math.compare", x: 940, y: 20 },
      { type: "flow.branch", x: 940, y: 130, properties: { condition: false } },
      { type: "gameplay.on_death", x: 1260, y: 130 }
    ],
    edges: [[0, "then", 3, "exec"], [3, "then", 5, "exec"], [5, "then", 6, "exec"]]
  },
  {
    name: "UI Health Bar Example",
    graphType: "UI Blueprint",
    nodes: [
      { type: "event.damage_taken", x: 80, y: 120 },
      { type: "gameplay.get_health", x: 390, y: 20 },
      { type: "math.compare", x: 680, y: 20 },
      { type: "ui.set_progress", x: 680, y: 120 }
    ],
    edges: [[0, "then", 3, "exec"]]
  },
  {
    name: "Spawn Timer Example",
    graphType: "Level Blueprint",
    nodes: [
      { type: "event.begin_play", x: 80, y: 120 },
      { type: "flow.timer", x: 390, y: 120, properties: { seconds: 5, looping: true } },
      { type: "entity.spawn", x: 710, y: 120, properties: { prefab: "Enemy" } }
    ],
    edges: [[0, "then", 1, "exec"], [1, "then", 2, "exec"]]
  },
  {
    name: "Scene Transition Example",
    graphType: "Level Blueprint",
    nodes: [
      { type: "event.trigger_enter", x: 80, y: 120 },
      { type: "camera.fade_out", x: 390, y: 120, properties: { seconds: 1 } },
      { type: "flow.delay", x: 710, y: 120, properties: { seconds: 1 } },
      { type: "scene.load", x: 1030, y: 120, properties: { scene: "NextScene" } }
    ],
    edges: [[0, "then", 1, "exec"], [1, "then", 2, "exec"], [2, "then", 3, "exec"]]
  }
];

export function createExampleGraphs(): BlueprintGraph[] {
  return examples.map(createExampleGraph);
}

function createExampleGraph(spec: ExampleSpec): BlueprintGraph {
  const now = new Date().toISOString();
  const nodes = spec.nodes.map((item) => {
    const definition = findNodeDefinition(item.type);
    if (!definition) throw new Error(`Missing example node definition: ${item.type}`);
    const node = createNodeFromDefinition(definition, item.x, item.y);
    return { ...node, properties: { ...node.properties, ...item.properties } };
  });

  return {
    graphId: crypto.randomUUID(),
    name: spec.name,
    graphType: spec.graphType,
    nodes,
    edges: spec.edges.map(([fromIndex, fromPinId, toIndex, toPinId]) => edge(nodes[fromIndex], fromPinId, nodes[toIndex], toPinId)),
    variables: [],
    exposedInputs: [],
    exposedOutputs: [],
    metadata: { example: true },
    version: 1,
    createdAt: now,
    updatedAt: now
  };
}

function edge(from: BlueprintNode, fromPinId: string, to: BlueprintNode, toPinId: string) {
  const fromPin = from.outputs.find((pin) => pin.id === fromPinId);
  return {
    id: crypto.randomUUID(),
    fromNodeId: from.id,
    fromPinId,
    toNodeId: to.id,
    toPinId,
    edgeType: fromPin?.pinKind ?? "execution",
    dataType: fromPin?.dataType ?? "Exec",
    metadata: {}
  };
}
