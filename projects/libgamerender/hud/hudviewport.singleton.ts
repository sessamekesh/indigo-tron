import { ECSManager } from '@libecs/ecsmanager';

export class HudViewportSingleton {
  constructor(
    public ViewportWidthPx: number,
    public ViewportHeightPx: number) {}

  static attach(ecs: ECSManager) {
    const s = ecs.createEntity();
    s.addComponent(HudViewportSingleton, 1, 1);
  }
}
