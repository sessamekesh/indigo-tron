import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { MainRenderPassComponent, FloorReflectionRenderPassComponent } from '@libgamerender/components/mainrenderpass.component';
import { OwnedMathAllocatorsComponent, SceneNodeFactoryComponent, MathAllocatorsComponent } from '@libgamemodel/components/commoncomponents';
import { WallComponent2 } from '@libgamemodel/wall/wallcomponent';
import { LambertShader, LambertRenderCall2 } from '@librender/shader/lambertshader';
import { LambertGeoRawVertexData, LambertGeo } from '@librender/geo/lambertgeo';
import { IBData } from '@librender/geo/ibdesc';
import { Entity } from '@libecs/entity';
import { WallRenderComponent } from '@libgamerender/components/wall.rendercomponent';
import { SceneNodeFactory } from '@libutil/scene/scenenodefactory';
import { TempGroupAllocator } from '@libutil/allocator';
import { vec3, vec4 } from 'gl-matrix';
import { Y_UNIT_DIR } from '@libutil/helpfulconstants';
import { Texture } from '@librender/texture/texture';
import { LambertShaderComponent } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { WallRenderUtils } from './wallrenderutils';
import { GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { FloorTileTexture } from '@librender/texture/floortiletexture';

export class WallGeometryComponent {
  constructor(public Geo: LambertGeo, public Texture: Texture) {}
}

export class WallRenderSystem2 extends ECSSystem {
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
    const mainRenderPass = ecs.getSingletonComponentOrThrow(MainRenderPassComponent);
    const floorReflectionRenderPass = ecs.getSingletonComponentOrThrow(
      FloorReflectionRenderPassComponent);
    const {
      Mat4: ownedMat4Allocator,
    } = ecs.getSingletonComponentOrThrow(OwnedMathAllocatorsComponent);
    const {
      Vec3: vec3Allocator
    } = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent);
    const {
      Geo: wallGeo,
      Texture: wallTexture,
    } = ecs.getSingletonComponentOrThrow(WallGeometryComponent);
    const {
      SceneNodeFactory: sceneNodeFactory,
    } = ecs.getSingletonComponentOrThrow(SceneNodeFactoryComponent);

    ecs.iterateComponents([WallComponent2], (entity, wallComponent) => {
      const renderComponent = this.getRenderComponent(
        entity, wallComponent, wallTexture, sceneNodeFactory, vec3Allocator);
      const matWorld = ownedMat4Allocator.get();
      renderComponent.SceneNode.getMatWorld(matWorld.Value);

      const call: LambertRenderCall2 = {
        DiffuseTexture: renderComponent.Texture,
        Geo: wallGeo,
        MatWorld: matWorld,
        AmbientCoefficientOverride: 0.9,
      };
      mainRenderPass.LambertCalls.push(call);
      floorReflectionRenderPass.LambertCalls.push(call);
    });
  }

  private getRenderComponent(
      entity: Entity,
      wallComponent: WallComponent2,
      wallTexture: Texture,
      sceneNodeFactory: SceneNodeFactory,
      vec3Allocator: TempGroupAllocator<vec3>): WallRenderComponent {
    let component = entity.getComponent(WallRenderComponent);
    if (!component) {
      const sceneNode = sceneNodeFactory.createSceneNode();
      vec3Allocator.get(3, (midpoint, start, end) => {
        vec3.set(start, wallComponent.Corner1.Value[0], 0, wallComponent.Corner1.Value[1]);
        vec3.set(end, wallComponent.Corner2.Value[0], 0, wallComponent.Corner2.Value[1]);
        vec3.lerp(midpoint, start, end, 0.5);

        const angle = Math.atan2(
          -wallComponent.Corner2.Value[1] + wallComponent.Corner1.Value[1],
          wallComponent.Corner2.Value[0] - wallComponent.Corner1.Value[0]);
        sceneNode.update({
          pos: midpoint,
          rot: {
            axis: Y_UNIT_DIR,
            angle,
          },
        });
      });
      component = entity.addComponent(WallRenderComponent, sceneNode, wallTexture);
      entity.addListener('destroy', () => {
        sceneNode.detach();
      });
    }
    return component;
  }
}
