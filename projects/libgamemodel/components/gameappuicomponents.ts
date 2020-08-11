import { KeyboardManager } from '@io/keyboardmanager';
import { KeyboardBikeInputController } from '@io/bikeinput/keyboardbikeinputcontroller';
import { TouchEventBikeInputController } from '@io/bikeinput/toucheventbikeinputcontroller';
import { GamepadBikeInputController } from '@io/bikeinput/gamepadbikeinputcontroller';
import { BikeInputManager } from '@io/bikeinput/bikeinputmanager';
import { ReflectionCamera } from '@libgamemodel/camera/reflectioncamera';
import { Camera } from '@libgamemodel/camera/camera';

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
  constructor(public Camera: Camera) {}
}

// TODO (sessamekesh): Reflection camera should not take a reference to the main camera, but should
//  instead query the ECS manager. This is because we may swap out the main camera!
export class ReflectionCameraComponent {
  constructor(public ReflectionCamera: ReflectionCamera) {}
}
