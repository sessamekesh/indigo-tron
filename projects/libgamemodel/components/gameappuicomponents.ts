import { KeyboardManager } from '@io/keyboardmanager';
import { KeyboardBikeInputController } from '@io/bikeinput/keyboardbikeinputcontroller';
import { TouchEventBikeInputController } from '@io/bikeinput/toucheventbikeinputcontroller';
import { GamepadBikeInputController } from '@io/bikeinput/gamepadbikeinputcontroller';
import { BikeInputManager } from '@io/bikeinput/bikeinputmanager';
import { BasicCamera } from '@libgamemodel/camera/basiccamera';
import { ReflectionCamera } from '@libgamemodel/camera/reflectioncamera';

export class KeyboardManagerComponent {
  constructor(public KeyboardManager: KeyboardManager) {}
}

export class KeyboardBikeInputControllerComponent {
  constructor(public KeyboardBikeInputController: KeyboardBikeInputController) {}
}

export class TouchEventBikeInputControllerComponent {
  constructor(public TouchEventBikeInputController: TouchEventBikeInputController) {}
}

export class GamepadBikeInputControllerComponent {
  constructor(public GamepadBikeInputController: GamepadBikeInputController) {}
}

export class BikeInputManagerComponent {
  constructor(public BikeInputManager: BikeInputManager) {}
}

export class CameraComponent {
  constructor(public Camera: BasicCamera) {}
}

export class ReflectionCameraComponent {
  constructor(public ReflectionCamera: ReflectionCamera) {}
}
