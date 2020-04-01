import { EventManager } from '@libutil/eventmanager';

export type KeyEvent = { key: string };

interface KeyboardEvents {
  'keydown': KeyEvent,
  'keyup': KeyEvent,
  'keypress': KeyEvent,
};

export class KeyboardStateManager extends EventManager<KeyboardEvents> {
  private pressedKeys = new Set<string>();
  private lastDownKey: string|null = null;

  onKeyDown(key: string) {
    this.pressedKeys.add(key);
    this.lastDownKey = key;
    this.fireEvent('keydown', {key});
  }

  onKeyUp(key: string) {
    this.pressedKeys.delete(key);
    this.fireEvent('keyup', {key});
    if (this.lastDownKey === key) {
      this.fireEvent('keypress', {key});
    }
    this.lastDownKey = null;
  }

  isKeyPressed(key: string) {
    return this.pressedKeys.has(key);
  }

  reset() {
    this.pressedKeys.clear();
  }
}
