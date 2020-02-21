import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { ArenaFloorReflectionFramebufferComponent, GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { LightSettingsComponent } from '@libgamerender/components/lightsettings.component';
import { CameraComponent, ReflectionCameraComponent } from '@libgamemodel/components/gameappuicomponents';
import { LambertShaderComponent, ArenaFloorShaderComponent } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { WallComponent2 } from '@libgamemodel/wall/wallcomponent';
import { LambertRenderableComponent } from '@libgamerender/components/lambertrenderable.component';
import { MathAllocatorsComponent } from '@libgamemodel/components/commoncomponents';
import { mat4, glMatrix, vec2 } from 'gl-matrix';
import { LambertRenderableUtil } from '@libgamerender/utils/lambertrenderable.util';
import { LightcycleRenderableTag } from './lightcycle.lambertsystem';
import { Framebuffer } from '@librender/texture/framebuffer';
import { ArenaFloorRenderableUtil } from '@libgamerender/utils/arenafloorrenderable.util';
import { FloorComponent } from '@libgamemodel/components/floor.component';

// TODO (sessamekesh): Move all the framebuffer, render object, etc. creation here, eh?

export class GameAppRenderSystem extends ECSSystem {
  start() { return true; }

  update(ecs: ECSManager) {
    const { gl } = ecs.getSingletonComponentOrThrow(GLContextComponent);
    // TODO (sessamekesh): Create this in system initialization instead, eh?
    const { FBO: floorReflectionFramebuffer } = ecs.getSingletonComponentOrThrow(
      ArenaFloorReflectionFramebufferComponent);
    const lightSettings = ecs.getSingletonComponentOrThrow(LightSettingsComponent);
    const {
      Camera: mainCamera,
    } = ecs.getSingletonComponentOrThrow(CameraComponent);
    const {
      ReflectionCamera: reflectionCamera,
    } = ecs.getSingletonComponentOrThrow(ReflectionCameraComponent);
    const {
      LambertShader: lambertShader
    } = ecs.getSingletonComponentOrThrow(LambertShaderComponent);
    const {
      ArenaFloorShader: arenaFloorShader,
    } = ecs.getSingletonComponentOrThrow(ArenaFloorShaderComponent);
    const {
      Vec2: vec2Allocator,
      Mat4: mat4Allocator,
    } = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent);

    //
    // Generate floor reflection texture
    //
    floorReflectionFramebuffer.bind(gl);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    mat4Allocator.get(2, (matView, matProj) => {
      reflectionCamera.matView(matView);
      mat4.perspective(
        matProj, glMatrix.toRadian(45), gl.canvas.width / gl.canvas.height, 0.1, 1000.0);

      LambertRenderableUtil.renderEntitiesMatchingTags(
        gl, ecs, lambertShader,
        [
          WallComponent2,
          LightcycleRenderableTag,
        ],
        lightSettings, matView, matProj);
    });

    //
    // Main render pass
    //
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.canvas.width = (gl.canvas as HTMLCanvasElement).clientWidth * window.devicePixelRatio;
    gl.canvas.height = (gl.canvas as HTMLCanvasElement).clientHeight * window.devicePixelRatio;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0.65, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    mat4Allocator.get(2, (matView, matProj) => {
      vec2Allocator.get(1, (viewportDimensions) => {
        vec2.set(viewportDimensions, gl.canvas.width, gl.canvas.height);
        mainCamera.matView(matView);
        mat4.perspective(
          matProj, glMatrix.toRadian(45), gl.canvas.width / gl.canvas.height, 0.1, 1000.0);

        LambertRenderableUtil.renderEntitiesMatchingTags(
          gl, ecs, lambertShader,
          [
            WallComponent2,
            LightcycleRenderableTag,
          ],
          lightSettings, matView, matProj);

        ArenaFloorRenderableUtil.renderEntitiesMatchingTags(
          gl, ecs, arenaFloorShader,
          [
            FloorComponent,
          ],
          lightSettings, matView, matProj, viewportDimensions);
      });
    });
  }
}
