import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { CameraComponent } from "@libgamemodel/components/gameappuicomponents";
import { FreeMovementCameraComponent, RadialCameraComponent } from "./appcomponents";
import { MouseDragEvent } from '@io/mousestatemanager';
import { MouseEventsQueueComponent, KeyboardStateManagerComponent } from "@libgamemodel/utilities/ioeventsqueuecomponents";
import { Key } from "ts-key-enum";

export class EnvironmentEditorAppIOSystem extends ECSSystem {
  start() { return true; }

  update(ecs: ECSManager, msDt: number) {
    //
    // Keyboard updates...
    //
    this.applyKeyboardUpdatesToCamera(ecs, msDt / 1000);

    //
    // Mouse updates...
    //
    const mouseUpdatesComponent = ecs.getSingletonComponent(MouseEventsQueueComponent);
    const mouseUpdates = mouseUpdatesComponent?.MouseEvents || [];
    if (mouseUpdatesComponent) {
      mouseUpdatesComponent.MouseEvents = [];
    }

    for (let i = 0; i < mouseUpdates.length; i++) {
      const evt = mouseUpdates[i];
      switch (evt.type) {
        case 'mousedrag':
          this.mouseDragCamera(ecs, evt.event);
          break;
          // TODO (sessamekesh): Introduce the mouse wheel for the radial camera
      }
    }
  }

  private mouseDragCamera(ecs: ECSManager, evt: MouseDragEvent) {
    let cameraComponent = ecs.getSingletonComponent(CameraComponent);
    let freeCameraComponent = ecs.getSingletonComponent(FreeMovementCameraComponent);
    let radialCameraComponent = ecs.getSingletonComponent(RadialCameraComponent);

    if (cameraComponent && cameraComponent.Camera === freeCameraComponent?.Camera) {
      freeCameraComponent.Camera.spinRight(
        freeCameraComponent.RotSpeed * 2.5 * evt.dx / evt.areaWidth);
      freeCameraComponent.Camera.tiltUp(
        freeCameraComponent.RotSpeed * 2.5 * -evt.dy / evt.areaHeight);
    } else if (cameraComponent && cameraComponent.Camera === radialCameraComponent?.Camera) {
      radialCameraComponent.Camera.spinRight(
        radialCameraComponent.RotSpeed * 2.5 * -evt.dx / evt.areaWidth);
      radialCameraComponent.Camera.tiltUp(
        radialCameraComponent.RotSpeed * 2.5 * evt.dy / evt.areaHeight);
    }
  }

  private applyKeyboardUpdatesToCamera(ecs: ECSManager, dt: number) {
    const keyboard = ecs.getSingletonComponent(KeyboardStateManagerComponent)?.Keyboard;
    if (!keyboard) return;

    const freeMovementCameraComponent = ecs.getSingletonComponent(FreeMovementCameraComponent);
    const radialCameraComponent = ecs.getSingletonComponent(RadialCameraComponent);
    const activeCamera = ecs.getSingletonComponentOrThrow(CameraComponent)?.Camera;

    const wDown = keyboard.isKeyPressed('w');
    const aDown = keyboard.isKeyPressed('a');
    const sDown = keyboard.isKeyPressed('s');
    const dDown = keyboard.isKeyPressed('d');
    const pgUpPressed = keyboard.isKeyPressed(Key.PageUp);
    const pgDownPressed = keyboard.isKeyPressed(Key.PageDown);
    const leftArrowDown = keyboard.isKeyPressed(Key.ArrowLeft);
    const rightArrowDown = keyboard.isKeyPressed(Key.ArrowRight);
    const upArrowDown = keyboard.isKeyPressed(Key.ArrowUp);
    const downArrowDown = keyboard.isKeyPressed(Key.ArrowDown);

    if (activeCamera === freeMovementCameraComponent?.Camera) {
      let speed = freeMovementCameraComponent.Speed;
      if (keyboard.isKeyPressed(Key.Shift)) {
        speed *= 0.1;
      }
      if (keyboard.isKeyPressed(Key.Control)) {
        speed *= 10;
      }
      if (wDown && !sDown) {
        freeMovementCameraComponent.Camera.moveForward(dt * speed);
      }
      if (sDown && !wDown) {
        freeMovementCameraComponent.Camera.moveForward(dt * -speed);
      }
      if (aDown && !dDown) {
        freeMovementCameraComponent.Camera.moveRight(dt * -speed);
      }
      if (dDown && !aDown) {
        freeMovementCameraComponent.Camera.moveRight(dt * speed);
      }
      if (leftArrowDown && !rightArrowDown) {
        freeMovementCameraComponent.Camera.spinRight(dt * -freeMovementCameraComponent.RotSpeed);
      }
      if (rightArrowDown && !leftArrowDown) {
        freeMovementCameraComponent.Camera.spinRight(dt * freeMovementCameraComponent.RotSpeed);
      }
      if (upArrowDown && !downArrowDown) {
        freeMovementCameraComponent.Camera.tiltUp(dt * freeMovementCameraComponent.RotSpeed);
      }
      if (downArrowDown && !upArrowDown) {
        freeMovementCameraComponent.Camera.tiltUp(dt * -freeMovementCameraComponent.RotSpeed);
      }
    } else if (activeCamera === radialCameraComponent?.Camera) {
      let speed = radialCameraComponent.Speed;
      if (keyboard.isKeyPressed(Key.Shift)) {
        speed *= 0.1;
      }
      if (keyboard.isKeyPressed(Key.Control)) {
        speed *= 10;
      }
      if (wDown && !sDown) {
        radialCameraComponent.Camera.moveCenterForwardOnHorizontalPlane(dt * -speed);
      }
      if (sDown && !wDown) {
        radialCameraComponent.Camera.moveCenterForwardOnHorizontalPlane(dt * speed);
      }
      if (aDown && !dDown) {
        radialCameraComponent.Camera.moveCenterRightOnHorizontalPlane(dt * speed);
      }
      if (dDown && !aDown) {
        radialCameraComponent.Camera.moveCenterRightOnHorizontalPlane(dt * -speed);
      }
      if (leftArrowDown && !rightArrowDown) {
        radialCameraComponent.Camera.spinRight(dt * -radialCameraComponent.RotSpeed);
      }
      if (rightArrowDown && !leftArrowDown) {
        radialCameraComponent.Camera.spinRight(dt * radialCameraComponent.RotSpeed);
      }
      if (upArrowDown && !downArrowDown) {
        radialCameraComponent.Camera.tiltUp(dt * radialCameraComponent.RotSpeed);
      }
      if (downArrowDown && !upArrowDown) {
        radialCameraComponent.Camera.tiltUp(dt * -radialCameraComponent.RotSpeed);
      }
      if (pgUpPressed && !pgDownPressed) {
        radialCameraComponent.Camera.moveCenterUp(dt * speed);
      }
      if (pgDownPressed && !pgUpPressed) {
        radialCameraComponent.Camera.moveCenterUp(dt * -speed);
      }
    }
  }
}
