import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { ArenaFloorReflectionFramebufferComponent, GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { LightSettingsComponent } from '@libgamerender/components/lightsettings.component';
import { CameraComponent, ReflectionCameraComponent } from '@libgamemodel/components/gameappuicomponents';
import { LambertShaderComponent, ArenaWallShaderComponent, ArenaFloor2ShaderComponent } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { WallComponent2 } from '@libgamemodel/wall/wallcomponent';
import { MathAllocatorsComponent } from '@libgamemodel/components/commoncomponents';
import { mat4, glMatrix, vec2 } from 'gl-matrix';
import { LambertRenderableUtil } from '@libgamerender/utils/lambertrenderable.util';
import { ArenaFloorRenderableUtil } from '@libgamerender/utils/arenafloorrenderable.util';
import { FloorComponent } from '@libgamemodel/components/floor.component';
import { ArenaWallTexturePackComponent, ArenaWallUnitGeoComponent } from '@libgamerender/components/arenawallrenderable.component';
import { ArenaWallRenderableUtil } from '@libgamerender/utils/arenawallrenderable.util';
import { ArenaWallComponent } from '@libgamemodel/arena/arenawall.component';
import { DebugRenderTag } from '@libgamemodel/debug/debugrendertag';
import { Solid2DRenderableUtil } from '@libgamerender/utils/solid2drenderable.util';
import { MinimapComponent } from '@libgamerender/hud/minimap.component';
import { LambertRenderGroupSingleton } from '@libgamerender/components/lambertrendergroup.singleton';
import { LightcycleRenderableTag } from '@libgamerender/lightcycle/lightcycle2.rendercomponent';
import { ArenaFloor2RenderGroupComponent } from '@libgamerender/arena/arenafloor2.rendergroupcomponent';

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
      ArenaFloor2Shader: arenaFloor2Shader,
    } = ecs.getSingletonComponentOrThrow(ArenaFloor2ShaderComponent);
    const {
      ArenaWallShader: arenaWallShader,
    } = ecs.getSingletonComponentOrThrow(ArenaWallShaderComponent);
    const {
      Vec2: vec2Allocator,
      Mat4: mat4Allocator,
      Vec3: vec3Allocator,
    } = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent);
    const ArenaWallTexturePack = ecs.getSingletonComponentOrThrow(ArenaWallTexturePackComponent);
    const ArenaWallUnitGeo = ecs.getSingletonComponentOrThrow(ArenaWallUnitGeoComponent);
    const { LambertRenderGroup } = ecs.getSingletonComponentOrThrow(LambertRenderGroupSingleton);
    const {
      RenderGroup: arenaFloor2RenderGroup,
    } = ecs.getSingletonComponentOrThrow(ArenaFloor2RenderGroupComponent);

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

      LambertRenderableUtil.renderEntitiesMatchingTags2(
        gl,
        LambertRenderGroup,
        lambertShader,
        [[LightcycleRenderableTag], [WallComponent2]],
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
      vec3Allocator.get(1, eyePos => {
        vec2Allocator.get(1, (viewportDimensions) => {
          vec2.set(viewportDimensions, gl.canvas.width, gl.canvas.height);
          mainCamera.matView(matView);
          mat4.perspective(
            matProj, glMatrix.toRadian(45), gl.canvas.width / gl.canvas.height, 0.1, 1000.0);

          LambertRenderableUtil.renderEntitiesMatchingTags2(
            gl,
            LambertRenderGroup,
            lambertShader,
            [[LightcycleRenderableTag], [DebugRenderTag], [WallComponent2]],
            lightSettings, matView, matProj);

          ArenaFloorRenderableUtil.renderEntitiesMatchingTags2(
            gl, arenaFloor2Shader, arenaFloor2RenderGroup,
            [[FloorComponent]], lightSettings, matView, matProj, viewportDimensions);

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
    });

    //
    // Minimap rendering
    //
    gl.clear(gl.DEPTH_BUFFER_BIT);
    Solid2DRenderableUtil.renderEntitiesMatchingTags(ecs, [MinimapComponent]);

    // TODO (sessamekesh): Continue here
    // You'll need to draw the circle on the screen, according to configuration given as part of the
    // main system - draw a flat circle in (0.0, 1.0) space. Stencil buffer against it here too.
    // The rest of things can reasonably be drawn with some sort of camera bound - which is defined
    // in 2d world space, the dimensions covered by the minimap - against that stencil.
    // So, drawing that gray circle is the next step! Do that. Do that do that do that do that.

    // After that, you'll need to set up the minimap rendering in the render system - you'll have
    //  to render to a specific area of the screen, and only entities that are in a certain range.
    // You'll want to use a stencil mask to make sure you only render to the affected area?
    // You'll also want to render a blank polygon in that area of a greyish color?
    // You'll also want to render a ring around the minimap to distinguish it on the screen?
  }
}
