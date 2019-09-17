import { ECSSystem } from '@libecs/ecssystem';
import { LambertShader } from '@librender/shader/lambertshader';
import { LambertGeo } from '@librender/geo/lambertgeo';
import { ECSManager } from '@libecs/ecsmanager';
import { Entity } from '@libecs/entity';
import { LightcycleRenderComponent } from '@libgamerender/components/lightcycle.rendercomponent';
import { mat4, glMatrix, quat } from 'gl-matrix';
import { LightcycleComponent } from '@libgamemodel/components/lightcycle.component';
import { PositionComponent } from '@libgamemodel/components/position.component';
import { Texture } from '@librender/geo/texture';
import { FrameSettings } from '@libgamerender/framesettings';

export class LightcycleRenderSystem extends ECSSystem {
  constructor(private lambertShader: LambertShader, private bikeGeo: LambertGeo, private bikeTexture: Texture) {
    super();
  }

  start(ecs: ECSManager) { return true; }

  update(ecs: ECSManager, msDt: number) {
    // Refresh all render components to match
    ecs.iterateComponents(
        [LightcycleComponent, PositionComponent],
        (entity, lightcycleComponent, positionComponent) => {
          const renderComponent = this.getRenderComponent(entity);

          // TODO (sessamekesh): Replace inline math allocations with... cached values.
          const dracoTransform = mat4.create();
          mat4.rotateX(dracoTransform, mat4.identity(mat4.create()), glMatrix.toRadian(-90));
          const orientationTransform = quat.create();
          quat.fromEuler(orientationTransform, 0, lightcycleComponent.Orientation, 0);
          const modelTransform = mat4.create();
          mat4.fromRotationTranslation(modelTransform, orientationTransform, positionComponent.Position);
          mat4.multiply(renderComponent.WorldTransform, modelTransform, dracoTransform);
        });
  }

  render(gl: WebGL2RenderingContext, ecs: ECSManager, frameSettings: FrameSettings) {
    // Draw Lambert objects...
    this.lambertShader.activate(gl);
    ecs.iterateComponents([LightcycleRenderComponent], (entity, lightcycleRenderComponent) => {
      this.lambertShader.render(gl, {
        AmbientCoefficient: frameSettings.AmbientCoefficient,
        DiffuseTexture: this.bikeTexture,
        Geo: this.bikeGeo,
        LightColor: frameSettings.LightColor,
        LightDirection: frameSettings.LightDirection,
        MatProj: frameSettings.MatProj,
        MatView: frameSettings.MatView,
        MatWorld: lightcycleRenderComponent.WorldTransform,
      });
    });
  }

  private getRenderComponent(entity: Entity): LightcycleRenderComponent {
    let component = entity.getComponent(LightcycleRenderComponent);
    if (!component) {
      const matWorld = mat4.create();
      component = entity.addComponent(LightcycleRenderComponent, matWorld, 1);
    }

    return component;
  }
}
