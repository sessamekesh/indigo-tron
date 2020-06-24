import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { BasicWallGeometrySingleton } from './basicwallgeometry.singleton';
import { MathAllocatorsComponent, SceneGraphComponent } from '@libgamemodel/components/commoncomponents';
import { WallComponent2 } from '@libgamemodel/wall/wallcomponent';
import { LightcycleColorComponent, LightcycleColor } from '@libgamemodel/lightcycle/lightcyclecolor.component';
import { TempGroupAllocator } from '@libutil/allocator';
import { vec3 } from 'gl-matrix';
import { Entity } from '@libecs/entity';
import { BasicWallRenderComponent } from './basicwall.rendercomponent';
import { Texture } from '@librender/texture/texture';
import { Y_UNIT_DIR } from '@libutil/helpfulconstants';
import { SceneGraph2 } from '@libscenegraph/scenegraph2';
import { Mat4TransformAddon } from '@libscenegraph/scenenodeaddons/mat4transformaddon';
import { Renderable2SceneNodeAddon } from '@librender/renderable/renderable2.scenenodeaddon';
import { LambertRenderable2 } from '@librender/renderable/lambert.renderable2';

export class BasicWallRenderSystem2 extends ECSSystem {
  start() { return true; }

  update(ecs: ECSManager) {
    const singletonQuery = {
      basicWallGeometry: BasicWallGeometrySingleton,
      mathAllocators: MathAllocatorsComponent,
      sceneNodeFactory: SceneGraphComponent,
    };

    const componentQuery = {
      wall: WallComponent2,
      lightcycleColor: LightcycleColorComponent,
    };

    ecs.iterateComponents2(singletonQuery, componentQuery, (entity, s, c) => {
      this.createRenderComponentIfMissing(
        entity,
        s.mathAllocators.Vec3,
        s.sceneNodeFactory.SceneGraph,
        c.wall,
        s.basicWallGeometry,
        c.lightcycleColor.Color);
    });
  }

  private createRenderComponentIfMissing(
      entity: Entity,
      vec3Allocator: TempGroupAllocator<vec3>,
      sceneGraph: SceneGraph2,
      wallComponent: WallComponent2,
      wallGeo: BasicWallGeometrySingleton,
      color: LightcycleColor): BasicWallRenderComponent {
    let component = entity.getComponent(BasicWallRenderComponent);
    if (!component) {
      const sceneNode = sceneGraph.createSceneNode();
      const renderable = new LambertRenderable2({
        diffuseTexture: this.getTextureForColor(color, wallGeo),
        geo: wallGeo.LambertGeo,
        ambientOverride: 0.9,
      });
      sceneNode.getAddon(Renderable2SceneNodeAddon).addRenderable(LambertRenderable2, renderable);
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

        const mat4Addon = sceneNode.getAddon(Mat4TransformAddon);
        mat4Addon.update({
          pos: midpoint,
          rot: {
            axis: Y_UNIT_DIR,
            angle,
          },
          scl,
        });
      });

      renderable.addTag(WallComponent2);
      component = entity.addComponent(BasicWallRenderComponent, renderable);

      entity.addListener('destroy', () => {
        sceneNode.getAddon(Renderable2SceneNodeAddon).removeRenderable(LambertRenderable2, renderable);
        sceneNode.destroy();
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
