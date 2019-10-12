import { BikeInputController } from './bikeinputcontroller';
import { KeyboardManager, KeyEvent } from '@io/keyboardmanager';
import { Key } from 'ts-key-enum';

export class KeyboardBikeInputController extends BikeInputController {
  private keyDownCallback: (ke: KeyEvent) => void;

  constructor(private readonly keyboardManager: KeyboardManager) {
    super();
    this.keyDownCallback = this.keyboardManager.addListener('keydown', () => {
      this.fireEvent('signalFire', {});
    });
  }

  isFiring() {
    return this.keyboardManager.isKeyDown(" ") || this.keyboardManager.isKeyDown(Key.ArrowUp);
  }

  turnDirection() {
    let rsl = 0;
    if (this.keyboardManager.isKeyDown("a") || this.keyboardManager.isKeyDown(Key.ArrowLeft)) {
      rsl -= 1;
    }

    if (this.keyboardManager.isKeyDown("d") || this.keyboardManager.isKeyDown(Key.ArrowRight)) {
      rsl += 1;
    }

    return rsl;
  }

  destroy() {
    this.keyboardManager.removeListener('keydown', this.keyDownCallback);
    super.destroy();
  }
}
