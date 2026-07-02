import { create } from "zustand";
import { commands } from "../../../lib/tauri";
import type { BlueprintCompileResult, BlueprintDiagnostic, BlueprintEdge, BlueprintGraph, BlueprintGraphSummary, BlueprintNode, BlueprintRunResult, PendingConnection } from "../types/blueprint-types";
import { createNodeFromDefinition, findNodeDefinition } from "../data/nodeRegistry";
import { validateConnection, validateGraph } from "../utils/graphValidation";
import { autoLayoutGraph } from "../utils/autoLayout";

interface BlueprintState {
  graphs: BlueprintGraphSummary[];
  activeGraph: BlueprintGraph | null;
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  pendingConnection: PendingConnection | null;
  diagnostics: BlueprintDiagnostic[];
  compileResult: BlueprintCompileResult | null;
  runResult: BlueprintRunResult | null;
  dirty: boolean;
  clipboard: BlueprintNode[];
  searchOpen: boolean;
  searchPosition: { x: number; y: number };
  zoom: number;
  pan: { x: number; y: number };
  history: BlueprintGraph[];
  future: BlueprintGraph[];
  loadGraphs: (projectRoot: string) => Promise<void>;
  createGraph: (projectRoot: string, name: string, graphType: string) => Promise<void>;
  openGraph: (projectRoot: string, relativePath: string) => Promise<void>;
  saveGraph: (projectRoot: string) => Promise<void>;
  deleteGraph: (projectRoot: string, relativePath: string) => Promise<void>;
  duplicateGraph: (projectRoot: string, relativePath: string, name: string) => Promise<void>;
  setActiveGraph: (graph: BlueprintGraph) => void;
  selectNode: (nodeId: string | null, append?: boolean) => void;
  selectEdge: (edgeId: string | null) => void;
  addNode: (type: string, position: { x: number; y: number }) => void;
  moveNode: (nodeId: string, position: { x: number; y: number }) => void;
  updateNodeProperties: (nodeId: string, properties: Record<string, unknown>) => void;
  deleteSelection: () => void;
  copySelection: () => void;
  pasteSelection: () => void;
  createCommentBox: () => void;
  focusSelection: () => void;
  beginConnection: (nodeId: string, pinId: string, direction: "input" | "output") => void;
  completeConnection: (nodeId: string, pinId: string, direction: "input" | "output") => void;
  clearConnection: () => void;
  openSearch: (position: { x: number; y: number }) => void;
  closeSearch: () => void;
  setViewport: (pan: { x: number; y: number }, zoom: number) => void;
  compile: () => Promise<void>;
  runPreview: () => Promise<void>;
  autoArrange: () => void;
  undo: () => void;
  redo: () => void;
}

