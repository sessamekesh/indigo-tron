import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";

export class GLContextComponent {
  constructor(public readonly gl: WebGL2RenderingContext) {}
}

export class AppRenderSystem extends ECSSystem {
  start() { return true; }

  update(ecs: ECSManager, msDt: number) {
    const singletonQuery = {glComponent: GLContextComponent};
    ecs.withSingletons(singletonQuery, ({glComponent: {gl}}) => {
      gl.clearColor(0.2, 0.2, 0.4, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    });
  }
}
