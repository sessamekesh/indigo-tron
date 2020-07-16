import { ECSManager } from "@libecs/ecsmanager";
import { GLContextComponent, AppRenderSystem } from "./apprendersystem";

export class AppService {
  private frameHandle: number|null = null;
  private constructor(private gl: WebGL2RenderingContext, private ecs: ECSManager) {}

  static async create(gl: WebGL2RenderingContext): Promise<AppService> {
    const ecs = new ECSManager();

    const singletonEntity = ecs.createEntity();
    singletonEntity.addComponent(GLContextComponent, gl);

    ecs.addSystem2(AppRenderSystem);

    return new AppService(gl, ecs);
  }

  start() {
    if (!this.ecs.start()) return false;

    let lastFrameTime = performance.now();
    const frame = () => {
      const thisFrame = performance.now();
      const msDt = (thisFrame - lastFrameTime);
      lastFrameTime = thisFrame;

      this.ecs.update(1000 / 60);

      this.frameHandle = requestAnimationFrame(frame);
    };
    this.frameHandle = requestAnimationFrame(frame);
  }
}
