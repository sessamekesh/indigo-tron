import { ParticleBase } from "./particlebase";
import { SceneNode } from "@libutil/scene/scenenode";

class LightningParticle implements ParticleBase {
  constructor(public readonly sceneNode: SceneNode) {}

  shouldDestroy() {
    return true;
  }

  update(dt: number) {}
}
