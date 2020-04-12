import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { Entity } from '@libecs/entity';
import { FlatColorGroundHeightMapComponent } from '@libgamemodel/environment/groundtileheightmap/flatcolorgroundheightmapcomponent';
import { FlatColorLambertShader } from '@librender/shader/flatcolorlambertshader';
import { FlatColorLambertShaderComponent } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { FlatColorHeightmapGenerator } from '@librender/geo/generators/flatcolorheightmapgenerator';
import { mat4, vec3 } from 'gl-matrix';
import { FlatColorLambertRenderableComponent } from '@libgamerender/components/flatcolorlambert.rendercomponent';

export class FlatColorEnvironmentFloorRenderSystem extends ECSSystem {
  start() { return true; }
  update(ecs: ECSManager) {
    const { gl } = ecs.getSingletonComponentOrThrow(GLContextComponent);
    const {
      FlatColorLambertShader: flatColorLambertShader,
    } = ecs.getSingletonComponentOrThrow(FlatColorLambertShaderComponent);
    ecs.iterateComponents([FlatColorGroundHeightMapComponent], (entity, component) => {
      this.getEnvironmentFloorRenderComponent(entity, gl, flatColorLambertShader, component);
    });
  }

  private getEnvironmentFloorRenderComponent(
      entity: Entity,
      gl: WebGL2RenderingContext,
      flatColorLambertShader: FlatColorLambertShader,
      component: FlatColorGroundHeightMapComponent)
      : FlatColorLambertRenderableComponent|null {
    let renderComponent = entity.getComponent(FlatColorLambertRenderableComponent);
    if (!renderComponent) {
      const geo = FlatColorHeightmapGenerator.generate(
        gl, flatColorLambertShader, component.HeightMap);
      const matWorld = mat4.create();
      mat4.fromTranslation(matWorld, vec3.fromValues(component.StartX, 0, component.StartZ));
      return geo && entity.addComponent(FlatColorLambertRenderableComponent, geo, matWorld);
    }
    return renderComponent;
  }
}
