import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { HudViewportSingleton } from './hudviewport.singleton';

export class HudConfigUpdateSystem extends ECSSystem {
  start() { return true; }

  update(ecs: ECSManager, msDt: number) {
    const glSingleton = ecs.getSingletonComponent(GLContextComponent);
    const hudViewportSingleton = ecs.getSingletonComponent(HudViewportSingleton);

    if (!glSingleton || !hudViewportSingleton) return;

    hudViewportSingleton.ViewportHeightPx = glSingleton.gl.canvas.height;
    hudViewportSingleton.ViewportWidthPx = glSingleton.gl.canvas.width;
  }
}
