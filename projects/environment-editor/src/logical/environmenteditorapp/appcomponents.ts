import { FreeMovementCamera } from "@libgamemodel/camera/freemovementcamera";
import { RadialCamera } from '@libgamemodel/camera/radialcamera';

export class FreeMovementCameraComponent {
  constructor(public Camera: FreeMovementCamera, public Speed: number, public RotSpeed: number) {}
}

export class RadialCameraComponent {
  constructor(public Camera: RadialCamera, public Speed: number, public RotSpeed: number) {}
}
