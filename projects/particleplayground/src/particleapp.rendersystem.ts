import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { ParticleShaderComponent } from "./particleshader";
import { GLContextComponent, CameraComponent, ParticleGeoComponent, ParticleTexturesComponent } from "./components";
import { mat4, glMatrix } from "gl-matrix";
import { ParticleComponent } from "./particleupdater.system";

export class ParticleAppRenderSystem extends ECSSystem {
  start() { return true; }

  update(ecs: ECSManager, msDt: number) {
    const singletonQuery = {
      particleShader: ParticleShaderComponent,
      gl: GLContextComponent,
      camera: CameraComponent,
      particleGeo: ParticleGeoComponent,
      particleTextures: ParticleTexturesComponent,
    };

    const missingSingletons = ecs.withSingletons(singletonQuery, (s) => {
      const {gl, MatProj: matProj, MatView: matView} = s.gl;

      gl.canvas.width = (gl.canvas as HTMLCanvasElement).clientWidth * devicePixelRatio;
      gl.canvas.height = (gl.canvas as HTMLCanvasElement).clientHeight * devicePixelRatio;

      mat4.perspective(
        matProj, glMatrix.toRadian(45), gl.canvas.width / gl.canvas.height, 0.1, 100);

      s.camera.Camera.matView(matView);

      gl.clearColor(0.2, 0.2, 0.3, 1.0);
      gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.blendEquation(gl.FUNC_ADD);

      const shader = s.particleShader.Shader;
      shader.activate(gl);
      ecs.iterateComponents2({}, {ParticleComponent}, (e, _, c) => {
        shader.render(gl, {
          geo: s.particleGeo.Geo,
          matProj, matView,
          matWorld: c.ParticleComponent.MatWorld,
          tex1: s.particleTextures.Tex1,
          tex2: s.particleTextures.Tex2,
          tex3: s.particleTextures.Tex3,
          uvOffset1: c.ParticleComponent.Tex1Offset,
          uvOffset2: c.ParticleComponent.Tex2Offset,
          uvOffset3: c.ParticleComponent.Tex3Offset,
          uvScale1: s.particleTextures.Scale1,
          uvScale2: s.particleTextures.Scale2,
          uvScale3: s.particleTextures.Scale3,
        });
      });
    });

    if (missingSingletons.length > 0) {
      throw new Error(`ParticleAppRenderSystem failed - missing ${missingSingletons.join(',')}`);
    }
  }
}
