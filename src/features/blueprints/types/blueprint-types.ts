export type BlueprintGraphType =
  | "Actor Blueprint"
  | "Component Blueprint"
  | "Level Blueprint"
  | "UI Blueprint"
  | "AI Blueprint"
  | "Animation Blueprint"
  | "Material/Shader Blueprint"
  | "Global System Blueprint";

export type BlueprintPinKind = "execution" | "data";
export type BlueprintPinDirection = "input" | "output";
export type BlueprintDataType =
  | "Exec"
  | "Bool"
  | "Int"
  | "Float"
  | "String"
  | "Vector2"
  | "Vector3"
  | "Quaternion"
  | "Transform"
  | "Color"
  | "EntityRef"
  | "ComponentRef"
  | "AssetRef"
  | "MaterialRef"
  | "TextureRef"
  | "AudioRef"
  | "SceneRef"
  | "Array"
  | "Map"
  | "Enum"
  | "Struct"
  | "Any";

export interface BlueprintPosition {
  x: number;
  y: number;
}

export interface BlueprintPin {
  id: string;
  name: string;
  direction: BlueprintPinDirection;
  pinKind: BlueprintPinKind;
  dataType: BlueprintDataType;
  required: boolean;
  defaultValue?: unknown;
  multipleConnectionsAllowed: boolean;
}

export interface BlueprintNode {
  id: string;
  type: string;
  title: string;
  category: string;
  position: BlueprintPosition;
  inputs: BlueprintPin[];
  outputs: BlueprintPin[];
  properties: Record<string, unknown>;
  executionMode: "event" | "impure" | "pure" | "latent" | "macro" | "function" | "debug";
  breakpointEnabled: boolean;
  comment: string;
  disabled: boolean;
  metadata: Record<string, unknown>;
}

export interface BlueprintEdge {
  id: string;
  fromNodeId: string;
  fromPinId: string;
  toNodeId: string;
  toPinId: string;
  edgeType: BlueprintPinKind;
  dataType: BlueprintDataType;
  metadata: Record<string, unknown>;
}

export interface BlueprintVariable {
  id: string;
  name: string;
  dataType: BlueprintDataType;
  defaultValue: unknown;
  exposed: boolean;
}

export interface BlueprintGraph {
  graphId: string;
  name: string;
  graphType: BlueprintGraphType | string;
  nodes: BlueprintNode[];
  edges: BlueprintEdge[];
  variables: BlueprintVariable[];
  exposedInputs: BlueprintPin[];
  exposedOutputs: BlueprintPin[];
  metadata: Record<string, unknown>;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlueprintGraphSummary {
  graphId: string;
  name: string;
  graphType: string;
  relativePath: string;
  updatedAt: string;
}

export interface BlueprintDiagnostic {
  id: string;
  severity: "error" | "warning" | "info";
  message: string;
  nodeId?: string | null;
  edgeId?: string | null;
  recovery: string;
}

export interface BlueprintIr {
  graphId: string;
  graphName: string;
  nodes: Array<{ id: string; nodeType: string; title: string; properties: Record<string, unknown> }>;
  edges: Array<{ fromNodeId: string; fromPinId: string; toNodeId: string; toPinId: string; edgeType: string }>;
  entryNodes: string[];
}

export interface BlueprintCompileResult {
  success: boolean;
  diagnostics: BlueprintDiagnostic[];
  ir?: BlueprintIr | null;
  compileTimeMicros?: number;
}

export interface BlueprintExecutionTrace {
  nodeId: string;
  nodeTitle: string;
  message: string;
  elapsedMicros: number;
}

export interface BlueprintRunResult {
  success: boolean;
  diagnostics: BlueprintDiagnostic[];
  traces: BlueprintExecutionTrace[];
  commands?: Array<{ commandType: string; target?: string | null; payload: Record<string, unknown> }>;
  variables: Record<string, unknown>;
}

export interface BlueprintNodeDefinition {
  type: string;
  displayName: string;
  category: string;
  description: string;
  inputs: BlueprintPin[];
  outputs: BlueprintPin[];
  properties: Record<string, unknown>;
  executionMode: BlueprintNode["executionMode"];
  runtimeSupported: boolean;
  icon: string;
  color: string;
  keywords: string[];
}

export interface PendingConnection {
  nodeId: string;
  pinId: string;
  direction: BlueprintPinDirection;
}
