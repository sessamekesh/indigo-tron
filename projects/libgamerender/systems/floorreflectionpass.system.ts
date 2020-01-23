import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { GLContextComponent, ArenaFloorReflectionFramebufferComponent } from '@libgamerender/components/renderresourcecomponents';
import { LambertShaderComponent } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { FloorReflectionRenderPassComponent } from '@libgamerender/components/mainrenderpass.component';

export class FloorReflectionPassSystem extends ECSSystem {
  start() {
    return true;
  }

  update(ecs: ECSManager, msDt: number) {
    const { gl } = ecs.getSingletonComponentOrThrow(GLContextComponent);
    const {
      LambertShader: lambertShader
    } = ecs.getSingletonComponentOrThrow(LambertShaderComponent);
    const floorReflectionPass = ecs.getSingletonComponentOrThrow(
      FloorReflectionRenderPassComponent);
    const { FBO: floorReflectionFramebuffer } = ecs.getSingletonComponentOrThrow(
      ArenaFloorReflectionFramebufferComponent);

    // Render to floor texture...
    floorReflectionFramebuffer.bind(gl);
    gl.clearColor(1, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    if (floorReflectionPass.LambertCalls.length > 0) {
      lambertShader.activate(gl);
    }
    for (let i = 0; i < floorReflectionPass.LambertCalls.length; i++) {
      lambertShader.render2(
        gl, floorReflectionPass.LambertCalls[i], floorReflectionPass.FrameSettings);
    }
  }
}
