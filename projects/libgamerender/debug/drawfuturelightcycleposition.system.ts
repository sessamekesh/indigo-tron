import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { LightcycleComponent2 } from '@libgamemodel/lightcycle/lightcycle.component';
import { LightcycleColorComponent } from '@libgamemodel/lightcycle/lightcyclecolor.component';
import { LambertRenderableComponent } from '@libgamerender/components/lambertrenderable.component';
import { Entity } from '@libecs/entity';
import { DrawFutureLightcycleComponent } from './drawfuturelightcycle.component';
import { FutureLightcyclePositionComponent } from '@libgamemodel/debug/futurelightcycleposition.component';
import { SceneNodeFactory } from '@libutil/scene/scenenodefactory';
import { SceneNodeFactoryComponent } from '@libgamemodel/components/commoncomponents';
import { GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { FloorTileTexture } from '@librender/texture/floortiletexture';
import { vec4, vec3, mat4 } from 'gl-matrix';
import { CubeGeoGenerator } from '@librender/geo/generators/cubegeogenerator';
import { LambertShader } from '@librender/shader/lambertshader';
import { LambertShaderComponent } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { LambertGeo } from '@librender/geo/lambertgeo';
import { DebugRenderTag } from '@libgamemodel/debug/debugrendertag';
import { DebugMarkerUtil } from './debugmarker.util';

export class DrawFutureLightcyclePositionSystem extends ECSSystem {
  start() { return true; }
  update(ecs: ECSManager) {
    const { SceneNodeFactory } = ecs.getSingletonComponentOrThrow(SceneNodeFactoryComponent);
    const { gl } = ecs.getSingletonComponentOrThrow(GLContextComponent);
    const { LambertShader } = ecs.getSingletonComponentOrThrow(LambertShaderComponent);

    ecs.iterateComponents(
        [LightcycleComponent2, LightcycleColorComponent, FutureLightcyclePositionComponent],
        (entity, lightcycle, color, futurePosition) => {
      const renderEntity = this.getRenderEntity(ecs, entity, SceneNodeFactory);
      const renderableComponent = this.getRenderableComponent(
        gl, LambertShader, renderEntity.RenderEntity, color);

      // May happen in case of GL errors
      if (!renderableComponent) return;

      renderEntity.MatWorldSceneNode.update({ pos: futurePosition.Position.Value });
      renderEntity.MatWorldSceneNode.getMatWorld(renderableComponent.MatWorld);
    });
  }

  private getRenderEntity(
      ecs: ECSManager,
      lightcycleEntity: Entity,
      sceneNodeFactory: SceneNodeFactory): DrawFutureLightcycleComponent {
    let component = lightcycleEntity.getComponent(DrawFutureLightcycleComponent);
    if (!component) {
      const e = ecs.createEntity();
      const sceneNode = sceneNodeFactory.createSceneNode();
      component = lightcycleEntity.addComponent(DrawFutureLightcycleComponent, e, sceneNode);
      lightcycleEntity.addListener('destroy', (parent) => {
        e.destroy();
        sceneNode.detach();
      });
    }
    return component;
  }

  private getRenderableComponent(
      gl: WebGL2RenderingContext,
      lambertShader: LambertShader,
      entity: Entity,
      color: LightcycleColorComponent): LambertRenderableComponent|null {
    let component = entity.getComponent(LambertRenderableComponent);
    if (component) return component;

    const c = vec4.create();
    switch (color.Color) {
      case 'blue': vec4.set(c, 0.1, 0.1, 1, 1); break;
      case 'green': vec4.set(c, 0.1, 1, 0.1, 1); break;
      default: vec4.set(c, 0.5, 0.5, 0.5, 1); break;
    }
    return DebugMarkerUtil.attachDebugMarker(entity, gl, lambertShader, c);
  }
}
