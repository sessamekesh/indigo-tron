import { BikeInputController } from './bikeinputcontroller';

export class GamepadBikeInputController extends BikeInputController {
  private connectionOrder_: number[] = [];
  private lastVal_ = 0;

  static canUse(nav: Navigator) {
    return nav['getGamepads'] != null;
  }

  private onConnectCb: (evt: GamepadEvent)=>void;
  private onRemoveCb: (evt: GamepadEvent)=>void;
  constructor(
      private readonly window: Window,
      private readonly navigator: Navigator) {
    super();

    this.onConnectCb = (evt) => {
      if (evt.gamepad.axes.length >= 1) {
        this.connectionOrder_.push(evt.gamepad.index);
      }
      // TODO (sessamekesh): Fire this also when a button is pressed / axis is adjusted (check every frame)
      this.fireEvent('signalFire', {});
    };
    this.onRemoveCb = (evt) => {
      this.connectionOrder_ = this.connectionOrder_.filter(_=>_!==evt.gamepad.index);
    };
    (this.window as any).addEventListener('gamepadconnected', this.onConnectCb);
    (this.window as any).addEventListener('gamepaddisconnected', this.onRemoveCb);
  }

  turnDirection() {
    if (this.connectionOrder_.length === 0) { return 0; }

    let gamepad: Gamepad|null = null;
    for (let i = 0; i < this.connectionOrder_.length && !gamepad; i++) {
      gamepad = this.navigator.getGamepads()[this.connectionOrder_[i]];
    }

    if (!gamepad) { return 0; }
    return gamepad.axes[0];
  }

  destroy() {
    (this.window as any).removeEventListener('gamepadconnected', this.onConnectCb);
    (this.window as any).removeEventListener('gamepaddisconnected', this.onRemoveCb);
  }
}
