import { ECSManager } from '@libecs/ecsmanager';
import { vec2 } from 'gl-matrix';

export class HudViewportSingleton {
  constructor(
    public ViewportWidthPx: number,
    public ViewportHeightPx: number,
    public ViewportDimensionsVec: vec2) {}

  static attach(ecs: ECSManager) {
    const s = ecs.createEntity();
    s.addComponent(HudViewportSingleton, 1, 1, vec2.fromValues(1, 1));
  }
}
