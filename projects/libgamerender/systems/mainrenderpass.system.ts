import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { MainRenderPassComponent } from '@libgamerender/components/mainrenderpass.component';
import { GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { LambertShaderComponent } from '@libgamerender/renderresourcesingletons/shadercomponents';

export class MainRenderPassSystem extends ECSSystem {
  start() {
    return true;
  }

  update(ecs: ECSManager, msDt: number) {
    const { gl } = ecs.getSingletonComponentOrThrow(GLContextComponent);
    const {
      LambertShader: lambertShader
    } = ecs.getSingletonComponentOrThrow(LambertShaderComponent);
    const mainRenderPass = ecs.getSingletonComponentOrThrow(MainRenderPassComponent);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.canvas.width = (gl.canvas as HTMLCanvasElement).clientWidth * window.devicePixelRatio;
    gl.canvas.height = (gl.canvas as HTMLCanvasElement).clientHeight * window.devicePixelRatio;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    if (mainRenderPass.LambertCalls.length > 0) {
      lambertShader.activate(gl);
    }
    for (let i = 0; i < mainRenderPass.LambertCalls.length; i++) {
      lambertShader.render2(gl, mainRenderPass.LambertCalls[i]);
    }
  }
}
