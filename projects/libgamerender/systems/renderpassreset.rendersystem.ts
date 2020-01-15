import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { MainRenderPassComponent } from '@libgamerender/components/mainrenderpass.component';
import { vec3, mat4, glMatrix } from 'gl-matrix';
import { CameraComponent } from '@libgamemodel/components/gameappuicomponents';
import { GLContextComponent } from '@libgamerender/components/renderresourcecomponents';

export class RenderPassResetSystem extends ECSSystem {
  start(ecs: ECSManager) {
    const renderPassEntity = ecs.createEntity();
    renderPassEntity.addComponent(MainRenderPassComponent, [], {
      AmbientCoefficient: 0.3,
      LightColor: vec3.fromValues(1, 1, 1),
      LightDirection: vec3.fromValues(0, -1, 0),
      MatProj: mat4.create(),
      MatView: mat4.create(),
    });
    return true;
  }

  update(ecs: ECSManager, msDt: number) {
    const mainRenderPass = ecs.getSingletonComponent(MainRenderPassComponent);
    const camera = ecs.getSingletonComponentOrThrow(CameraComponent);
    const {gl} = ecs.getSingletonComponentOrThrow(GLContextComponent);
    if (!mainRenderPass) return;

    for (let i = 0; i < mainRenderPass.LambertCalls.length; i++) {
      mainRenderPass.LambertCalls[0].LightDirection.ReleaseFn();
      mainRenderPass.LambertCalls[0].LightColor.ReleaseFn();
      mainRenderPass.LambertCalls[0].MatProj.ReleaseFn();
      mainRenderPass.LambertCalls[0].MatView.ReleaseFn();
      mainRenderPass.LambertCalls[0].MatWorld.ReleaseFn();
    }
    mainRenderPass.LambertCalls = [];
    mat4.perspective(
      mainRenderPass.FrameSettings.MatProj,
      glMatrix.toRadian(45),
      gl.canvas.width / gl.canvas.height,
      0.1,
      1000.0);
    camera.Camera.matView(mainRenderPass.FrameSettings.MatView);
  }
}
