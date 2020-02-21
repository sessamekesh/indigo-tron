import { LambertGeo } from '@librender/geo/lambertgeo';
import { Texture } from '@librender/texture/texture';
import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { LambertShaderComponent } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { WallRenderUtils } from './wallrenderutils';
import { FloorTileTexture } from '@librender/texture/floortiletexture';
import { vec4, mat4, vec3 } from 'gl-matrix';
import { WallComponent2 } from '@libgamemodel/wall/wallcomponent';
import { Entity } from '@libecs/entity';
import { LambertRenderableComponent } from '@libgamerender/components/lambertrenderable.component';
import { TempGroupAllocator } from '@libutil/allocator';
import { MathAllocatorsComponent, SceneNodeFactoryComponent } from '@libgamemodel/components/commoncomponents';
import { SceneNodeFactory } from '@libutil/scene/scenenodefactory';
import { Y_UNIT_DIR } from '@libutil/helpfulconstants';

export class WallGeometryComponent {
  constructor(public Geo: LambertGeo, public Texture: Texture) {}
}

export class BasicWallLambertSystem extends ECSSystem {
  start(ecs: ECSManager) {
    const { gl } = ecs.getSingletonComponentOrThrow(GLContextComponent);
    const { LambertShader } = ecs.getSingletonComponentOrThrow(LambertShaderComponent);
    const wallGeo = WallRenderUtils.generateWallGeo(gl, LambertShader, 1, 1);
    const wallTexture = FloorTileTexture.create(
      gl, vec4.fromValues(0.1, 0.1, 0.98, 1), vec4.fromValues(0, 0, 1, 1), 32, 32, 8, 8, 8, 8);

    const geoEntity = ecs.createEntity();
    geoEntity.addComponent(WallGeometryComponent, wallGeo, wallTexture);
    return true;
  }

  update(ecs: ECSManager) {
    const {
      Geo: wallGeo,
      Texture: wallTexture,
    } = ecs.getSingletonComponentOrThrow(WallGeometryComponent);
    const {
      Vec3: vec3Allocator
    } = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent);
    const {
      SceneNodeFactory: sceneNodeFactory,
    } = ecs.getSingletonComponentOrThrow(SceneNodeFactoryComponent);

    ecs.iterateComponents([WallComponent2], (entity, wallComponent) => {
      this.createRenderComponentIfMissing(
        vec3Allocator, sceneNodeFactory, entity, wallComponent, wallTexture, wallGeo);
    });
  }

  private createRenderComponentIfMissing(
      vec3Allocator: TempGroupAllocator<vec3>,
      sceneNodeFactory: SceneNodeFactory,
      entity: Entity,
      wallComponent: WallComponent2,
      wallTexture: Texture,
      wallGeo: LambertGeo): LambertRenderableComponent {
    let component = entity.getComponent(LambertRenderableComponent);
    if (!component) {
      const matWorld = mat4.create();

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
        sceneNode.getMatWorld(matWorld);
        sceneNode.detach();
      });

      component = entity.addComponent(
        LambertRenderableComponent, matWorld, wallGeo, wallTexture);
    }
    return component;
  }
}
