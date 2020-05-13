import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { ArenaFloorReflectionFramebufferComponent, GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { LightSettingsComponent } from '@libgamerender/components/lightsettings.component';
import { CameraComponent, ReflectionCameraComponent } from '@libgamemodel/components/gameappuicomponents';
import { LambertShaderComponent, ArenaFloorShaderComponent, ArenaWallShaderComponent } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { WallComponent2 } from '@libgamemodel/wall/wallcomponent';
import { LambertRenderableComponent } from '@libgamerender/components/lambertrenderable.component';
import { MathAllocatorsComponent } from '@libgamemodel/components/commoncomponents';
import { mat4, glMatrix, vec2 } from 'gl-matrix';
import { LambertRenderableUtil } from '@libgamerender/utils/lambertrenderable.util';
import { LightcycleRenderableTag } from './lightcycle.lambertsystem';
import { Framebuffer } from '@librender/texture/framebuffer';
import { ArenaFloorRenderableUtil } from '@libgamerender/utils/arenafloorrenderable.util';
import { FloorComponent } from '@libgamemodel/components/floor.component';
import { ArenaWallTexturePackComponent, ArenaWallUnitGeoComponent } from '@libgamerender/components/arenawallrenderable.component';
import { ArenaWallRenderableUtil } from '@libgamerender/utils/arenawallrenderable.util';
import { ArenaWallComponent } from '@libgamemodel/arena/arenawall.component';
import { DebugRenderTag } from '@libgamemodel/debug/debugrendertag';

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
      ArenaWallShader: arenaWallShader,
    } = ecs.getSingletonComponentOrThrow(ArenaWallShaderComponent);
    const {
      Vec2: vec2Allocator,
      Mat4: mat4Allocator,
    } = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent);
    const ArenaWallTexturePack = ecs.getSingletonComponentOrThrow(ArenaWallTexturePackComponent);
    const ArenaWallUnitGeo = ecs.getSingletonComponentOrThrow(ArenaWallUnitGeoComponent);

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

      ArenaWallRenderableUtil.renderEntitiesMatchingTags(
        gl, ecs, arenaWallShader,
        [
          ArenaWallComponent,
        ],
        ArenaWallUnitGeo.Geo,
        ArenaWallTexturePack,
        matView,
        matProj);
    });

    //
    // Main render pass
    //
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.canvas.width = (gl.canvas as HTMLCanvasElement).clientWidth * window.devicePixelRatio;
    gl.canvas.height = (gl.canvas as HTMLCanvasElement).clientHeight * window.devicePixelRatio;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.05, 0.05, 0.05, 1);
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
            DebugRenderTag, // TODO (sessamekesh): Put this behind a build flag
          ],
          lightSettings, matView, matProj);

        ArenaFloorRenderableUtil.renderEntitiesMatchingTags(
          gl, ecs, arenaFloorShader,
          [
            FloorComponent,
          ],
          lightSettings, matView, matProj, viewportDimensions);

        ArenaWallRenderableUtil.renderEntitiesMatchingTags(
          gl, ecs, arenaWallShader,
          [
            ArenaWallComponent,
          ],
          ArenaWallUnitGeo.Geo,
          ArenaWallTexturePack,
          matView,
          matProj);
      });
    });
  }
}
