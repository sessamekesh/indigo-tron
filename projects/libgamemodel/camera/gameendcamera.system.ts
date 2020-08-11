import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager, MappedKlassObjType } from "@libecs/ecsmanager";
import { SceneModeUtil } from "@libgamemodel/scenemode/scenemodeutil";
import { Camera } from "./camera";
import { LerpCamera } from "./lerpcamera";
import { CameraComponent, ReflectionCameraComponent } from "@libgamemodel/components/gameappuicomponents";
import { RadialCamera } from "./radialcamera";
import { vec3, glMatrix } from "gl-matrix";
import { MathAllocatorsComponent } from "@libgamemodel/components/commoncomponents";
import { CameraRig5Component } from "./camerarig5.component";
import { LightcycleComponent3 } from "@libgamemodel/lightcycle3/lightcycle3.component";
import { MathUtils } from "@libutil/mathutils";

export class GameEndCameraRadialCameraPropertiesSingleton {
  constructor(public Radius: number, public RotationRate: number) {}

  static insert(ecs: ECSManager, radius: number, rotationRate: number) {
    let existing = ecs.getSingletonComponent(GameEndCameraRadialCameraPropertiesSingleton);
    if (!existing) {
      const e = ecs.createEntity();
      existing = e.addComponent(GameEndCameraRadialCameraPropertiesSingleton, radius, rotationRate);
      return;
    }
    existing.Radius = radius;
    existing.RotationRate = rotationRate;
  }
}

export class GameEndLerpCameraComponent {
  constructor(
    public OldCamera: Camera, public NextCamera: RadialCamera, public LerpCam: LerpCamera) {}
}

const SINGLETON_QUERY = {
  gameEndCameraSettings: GameEndCameraRadialCameraPropertiesSingleton,
  gameCamera: CameraComponent,
  reflectionCamera: ReflectionCameraComponent,
  allocators: MathAllocatorsComponent,
  rig: CameraRig5Component,
};

export class GameEndCameraSystem extends ECSSystem {
  start(ecs: ECSManager) {
    return this.expectSingletons(ecs, SINGLETON_QUERY, 'GameEndCameraSystem');
  }

  update(ecs: ECSManager, msDt: number) {
    if (!SceneModeUtil.isGameEnd(ecs)) return;

    ecs.withSingletons(SINGLETON_QUERY, (s) => {
      const lerpCamera = this.getGameEndLerpCamera(ecs, s);
      lerpCamera.LerpCam.tick(msDt / 1000);
      lerpCamera.NextCamera.spinRight(msDt / 1000 * s.gameEndCameraSettings.RotationRate);
    });
  }

  private getGameEndLerpCamera(
      ecs: ECSManager,
      s: MappedKlassObjType<typeof SINGLETON_QUERY>): GameEndLerpCameraComponent {
    let component = ecs.getSingletonComponent(GameEndLerpCameraComponent);
    if (!component) {
      const e = ecs.createEntity();
      const focusLightcycleComponent = s.rig.CarEntity.getComponent(LightcycleComponent3);
      const focusPoint = vec3.create();
      if (!focusLightcycleComponent) {
        console.warn('ERROR - could not get the focal lightcycle, guessing center of arena');
      } else {
        MathUtils.vec2ToVec3(focusPoint, focusLightcycleComponent.FrontWheelPosition.Value, 0.8);
      }

      const oldCamera = s.gameCamera.Camera;
      const oldReflectionCamera = s.reflectionCamera.ReflectionCamera;

      const newCamera = new RadialCamera(
        /* center */ focusPoint, // TODO (sessamekesh): Last player position
        /* radius */ s.gameEndCameraSettings.Radius,
        s.gameEndCameraSettings.Radius,
        s.gameEndCameraSettings.Radius,
        vec3.fromValues(0, 1, 0),
        vec3.fromValues(0, 0, 1),
        /* spin */ glMatrix.toRadian(45), /* tilt */ glMatrix.toRadian(22),
        s.allocators.Vec3, s.allocators.Quat);
      const lerpCamera = new LerpCamera(oldCamera, newCamera, /* lerpTime */ 2, s.allocators.Vec3);
      component = e.addComponent(GameEndLerpCameraComponent, oldCamera, newCamera, lerpCamera);
      oldReflectionCamera.setBaseCamera(lerpCamera);
      s.gameCamera.Camera = lerpCamera;
    }
    return component;
  }
}
