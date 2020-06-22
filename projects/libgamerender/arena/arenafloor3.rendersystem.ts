import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { FloorComponent } from '@libgamemodel/components/floor.component';
import { Entity } from '@libecs/entity';
import { ArenaFloor3RenderableGroup } from '@librender/renderable/arenafloor3renderableutil';
import { ArenaFloor3RenderComponent } from './arenafloor3.rendercomponent';
import { ArenaFloor3GlResourcesSingleton } from './arenafloor3glresources.singleton';
import { ArenaFloor3GeometrySingleton } from './arenafloor3geometry.singleton';
import { mat4, vec3, quat } from 'gl-matrix';
import { TempGroupAllocator } from '@libutil/allocator';
import { ArenaFloor3RenderableGroupSingleton } from './arenafloor3renderablegroup.singleton';
import { MathAllocatorsComponent } from '@libgamemodel/components/commoncomponents';
import { ColorUtil } from '@libutil/colorutil';

// Future improvment: This is on static geometry, and this system could reasonably be detached
//  after running once - and only re-run if any components are added that are FloorComponents.
// That could be some sort of ECS-level listener - "if any FloorComponents" are added, be sure
//  to re-render the GeneratingSystem ArenaFloor3RenderSystem.
// For now, just running it every frame should be fine - it won't be doing much after all.

export class ArenaFloor3RenderSystem extends ECSSystem {
  start() { return true; }

  update(ecs: ECSManager) {
    const singletonQuery = {
      renderableGroup: ArenaFloor3RenderableGroupSingleton,
      renderResource: ArenaFloor3GlResourcesSingleton,
      geo: ArenaFloor3GeometrySingleton,
      tempGroupAllocators: MathAllocatorsComponent,
    };
    const componentQuery = {
      floor: FloorComponent,
    };
    ecs.iterateComponents2(singletonQuery, componentQuery, (entity, s, c) => {
      // Static geometry - attach, but no need for updating
      this.getRenderableComponent(
        entity,
        s.renderableGroup.RenderableGroup,
        c.floor,
        s.renderResource,
        s.geo,
        s.tempGroupAllocators.Vec3,
        s.tempGroupAllocators.Quat);
    });
  }

  private getRenderableComponent(
      e: Entity,
      renderGroup: ArenaFloor3RenderableGroup,
      arenaFloor: FloorComponent,
      arenaRenderResources: ArenaFloor3GlResourcesSingleton,
      geoSingleton: ArenaFloor3GeometrySingleton,
      tempVec3: TempGroupAllocator<vec3>,
      tempQuat: TempGroupAllocator<quat>): ArenaFloor3RenderComponent {
    let component = e.getComponent(ArenaFloor3RenderComponent);
    if (!component) {
      const renderable = renderGroup.createRenderable({
        geo: geoSingleton.Geo,
        reflectionTexture: arenaRenderResources.ReflecitonTexture,
      });
      renderable.addTag(FloorComponent);
      tempVec3.get(2, (translation, scale) => {
        tempQuat.get(1, (q) => {
          vec3.set(translation, 0, -0.5, 0);
          vec3.set(scale, arenaFloor.Width, 1, arenaFloor.Height);
          quat.set(q, 0, 0, 0, 1);
          mat4.fromTranslation(renderable.perObjectData.matWorld.Value, translation);
          mat4.fromRotationTranslationScale(
            renderable.perObjectData.matWorld.Value, q, translation, scale);
        });
      });

      const rgb = ColorUtil.COLOR_THEME_CHOCOLATE;
      vec3.set(renderable.perObjectData.floorColor.Value, rgb.r, rgb.g, rgb.b);
      renderable.perObjectData.reflectionFactor = 0.3;

      component = e.addComponent(ArenaFloor3RenderComponent, renderable);
      e.addListener('destroy', () => renderGroup.destroy(renderable));
    }

    return component;
  }
}
