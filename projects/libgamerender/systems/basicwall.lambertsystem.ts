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
import { OverrideAmbientCoefficientComponent } from '@libgamerender/components/lightsettings.component';
import { LightcycleColorComponent, LightcycleColor } from '@libgamemodel/lightcycle/lightcyclecolor.component';

export class WallGeometryComponent {
  constructor(public Geo: LambertGeo, public BlueTexture: Texture, public GreenTexture: Texture) {}
}

export class BasicWallLambertSystem extends ECSSystem {
  start(ecs: ECSManager) {
    const { gl } = ecs.getSingletonComponentOrThrow(GLContextComponent);
    const { LambertShader } = ecs.getSingletonComponentOrThrow(LambertShaderComponent);
    const wallGeo = WallRenderUtils.generateWallGeo(gl, LambertShader, 1, 1);
    const blueWallTexture = FloorTileTexture.create(
      gl, vec4.fromValues(0.1, 0.1, 0.98, 1), vec4.fromValues(0, 0, 1, 1), 32, 32, 8, 8, 8, 8);
    const greenWallTexture = FloorTileTexture.create(
      gl, vec4.fromValues(0.1, 0.98, 0.1, 1), vec4.fromValues(0, 1, 0, 1), 32, 32, 8, 8, 8, 8);

    const geoEntity = ecs.createEntity();
    geoEntity.addComponent(WallGeometryComponent, wallGeo, blueWallTexture, greenWallTexture);
    return true;
  }

  update(ecs: ECSManager) {
    const wallGeoComponent = ecs.getSingletonComponentOrThrow(WallGeometryComponent);
    const {
      Vec3: vec3Allocator
    } = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent);
    const {
      SceneNodeFactory: sceneNodeFactory,
    } = ecs.getSingletonComponentOrThrow(SceneNodeFactoryComponent);

    ecs.iterateComponents(
      [WallComponent2, LightcycleColorComponent],
      (entity, wallComponent, color) => {
        this.createRenderComponentIfMissing(
          vec3Allocator, sceneNodeFactory, entity, wallComponent, wallGeoComponent, color.Color);
      });
  }

  private createRenderComponentIfMissing(
      vec3Allocator: TempGroupAllocator<vec3>,
      sceneNodeFactory: SceneNodeFactory,
      entity: Entity,
      wallComponent: WallComponent2,
      wallGeoComponent: WallGeometryComponent,
      color: LightcycleColor): LambertRenderableComponent {
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

      let texture: Texture;
      if (color === 'blue') {
        texture = wallGeoComponent.BlueTexture;
      } else {
        texture = wallGeoComponent.GreenTexture;
      }

      component = entity.addComponent(
        LambertRenderableComponent, matWorld, wallGeoComponent.Geo, texture);
      entity.addComponent(OverrideAmbientCoefficientComponent, 0.9);
    }
    return component;
  }
}
