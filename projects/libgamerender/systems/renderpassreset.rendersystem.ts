import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { MainRenderPassComponent, FloorReflectionRenderPassComponent } from '@libgamerender/components/mainrenderpass.component';
import { vec3, mat4, glMatrix } from 'gl-matrix';
import { CameraComponent, ReflectionCameraComponent } from '@libgamemodel/components/gameappuicomponents';
import { GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { LambertRenderCall2 } from '@librender/shader/lambertshader';
import { ArenaFloorRenderCall2 } from '@librender/shader/arenafloorshader';

export class RenderPassResetSystem extends ECSSystem {
  start(ecs: ECSManager) {
    const renderPassEntity = ecs.createEntity();
    renderPassEntity.addComponent(MainRenderPassComponent, [], [], {
      AmbientCoefficient: 0.3,
      LightColor: vec3.fromValues(1, 1, 1),
      LightDirection: vec3.fromValues(0, -1, 0),
      MatProj: mat4.create(),
      MatView: mat4.create(),
    });
    renderPassEntity.addComponent(FloorReflectionRenderPassComponent, [], {
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
    const floorReflectionPass = ecs.getSingletonComponentOrThrow(
        FloorReflectionRenderPassComponent);
    const camera = ecs.getSingletonComponentOrThrow(CameraComponent);
    const {gl} = ecs.getSingletonComponentOrThrow(GLContextComponent);

    if (mainRenderPass) {
      this.clearLambertCalls(mainRenderPass.LambertCalls);
      mainRenderPass.LambertCalls = [];
      this.clearArenaFloorCalls(mainRenderPass.FloorReflectionCalls);
      mainRenderPass.FloorReflectionCalls = [];
      mat4.perspective(
        mainRenderPass.FrameSettings.MatProj,
        glMatrix.toRadian(45),
        gl.canvas.width / gl.canvas.height,
        0.1,
        1000.0);
      camera.Camera.matView(mainRenderPass.FrameSettings.MatView);
    }

    if (floorReflectionPass) {
      const { ReflectionCamera } = ecs.getSingletonComponentOrThrow(ReflectionCameraComponent);
      this.clearLambertCalls(floorReflectionPass.LambertCalls);
      floorReflectionPass.LambertCalls = [];
      mat4.perspective(
        floorReflectionPass.FrameSettings.MatProj,
        glMatrix.toRadian(45),
        gl.canvas.width / gl.canvas.height,
        0.1, 1000.0);
      ReflectionCamera.matView(floorReflectionPass.FrameSettings.MatView);
    }
  }

  private clearLambertCalls(calls: LambertRenderCall2[]) {
    for (let i = 0; i < calls.length; i++) {
      calls[i].MatWorld.ReleaseFn();
    }
  }

  private clearArenaFloorCalls(calls: ArenaFloorRenderCall2[]) {
    for (let i = 0; i < calls.length; i++) {
      calls[i].ViewportSize.ReleaseFn();
      calls[i].MatWorld.ReleaseFn();
    }
  }
}
