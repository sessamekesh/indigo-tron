import { BikeInputController } from '@io/bikeinput/bikeinputcontroller';

export class FakeBikeInputController extends BikeInputController {
  Direction: number = 0;

  turnDirection() { return this.Direction; }
}
