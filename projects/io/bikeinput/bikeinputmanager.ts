import { BikeInputController } from './bikeinputcontroller';

/**
 * Holds a collection of potentially valid input systems. Whenever an input
 *  system fires an event, that input system becomes the active controller.
 * There could probably be better logic, but for now this will do!
 */
export class BikeInputManager extends BikeInputController {
  private controllers: BikeInputController[] = [];
  private listeners = new Map<BikeInputController, (cb: {})=>void>();

  private activeController: BikeInputController|null = null;

  addController(controller: BikeInputController) {
    this.controllers.push(controller);
    this.listeners.set(controller, controller.addListener('signalFire', () => {
      this.activeController = controller;
    }));
  }

  removeController(controller: BikeInputController) {
    this.controllers = this.controllers.filter(_=>_!==controller);
    const listener = this.listeners.get(controller);
    if (listener) {
      controller.removeListener('signalFire', listener);
    }
    this.listeners.delete(controller);
    if (this.activeController === controller) {
      this.activeController = null;
    }
  }

  turnDirection() {
    if (!this.activeController) {
      return 0;
    }
    return this.activeController.turnDirection();
  }

  destroy() {
    while (this.controllers.length > 0) {
      this.removeController(this.controllers[0]);
    }
  }
}
