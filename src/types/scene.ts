export interface LevelSummary {
  levelId: string;
  name: string;
  path: string;
  relativePath: string;
  modifiedAt: string;
}

export interface SceneLevel {
  levelId: string;
  name: string;
  path: string;
  createdAt: string;
  updatedAt: string;
  layers: WorldLayer[];
  objects: SceneObject[];
}

export interface WorldLayer {
  id: string;
  name: string;
  visible: boolean;
  color: string;
}

export interface SceneObject {
  id: string;
  name: string;
  tags: string[];
  layer: string | null;
  visible: boolean;
  assetReference: string | null;
  transform: Transform | null;
  components: SceneComponent[];
}

export interface Transform {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface SceneComponent {
  componentType: string;
  data: Record<string, unknown>;
}