export const useBlueprintStore = create<BlueprintState>((set, get) => ({
  graphs: [],
  activeGraph: null,
  selectedNodeIds: [],
  selectedEdgeIds: [],
  pendingConnection: null,
  diagnostics: [],
  compileResult: null,
  runResult: null,
  dirty: false,
  clipboard: [],
  searchOpen: false,
  searchPosition: { x: 240, y: 180 },
  zoom: 1,
  pan: { x: 0, y: 0 },
  history: [],
  future: [],

  async loadGraphs(projectRoot) {
    const graphs = await commands.listBlueprintGraphs(projectRoot);
    set({ graphs });
  },

  async createGraph(projectRoot, name, graphType) {
    const graph = await commands.createBlueprintGraph(projectRoot, name, graphType);
    const graphs = await commands.listBlueprintGraphs(projectRoot);
    set({ activeGraph: graph, graphs, selectedNodeIds: [], selectedEdgeIds: [], diagnostics: [], compileResult: null, runResult: null, history: [], future: [], dirty: false });
  },

  async openGraph(projectRoot, relativePath) {
    const graph = await commands.readBlueprintGraph(projectRoot, relativePath);
    set({ activeGraph: graph, selectedNodeIds: [], selectedEdgeIds: [], diagnostics: validateGraph(graph), compileResult: null, runResult: null, history: [], future: [], dirty: false });
  },

  async saveGraph(projectRoot) {
    const graph = get().activeGraph;
    if (!graph) return;
    const saved = await commands.saveBlueprintGraph(projectRoot, graph);
    const graphs = await commands.listBlueprintGraphs(projectRoot);
    set({ activeGraph: saved, graphs, diagnostics: validateGraph(saved), dirty: false });
  },

  async deleteGraph(projectRoot, relativePath) {
    await commands.deleteBlueprintGraph(projectRoot, relativePath);
    const graphs = await commands.listBlueprintGraphs(projectRoot);
    set({ graphs, activeGraph: null, selectedNodeIds: [], selectedEdgeIds: [] });
  },

  async duplicateGraph(projectRoot, relativePath, name) {
    const graph = await commands.duplicateBlueprintGraph(projectRoot, relativePath, name);
    const graphs = await commands.listBlueprintGraphs(projectRoot);
    set({ graphs, activeGraph: graph, dirty: false });
  },

  setActiveGraph(graph) {
    set({ activeGraph: graph, diagnostics: validateGraph(graph), dirty: true });
  },

  selectNode(nodeId, append = false) {
    if (!nodeId) return set({ selectedNodeIds: [], selectedEdgeIds: [] });
    set((state) => ({ selectedNodeIds: append ? Array.from(new Set([...state.selectedNodeIds, nodeId])) : [nodeId], selectedEdgeIds: [] }));
  },

  selectEdge(edgeId) {
    set({ selectedEdgeIds: edgeId ? [edgeId] : [], selectedNodeIds: [] });
  },

  addNode(type, position) {
    const definition = findNodeDefinition(type);
    const graph = get().activeGraph;
    if (!definition || !graph) return;
    pushGraph(set, graph);
    const node = createNodeFromDefinition(definition, position.x, position.y);
    const next = { ...graph, nodes: [...graph.nodes, node], updatedAt: new Date().toISOString() };
    set({ activeGraph: next, selectedNodeIds: [node.id], searchOpen: false, diagnostics: validateGraph(next), future: [], dirty: true });
  },

  moveNode(nodeId, position) {
    const graph = get().activeGraph;
    if (!graph) return;
    const next = { ...graph, nodes: graph.nodes.map((node) => node.id === nodeId ? { ...node, position } : node), updatedAt: new Date().toISOString() };
    set({ activeGraph: next, dirty: true });
  },

  updateNodeProperties(nodeId, properties) {
    const graph = get().activeGraph;
    if (!graph) return;
    pushGraph(set, graph);
    const next = { ...graph, nodes: graph.nodes.map((node) => node.id === nodeId ? { ...node, properties: { ...node.properties, ...properties } } : node), updatedAt: new Date().toISOString() };
    set({ activeGraph: next, diagnostics: validateGraph(next), future: [], dirty: true });
  },

  deleteSelection() {
    const graph = get().activeGraph;
    if (!graph) return;
    pushGraph(set, graph);
    const nodes = new Set(get().selectedNodeIds);
    const edges = new Set(get().selectedEdgeIds);
    const next: BlueprintGraph = {
      ...graph,
      nodes: graph.nodes.filter((node) => !nodes.has(node.id)),
      edges: graph.edges.filter((edge) => !edges.has(edge.id) && !nodes.has(edge.fromNodeId) && !nodes.has(edge.toNodeId)),
      updatedAt: new Date().toISOString()
    };
    set({ activeGraph: next, selectedNodeIds: [], selectedEdgeIds: [], diagnostics: validateGraph(next), future: [], dirty: true });
  },

  copySelection() {
    const graph = get().activeGraph;
    if (!graph) return;
    const selected = new Set(get().selectedNodeIds);
    set({ clipboard: graph.nodes.filter((node) => selected.has(node.id)).map((node) => structuredClone(node)) });
  },

  pasteSelection() {
    const graph = get().activeGraph;
    const clipboard = get().clipboard;
    if (!graph || clipboard.length === 0) return;
    pushGraph(set, graph);
    const clones = clipboard.map((node, index) => ({
      ...structuredClone(node),
      id: crypto.randomUUID(),
      position: { x: node.position.x + 44 + index * 14, y: node.position.y + 44 + index * 14 }
    }));
    const next = { ...graph, nodes: [...graph.nodes, ...clones], updatedAt: new Date().toISOString() };
    set({ activeGraph: next, selectedNodeIds: clones.map((node) => node.id), diagnostics: validateGraph(next), future: [], dirty: true });
  },

  createCommentBox() {
    get().addNode("custom.comment_box", { x: 260, y: 180 });
  },

  focusSelection() {
    const graph = get().activeGraph;
    const selected = get().selectedNodeIds;
    if (!graph || selected.length === 0) return;
    const node = graph.nodes.find((item) => item.id === selected[0]);
    if (!node) return;
    set({ pan: { x: 420 - node.position.x, y: 240 - node.position.y }, zoom: 1 });
  },

  beginConnection(nodeId, pinId, direction) {
    set({ pendingConnection: { nodeId, pinId, direction } });
  },

  completeConnection(nodeId, pinId, direction) {
    const graph = get().activeGraph;
    const pending = get().pendingConnection;
    if (!graph || !pending || pending.direction === direction) return set({ pendingConnection: null });
    const from = pending.direction === "output" ? pending : { nodeId, pinId, direction };
    const to = pending.direction === "input" ? pending : { nodeId, pinId, direction };
    const error = validateConnection(graph, from.nodeId, from.pinId, to.nodeId, to.pinId);
    if (error) return set({ diagnostics: [error, ...get().diagnostics], pendingConnection: null });
    const fromNode = graph.nodes.find((node) => node.id === from.nodeId);
    const fromPin = fromNode?.outputs.find((pin) => pin.id === from.pinId);
    const edge: BlueprintEdge = {
      id: crypto.randomUUID(),
      fromNodeId: from.nodeId,
      fromPinId: from.pinId,
      toNodeId: to.nodeId,
      toPinId: to.pinId,
      edgeType: fromPin?.pinKind ?? "data",
      dataType: fromPin?.dataType ?? "Any",
      metadata: {}
    };
    pushGraph(set, graph);
    const next = { ...graph, edges: [...graph.edges.filter((item) => !(item.toNodeId === to.nodeId && item.toPinId === to.pinId && !findInputPin(graph, to.nodeId, to.pinId)?.multipleConnectionsAllowed)), edge], updatedAt: new Date().toISOString() };
    set({ activeGraph: next, pendingConnection: null, diagnostics: validateGraph(next), future: [], dirty: true });
  },

  clearConnection() {
    set({ pendingConnection: null });
  },

  openSearch(position) {
    set({ searchOpen: true, searchPosition: position });
  },

  closeSearch() {
    set({ searchOpen: false });
  },

  setViewport(pan, zoom) {
    set({ pan, zoom: Math.max(0.35, Math.min(1.8, zoom)) });
  },

  async compile() {
    const graph = get().activeGraph;
    if (!graph) return;
    const localDiagnostics = validateGraph(graph);
    if (localDiagnostics.some((diag) => diag.severity === "error")) {
      set({ diagnostics: localDiagnostics, compileResult: { success: false, diagnostics: localDiagnostics, ir: null, compileTimeMicros: 0 } });
      return;
    }
    const result = await commands.compileBlueprintGraph(graph);
    set({ compileResult: result, diagnostics: result.diagnostics });
  },

  async runPreview() {
    const graph = get().activeGraph;
    if (!graph) return;
    const result = await commands.runBlueprintPreview(graph);
    set({ runResult: result, diagnostics: result.diagnostics });
  },

  autoArrange() {
    const graph = get().activeGraph;
    if (!graph) return;
    pushGraph(set, graph);
    const next = autoLayoutGraph(graph);
    set({ activeGraph: next, diagnostics: validateGraph(next), future: [], dirty: true });
  },

  undo() {
    const graph = get().activeGraph;
    const history = get().history;
    if (!graph || history.length === 0) return;
    const previous = history[history.length - 1];
    set({ activeGraph: previous, history: history.slice(0, -1), future: [graph, ...get().future], diagnostics: validateGraph(previous), dirty: true });
  },

  redo() {
    const graph = get().activeGraph;
    const future = get().future;
    if (!graph || future.length === 0) return;
    const next = future[0];
    set({ activeGraph: next, history: [...get().history, graph], future: future.slice(1), diagnostics: validateGraph(next), dirty: true });
  }
}));

function pushGraph(set: (partial: Partial<BlueprintState> | ((state: BlueprintState) => Partial<BlueprintState>)) => void, graph: BlueprintGraph) {
  set((state) => ({ history: [...state.history.slice(-30), structuredClone(graph)] }));
}

function findInputPin(graph: BlueprintGraph, nodeId: string, pinId: string) {
  return graph.nodes.find((node) => node.id === nodeId)?.inputs.find((pin) => pin.id === pinId);
}
