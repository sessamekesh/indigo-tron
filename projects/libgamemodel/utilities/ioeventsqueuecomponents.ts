import { MouseEvent, MouseStateManager } from '@io/mousestatemanager';
import { KeyboardStateManager } from '@io/keyboardstatemanager';
import { DestructorGroup } from '@libutil/destructorgroup';

export class DestructorGroupComponent {
  constructor(public DestructorGroup: DestructorGroup) {}
}

export class MouseManagerComponent {
  constructor(public Mouse: MouseStateManager) {}
}

export class KeyboardStateManagerComponent {
  constructor(public Keyboard: KeyboardStateManager) {}
}

export class MouseEventsQueueComponent {
  constructor(public MouseEvents: MouseEvent[]) {}
}
