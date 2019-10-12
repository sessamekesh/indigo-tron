import { EventManager } from '@libutil/eventmanager';

interface ControllerEventMap {
  "signalFire": {},
};

export abstract class BikeInputController extends EventManager<ControllerEventMap> {
  abstract turnDirection(): number; // -1 for left, 0 for straight, 1 for right
}
