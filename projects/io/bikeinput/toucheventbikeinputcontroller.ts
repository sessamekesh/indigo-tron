import { BikeInputController } from './bikeinputcontroller';

interface TouchCoord {
  x: number,
};

const EDGE_SIZE = 0.25;

export class TouchEventBikeInputController extends BikeInputController {
  private currentTouches = new Map<number, TouchCoord>();
  private touchStartListener: (evt: TouchEvent)=>void;
  private touchMoveListener: (evt: TouchEvent)=>void;
  private touchEndListener: (evt: TouchEvent)=>void;

  constructor(private el: HTMLElement) {
    super();
    this.touchStartListener = (evt: TouchEvent) => {
      const touches = evt.changedTouches;
      for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const xPos = (touch.clientX - el.clientLeft) / el.clientWidth;
        this.currentTouches.set(touch.identifier, {x: xPos});
      }
      this.fireEvent('signalFire', {});
    };
    this.touchMoveListener = (evt: TouchEvent) => {
      const touches = evt.changedTouches;
      for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const touchEntry = this.currentTouches.get(touch.identifier);
        if (touchEntry) {
          touchEntry.x = (touch.clientX - el.clientLeft) / el.clientWidth;
        }
      }
    };
    this.touchEndListener = (evt: TouchEvent) => {
      const touches = evt.changedTouches;
      for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        this.currentTouches.delete(touch.identifier);
      }
    };

    el.addEventListener('touchstart', this.touchStartListener);
    el.addEventListener('touchmove', this.touchMoveListener);
    el.addEventListener('touchend', this.touchEndListener);
  }

  isFiring() {
    return this.currentTouches.size > 0;
  }

  turnDirection() {
    let rsl = 0;
    this.currentTouches.forEach((touchCoord) => {
      if (touchCoord.x < EDGE_SIZE) {
        rsl -= (EDGE_SIZE - touchCoord.x) / EDGE_SIZE;
      } else if (touchCoord.x > (1.0 - EDGE_SIZE)) {
        rsl += (touchCoord.x - (1.0 - EDGE_SIZE)) / EDGE_SIZE;
      }
    });

    return Math.min(1, Math.max(-1, rsl));
  }

  destroy() {
    this.el.removeEventListener('touchend', this.touchEndListener);
    this.el.removeEventListener('touchmove', this.touchMoveListener);
    this.el.removeEventListener('touchstart', this.touchStartListener);
    this.currentTouches.clear();
    super.destroy();
  }
}
