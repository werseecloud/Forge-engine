import { commands } from "../../../lib/tauri";
import { nodeRegistry } from "../data/nodeRegistry";
import type { BlueprintCompileResult, BlueprintGraph, BlueprintGraphSummary, BlueprintRunResult } from "../types/blueprint-types";

export interface BlueprintEngineApi {
  listBlueprints(projectRoot: string): Promise<BlueprintGraphSummary[]>;
  compileBlueprint(graphJson: BlueprintGraph): Promise<BlueprintCompileResult>;
  saveBlueprint(projectRoot: string, graphJson: BlueprintGraph): Promise<BlueprintGraph>;
  loadBlueprint(projectRoot: string, graphIdOrPath: string): Promise<BlueprintGraph>;
  runBlueprintPreview(graphJson: BlueprintGraph): Promise<BlueprintRunResult>;
  stopBlueprintPreview(graphId: string): Promise<void>;
  sendBlueprintEvent(graphId: string, event: Record<string, unknown>): Promise<BlueprintRunResult>;
  getBlueprintDebugTrace(graphId: string): Promise<BlueprintRunResult | null>;
  getNodeRegistry(): Promise<typeof nodeRegistry>;
}

export const blueprintEngineApi: BlueprintEngineApi = {
  listBlueprints: (projectRoot) => commands.listBlueprintGraphs(projectRoot),
  compileBlueprint: (graphJson) => commands.compileBlueprintGraph(graphJson),
  saveBlueprint: (projectRoot, graphJson) => commands.saveBlueprintGraph(projectRoot, graphJson),
  loadBlueprint: (projectRoot, graphIdOrPath) => commands.readBlueprintGraph(projectRoot, graphIdOrPath),
  runBlueprintPreview: (graphJson) => commands.runBlueprintPreview(graphJson),
  stopBlueprintPreview: async () => undefined,
  sendBlueprintEvent: (_graphId, event) => commands.runBlueprintPreview({
    graphId: String(event.graphId ?? crypto.randomUUID()),
    name: String(event.graphName ?? "Event Preview"),
    graphType: "Actor Blueprint",
    nodes: [],
    edges: [],
    variables: [],
    exposedInputs: [],
    exposedOutputs: [],
    metadata: { event },
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }),
  getBlueprintDebugTrace: async () => null,
  getNodeRegistry: async () => nodeRegistry
};
