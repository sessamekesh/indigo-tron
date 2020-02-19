import { ECSManager } from "@libecs/ecsmanager";
import { MathAllocatorsComponent, OwnedMathAllocatorsComponent, SceneNodeFactoryComponent } from "./commoncomponents";
import { TempGroupAllocator, LifecycleOwnedAllocator } from "@libutil/allocator";
import { vec2, vec3, mat4, quat } from "gl-matrix";
import { SceneNodeFactory } from "@libutil/scene/scenenodefactory";

/**
 * Utility class for constructing common components
 */
export class CommonComponentUtils {
  static getTempMathAllocatorsComponent(ecs: ECSManager) {
    let component = ecs.getSingletonComponent(MathAllocatorsComponent);
    if (component == null) {
      const mathAllocatorsEntity = ecs.createEntity();
      const newComponent = mathAllocatorsEntity.addComponent(
        MathAllocatorsComponent,
        new TempGroupAllocator(vec2.create),
        new TempGroupAllocator(vec3.create),
        new TempGroupAllocator(mat4.create),
        new TempGroupAllocator(quat.create));
      mathAllocatorsEntity.addListener('destroy', () => {
        newComponent.Vec2.clear();
        newComponent.Vec3.clear();
        newComponent.Mat4.clear();
        newComponent.Quat.clear();
      });
      component = newComponent;
    }
    return component;
  }

  static getOwnedMathAllocatorsComponent(ecs: ECSManager) {
    let component = ecs.getSingletonComponent(OwnedMathAllocatorsComponent);
    if (!component) {
      const mathAllocatorsEntity = ecs.createEntity();
      const newComponent = mathAllocatorsEntity.addComponent(
        OwnedMathAllocatorsComponent,
        new LifecycleOwnedAllocator(vec2.create),
        new LifecycleOwnedAllocator(vec3.create),
        new LifecycleOwnedAllocator(mat4.create),
        new LifecycleOwnedAllocator(quat.create));
      mathAllocatorsEntity.addListener('destroy', () => {
        newComponent.Vec2.reset();
        newComponent.Vec3.reset();
        newComponent.Mat4.reset();
        newComponent.Quat.reset();
      });
      component = newComponent;
    }
    return component;
  }

  static getSceneNodeFactoryComponent(ecs: ECSManager): SceneNodeFactoryComponent {
    const { Mat4, Quat } = CommonComponentUtils.getTempMathAllocatorsComponent(ecs);
    let component = ecs.getSingletonComponent(SceneNodeFactoryComponent);
    if (!component) {
      const entity = ecs.createEntity();
      const newComponent = entity.addComponent(
        SceneNodeFactoryComponent,
        new SceneNodeFactory(Mat4, Quat));
      component = newComponent;
    }
    return component;
  }
}
