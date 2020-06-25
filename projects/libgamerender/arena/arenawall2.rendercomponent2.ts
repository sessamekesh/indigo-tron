import { SceneNode2 } from '@libscenegraph/scenenode2';
import { ArenaWallShader2Renderable2 } from '@libgamerender/shaders/arenawallshader2.renderable';

export class ArenaWall2RenderComponent2 {
  constructor(
    public readonly RenderSceneNode: SceneNode2,
    public readonly Renderable: ArenaWallShader2Renderable2) {}
}
