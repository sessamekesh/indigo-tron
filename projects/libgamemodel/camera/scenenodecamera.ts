import { Camera } from "./camera";
import { SceneNode } from "@libutil/scene/scenenode";
import { vec3, mat4 } from "gl-matrix";
import { TempGroupAllocator } from "@libutil/allocator";
import { SceneNodeFactory } from "@libutil/scene/scenenodefactory";

export class SceneNodeCamera implements Camera {
  constructor(
    private vec3Allocator: TempGroupAllocator<vec3>,
    private posNode: SceneNode,
    private lookAtNode: SceneNode,
    private upNode: SceneNode) {}

  pos(o: vec3) {
    this.posNode.getPos(o);
  }

  lookAt(o: vec3) {
    this.lookAtNode.getPos(o);
  }

  up(o: vec3) {
    this.upNode.getPos(o);
  }

  matView(o: mat4) {
    this.vec3Allocator.get(3, (pos, lookAt, up) => {
      this.pos(pos);
      this.lookAt(lookAt);
      this.up(up);
      mat4.lookAt(o, pos, lookAt, up);
    });
  }

  static attachAtFixedOffsetTo(
      vec3Allocator: TempGroupAllocator<vec3>,
      attachmentPoint: SceneNode,
      sceneNodeFactory: SceneNodeFactory,
      offset: vec3,
      up: vec3) {
    const posNode = sceneNodeFactory.createSceneNode({
      pos: offset
    });
    posNode.attachToParent(attachmentPoint);
    const upNode = sceneNodeFactory.createSceneNode({
      pos: up,
    });
    return new SceneNodeCamera(vec3Allocator, posNode, attachmentPoint, upNode);
  }
}
