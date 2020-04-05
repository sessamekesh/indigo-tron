import { EventManager } from '@libutil/eventmanager';

export type MousePointEvent = {
  x: number, y: number,
  areaWidth: number, areaHeight: number,
};
export type MouseDragEvent = {
  startX: number, startY: number,
  x: number, y: number,
  dx: number, dy: number,
  areaWidth: number, areaHeight: number,
};
export type MouseMoveEvent = {
  x: number, y: number,
  dx: number, dy: number,
  areaWidth: number, areaHeight: number,
};
export type MouseWheelEvent = {
  scrollAmount: number,
  x: number, y: number,
  areaWidth: number, areaHeight: number,
};

export interface MouseEvents {
  /** Fired when the primary mouse key (left for right handed person) is pressed */
  'mousedown': MousePointEvent,
  /** Fired when the primary mouse key (left for right handed person) is released */
  'mouseup': MousePointEvent,
  /** Fired when the mouse moves */
  'mousemove': MouseMoveEvent,
  /** Fired when the the mouse is moved with the primary key down */
  'mousedrag': MouseDragEvent,
  /** Fired when the mouse wheel is scrolled */
  'mousewheel': MouseWheelEvent,
};

export type MouseEvent = {
  type: 'mousedown',
  event: MousePointEvent,
} | {
  type: 'mouseup',
  event: MousePointEvent,
} | {
  type: 'mousemove',
  event: MouseMoveEvent,
} | {
  type: 'mousedrag',
  event: MouseDragEvent,
} | {
  type: 'mousewheel',
  event: MouseWheelEvent,
};

/**
 * Handling of mouse state. Notice: Events are separated into primary, secondary, and scroll. Mouse
 *  down and up events have to do with primary mouse button, secondary down/up with secondary, etc.
 * Drag events
 */
export class MouseStateManager extends EventManager<MouseEvents> {
  private primaryButtonDownAt_: {x: number, y: number}|null = null;
  private lastMousePos_: {x: number, y: number, areaWidth: number, areaHeight: number}|null = null;

  onLeaveFocus() {
    this.lastMousePos_ = null;
    this.primaryButtonDownAt_ = null;
  }

  onMouseMove(x: number, y: number, areaWidth: number, areaHeight: number) {
    if (!this.lastMousePos_) {
      this.lastMousePos_ = {x, y, areaWidth, areaHeight};
      return;
    }

    if (this.primaryButtonDownAt_) {
      this.fireEvent('mousedrag', {
        areaHeight, areaWidth,
        x, y,
        dx: x - this.lastMousePos_.x, dy: y - this.lastMousePos_.y,
        startX: this.primaryButtonDownAt_.x,
        startY: this.primaryButtonDownAt_.y,
      });
    } else {
      this.fireEvent('mousemove', {
        areaHeight, areaWidth,
        x, y,
        dx: x - this.lastMousePos_.x, dy: y - this.lastMousePos_.y,
      });
    }
    this.lastMousePos_ = {x, y, areaWidth, areaHeight};
  }

  onPrimaryButtonDown(x: number, y: number, areaWidth: number, areaHeight: number) {
    this.primaryButtonDownAt_ = {x, y};
    this.fireEvent('mousedown', {x, y, areaWidth, areaHeight});
  }

  onPrimaryButtonUp(x: number, y: number, areaWidth: number, areaHeight: number) {
    if (!this.primaryButtonDownAt_) return;

    this.primaryButtonDownAt_ = null;
    this.fireEvent('mouseup', {x, y, areaWidth, areaHeight});
  }

  onMouseWheel(scrollAmount: number, x: number, y: number, areaWidth: number, areaHeight: number) {
    this.fireEvent('mousewheel', {scrollAmount, x, y, areaWidth, areaHeight});
  }

  getMousePosition(): {x: number, y: number, areaWidth: number, areaHeight: number}|null {
    return this.lastMousePos_ && {...this.lastMousePos_};
  }

  isPrimaryButtonDown() {
    return !!this.primaryButtonDownAt_;
  }
}
