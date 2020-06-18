import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { LambertRenderGroupSingleton } from '@libgamerender/components/lambertrendergroup.singleton';
import { BasicWallGeometrySingleton } from './basicwallgeometry.singleton';
import { MathAllocatorsComponent, SceneNodeFactoryComponent } from '@libgamemodel/components/commoncomponents';
import { WallComponent2 } from '@libgamemodel/wall/wallcomponent';
import { LightcycleColorComponent, LightcycleColor } from '@libgamemodel/lightcycle/lightcyclecolor.component';
import { TempGroupAllocator } from '@libutil/allocator';
import { vec3 } from 'gl-matrix';
import { SceneNodeFactory } from '@libutil/scene/scenenodefactory';
import { Entity } from '@libecs/entity';
import { BasicWallRenderComponent } from './basicwall.rendercomponent';
import { LambertRenderableGroup } from '@librender/renderable/lambertrenderableutil';
import { Texture } from '@librender/texture/texture';
import { Y_UNIT_DIR } from '@libutil/helpfulconstants';

export class BasicWallRenderSystem2 extends ECSSystem {
  start() { return true; }

  update(ecs: ECSManager) {
    const singletonQuery = {
      basicWallGeometry: BasicWallGeometrySingleton,
      renderGroup: LambertRenderGroupSingleton,
      mathAllocators: MathAllocatorsComponent,
      sceneNodeFactory: SceneNodeFactoryComponent,
    };

    const componentQuery = {
      wall: WallComponent2,
      lightcycleColor: LightcycleColorComponent,
    };

    ecs.iterateComponents2(singletonQuery, componentQuery, (entity, s, c) => {
      this.createRenderComponentIfMissing(
        entity,
        s.renderGroup.LambertRenderGroup,
        s.mathAllocators.Vec3,
        s.sceneNodeFactory.SceneNodeFactory,
        c.wall,
        s.basicWallGeometry,
        c.lightcycleColor.Color);
    });
  }

  private createRenderComponentIfMissing(
      entity: Entity,
      lambertRenderGroup: LambertRenderableGroup,
      vec3Allocator: TempGroupAllocator<vec3>,
      sceneNodeFactory: SceneNodeFactory,
      wallComponent: WallComponent2,
      wallGeo: BasicWallGeometrySingleton,
      color: LightcycleColor): BasicWallRenderComponent {
    let component = entity.getComponent(BasicWallRenderComponent);
    if (!component) {
      const lambertRenderable = lambertRenderGroup.createRenderable({
        geo: wallGeo.LambertGeo,
        diffuseTexture: this.getTextureForColor(color, wallGeo),
      });

      vec3Allocator.get(5, (midpoint, start, end, scl, startToEnd) => {
        vec3.set(start, wallComponent.Corner1.Value[0], 0, wallComponent.Corner1.Value[1]);
        vec3.set(end, wallComponent.Corner2.Value[0], 0, wallComponent.Corner2.Value[1]);
        vec3.sub(startToEnd, end, start);
        const len = vec3.len(startToEnd);
        vec3.lerp(midpoint, start, end, 0.5);
        vec3.set(scl, 0.5 * len, 1, 1);

        const angle = Math.atan2(
          -wallComponent.Corner2.Value[1] + wallComponent.Corner1.Value[1],
          wallComponent.Corner2.Value[0] - wallComponent.Corner1.Value[0]);

        // Lazy hack, use a scene node because we have the position and rotation. Don't do this.
        const sceneNode = sceneNodeFactory.createSceneNode();
        sceneNode.update({
          pos: midpoint,
          rot: {
            axis: Y_UNIT_DIR,
            angle,
          },
          scl,
        });
        sceneNode.getMatWorld(lambertRenderable.perObjectData.matWorld.Value);
        sceneNode.detach();
      });

      lambertRenderable.perObjectData.ambientOverride = 0.9;
      lambertRenderable.addTag(WallComponent2);
      component = entity.addComponent(BasicWallRenderComponent, lambertRenderable);

      entity.addListener('destroy', () => {
        lambertRenderGroup.destroy(lambertRenderable);
      });
    }
    return component;
  }

  private getTextureForColor(
      color: LightcycleColor, wallResources: BasicWallGeometrySingleton): Texture {
    switch (color) {
      case 'blue': return wallResources.BlueTexture;
      case 'green': return wallResources.GreenTexture;
      case 'red': return wallResources.RedTexture;
    }
  }
}
