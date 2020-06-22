import { SceneNode } from "@libutil/scene/scenenode";

export interface ParticleBase {
  sceneNode: SceneNode,
  update(dt: number): void,
  shouldDestroy(): boolean,
}
