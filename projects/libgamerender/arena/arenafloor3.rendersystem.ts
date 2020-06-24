import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { FloorComponent } from '@libgamemodel/components/floor.component';
import { Entity } from '@libecs/entity';
import { ArenaFloor3RenderComponent } from './arenafloor3.rendercomponent';
import { ArenaFloor3GlResourcesSingleton } from './arenafloor3glresources.singleton';
import { ArenaFloor3GeometrySingleton } from './arenafloor3geometry.singleton';
import { vec3 } from 'gl-matrix';
import { TempGroupAllocator, LifecycleOwnedAllocator } from '@libutil/allocator';
import { MathAllocatorsComponent, SceneGraphComponent, OwnedMathAllocatorsComponent } from '@libgamemodel/components/commoncomponents';
import { ColorUtil } from '@libutil/colorutil';
import { SceneGraph2 } from '@libscenegraph/scenegraph2';
import { ArenaFloor3Renderable2 } from '@librender/renderable/arenafloor3.renderable2';
import { Mat4TransformAddon } from '@libscenegraph/scenenodeaddons/mat4transformaddon';
import { Renderable2SceneNodeAddon } from '@librender/renderable/renderable2.scenenodeaddon';

// Future improvment: This is on static geometry, and this system could reasonably be detached
//  after running once - and only re-run if any components are added that are FloorComponents.
// That could be some sort of ECS-level listener - "if any FloorComponents" are added, be sure
//  to re-render the GeneratingSystem ArenaFloor3RenderSystem.
// For now, just running it every frame should be fine - it won't be doing much after all.

export class ArenaFloor3RenderSystem extends ECSSystem {
  start() { return true; }

  update(ecs: ECSManager) {
    const singletonQuery = {
      sceneGraph: SceneGraphComponent,
      renderResource: ArenaFloor3GlResourcesSingleton,
      geo: ArenaFloor3GeometrySingleton,
      allocators: OwnedMathAllocatorsComponent,
      tempGroupAllocators: MathAllocatorsComponent,
    };
    const componentQuery = {
      floor: FloorComponent,
    };
    ecs.iterateComponents2(singletonQuery, componentQuery, (entity, s, c) => {
      // Static geometry - attach, but no need for updating
      this.getRenderableComponent(
        entity,
        s.sceneGraph.SceneGraph,
        c.floor,
        s.renderResource,
        s.geo,
        s.allocators.Vec3,
        s.tempGroupAllocators.Vec3);
    });
  }

  private getRenderableComponent(
      e: Entity,
      sceneGraph: SceneGraph2,
      arenaFloor: FloorComponent,
      arenaRenderResources: ArenaFloor3GlResourcesSingleton,
      geoSingleton: ArenaFloor3GeometrySingleton,
      vec3Allocator: LifecycleOwnedAllocator<vec3>,
      tempVec3: TempGroupAllocator<vec3>): ArenaFloor3RenderComponent {
    let component = e.getComponent(ArenaFloor3RenderComponent);
    if (!component) {
      const sceneNode = sceneGraph.createSceneNode();
      const rgb = ColorUtil.COLOR_THEME_CHOCOLATE;
      const renderable = new ArenaFloor3Renderable2({
        geo: geoSingleton.Geo,
        reflectionTexture: arenaRenderResources.ReflecitonTexture,
        floorColor: vec3Allocator.get(),
        reflectionFactor: 0.3,
      });
      vec3.set(renderable.perObjectData.floorColor.Value, rgb.r, rgb.g, rgb.b);

      sceneNode.getAddon(Renderable2SceneNodeAddon)
          .addRenderable(ArenaFloor3Renderable2, renderable);

      const mat4Transform = sceneNode.getAddon(Mat4TransformAddon);
      renderable.addTag(FloorComponent);
        tempVec3.get(2, (translation, scale) => {
          vec3.set(translation, 0, -0.5, 0);
          vec3.set(scale, arenaFloor.Width, 1, arenaFloor.Height);
          mat4Transform.update({
            pos: translation,
            scl: scale,
          });
        });

      component = e.addComponent(ArenaFloor3RenderComponent, sceneNode);
      e.addListener('destroy', () => {
        sceneNode.destroy();
        renderable.perObjectData.floorColor.ReleaseFn();
      });
    }

    return component;
  }
}
