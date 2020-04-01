import { EventManager } from '@libutil/eventmanager';

export type KeyEvent = { key: string };

interface KeyboardEvents {
  'keydown': KeyEvent,
  'keyup': KeyEvent,
  'keypress': KeyEvent,
};

export class KeyboardManager extends EventManager<KeyboardEvents> {
  private pressedKeys = new Set<string>();

  private keyDownListener: (ke: KeyboardEvent)=>void;
  private keyUpListener: (ke: KeyboardEvent)=>void;
  private lastDownKey: string|null = null;

  constructor(private keyListenerElement: HTMLElement) {
    super();

    this.keyDownListener = (ke) => {
      this.fireEvent('keydown', {key: ke.key});
      this.pressedKeys.add(ke.key);
      this.lastDownKey = ke.key;
    };
    this.keyUpListener = (ke) => {
      this.fireEvent('keyup', {key: ke.key});
      this.pressedKeys.delete(ke.key);
      if (this.lastDownKey === ke.key) {
        this.fireEvent('keypress', {key: ke.key});
      }
      this.lastDownKey = null;
    };

    keyListenerElement.addEventListener('keydown', this.keyDownListener);
    keyListenerElement.addEventListener('keyup', this.keyUpListener);
  }

  destroy() {
    this.keyListenerElement.removeEventListener('keydown', this.keyDownListener);
    this.keyListenerElement.removeEventListener('keyup', this.keyUpListener);
    super.destroy();
  }

  isKeyDown(key: string) {
    return this.pressedKeys.has(key);
  }
}
