import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { ArenaFloorReflectionFramebufferComponent, GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { LightSettingsComponent } from '@libgamerender/components/lightsettings.component';
import { CameraComponent, ReflectionCameraComponent } from '@libgamemodel/components/gameappuicomponents';
import { WallComponent2 } from '@libgamemodel/wall/wallcomponent';
import { MathAllocatorsComponent } from '@libgamemodel/components/commoncomponents';
import { mat4, glMatrix, vec2, vec4 } from 'gl-matrix';
import { LambertRenderableUtil } from '@libgamerender/utils/lambertrenderable.util';
import { ArenaWallComponent } from '@libgamemodel/arena/arenawall.component';
import { DebugRenderTag } from '@libgamemodel/debug/debugrendertag';
import { Solid2DRenderableUtil } from '@libgamerender/utils/solid2drenderable.util';
import { MinimapComponent } from '@libgamerender/hud/minimap.component';
import { LightcycleRenderableTag } from '@libgamerender/lightcycle/lightcycle2.rendercomponent';
import { ArenaFloor3RenderUtil } from '@libgamerender/utils/arenafloor3renderutil';
import { FloorComponent } from '@libgamemodel/components/floor.component';
import { ColorUtil } from '@libutil/colorutil';
import { ArenaWall2RenderableUtil } from '@libgamerender/utils/arenawall2renderable.util';
import { MsdfGlyphShaderSingleton } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { PlayerHealthUiComponent } from '@libgamerender/hud/playerhealth/playerhealthui.component';
import { OpenSansFontSingleton } from '@libgamerender/components/opensansfont.singleton';

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
      Vec2: vec2Allocator,
      Mat4: mat4Allocator,
      Vec3: vec3Allocator,
    } = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent);

    //
    // Generate floor reflection texture
    //
    floorReflectionFramebuffer.bind(gl);
    const reflectionClearColor = ColorUtil.COLOR_THEME_MIDTONE_GRAY;
    gl.clearColor(reflectionClearColor.r, reflectionClearColor.g, reflectionClearColor.b, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    mat4Allocator.get(2, (matView, matProj) => {
      reflectionCamera.matView(matView);
      mat4.perspective(
        matProj, glMatrix.toRadian(45), gl.canvas.width / gl.canvas.height, 0.1, 1000.0);

      LambertRenderableUtil.renderEntitiesMatchingTags2(
        ecs,
        [[LightcycleRenderableTag], [WallComponent2]],
        lightSettings, matView, matProj, mat4Allocator);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.blendEquation(gl.FUNC_ADD);
      ArenaWall2RenderableUtil.renderEntitiesMatchingTags(
        ecs, [[ArenaWallComponent]], matProj, matView);
      gl.disable(gl.BLEND);
    });

    //
    // Main render pass
    //
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.canvas.width = (gl.canvas as HTMLCanvasElement).clientWidth * window.devicePixelRatio;
    gl.canvas.height = (gl.canvas as HTMLCanvasElement).clientHeight * window.devicePixelRatio;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    const clearColor = ColorUtil.COLOR_THEME_MIDTONE_GRAY;
    gl.clearColor(clearColor.r, clearColor.g, clearColor.b, 1);
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
              ecs,
              [[LightcycleRenderableTag], [DebugRenderTag], [WallComponent2]],
              lightSettings, matView, matProj, mat4Allocator);

          ArenaFloor3RenderUtil.renderEntitiesMatchingTags(
            ecs, [[FloorComponent]], matProj, matView, viewportDimensions, mat4Allocator);

          gl.enable(gl.BLEND);
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
          gl.blendEquation(gl.FUNC_ADD);
          ArenaWall2RenderableUtil.renderEntitiesMatchingTags(
            ecs, [[ArenaWallComponent]], matProj, matView);
          gl.disable(gl.BLEND);
        });
      });
    });

    //
    // Minimap rendering
    //
    gl.clear(gl.DEPTH_BUFFER_BIT);
    Solid2DRenderableUtil.renderEntitiesMatchingTags(ecs, [MinimapComponent]);

    // TODO (sessamekesh): Remove this experiment in favor of something correct
    // TODO (sessamekesh): Is there a way to go from concept to implementation faster? This is a
    //  painful step, having to implement some sort of batched shader for everything...
    // TODO (sessamekesh): Continue here, based on mocks:
    // https://www.figma.com/file/rK8HI9fw4fyZ0ttUEmUMme/Indigo-Tron-UI-Mocks?node-id=0%3A1
    gl.enable(gl.BLEND);
    ecs.iterateComponents2({
      gl: GLContextComponent,
      shader: MsdfGlyphShaderSingleton,
      font: OpenSansFontSingleton,
    }, {
      playerHealth: PlayerHealthUiComponent,
    }, (e, s, c) => {
      const shader = s.shader.MsdfGlyphShader;
      const gl = s.gl.gl;

      shader.activate(gl);
      shader.render(gl, {
        AlphaThreshold: 0.05,
        Geo: c.playerHealth.Geo.geo,
        GlyphColor: vec4.fromValues(1, 1, 1, 1),
        GlyphTexture: s.font.OpenSans.texture,
        scale: vec2.fromValues(1, -1),
        topLeftOffset: vec2.fromValues(gl.canvas.width / 2, 85),
        viewportSize: vec2.fromValues(gl.canvas.width, gl.canvas.height),
        z: 0.2,
      });
    });
    gl.disable(gl.BLEND);
  }
}
