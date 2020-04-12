import { ECSManager } from "@libecs/ecsmanager";
import { LightcycleSystemUtils } from '@libgamemodel/lightcycle/lightcyclesystemutils';
import { CommonComponentUtils } from '@libgamemodel/components/commoncomponentutils';
import { vec3, vec2 } from "gl-matrix";
import { BasicCamera } from '@libgamemodel/camera/basiccamera';
import { CameraComponent, ReflectionCameraComponent } from '@libgamemodel/components/gameappuicomponents';
import { EnvironmentUtils } from '@libgamemodel/environment/environmentutils';
import { GeoRenderResourcesSingletonTag } from '@libgamerender/renderresourcesingletons/georenderresourcessingletontag';
import { ReflectionCamera } from "@libgamemodel/camera/reflectioncamera";
import { ShaderSingletonTag, LambertShaderComponent, ArenaFloorShaderComponent } from "@libgamerender/renderresourcesingletons/shadercomponents";
import { LambertShader } from "@librender/shader/lambertshader";
import { ArenaFloorShader } from "@librender/shader/arenafloorshader";
import { WallSpawnerSystem2 } from "@libgamemodel/wall/wallspawner2.system";
import { EnvironmentArenaFloorSystem } from '@libgamerender/systems/environment.arenafloorsystem';
import { WallEditorAppRenderSystem } from "./walleditorapp.rendersystem";
import { RenderResourcesSingletonTag } from "@libgamerender/renderresourcesingletons/renderresourcessingletontag";
import { GLContextComponent, ArenaFloorReflectionTextureComponent, ArenaFloorReflectionFramebufferComponent } from "@libgamerender/components/renderresourcecomponents";
import { Texture } from "@librender/texture/texture";
import { Framebuffer } from "@librender/texture/framebuffer";
import { LightSettingsComponent } from "@libgamerender/components/lightsettings.component";
import { PointToPointRepeatPath } from '@libutil/math/path';
import { PathWallSpawnerSystem } from '@libgamemodel/wall/pathwallspawner.system';
import { BasicWallLambertSystem } from '@libgamerender/systems/basicwall.lambertsystem';
import { LIGHTCYCLE_SPEED } from "@libutil/helpfulconstants";

/**
 * Engine Service for WALL EDITOR APP
 *
 * --- OVERVIEW ---
 * Walls are semi-transparent and animated in three distinct phases:
 * (1) Spawn
 * (2) Persist
 * (3) Break
 *
 * In phase (1), the wall appears behind the lightcycle as a sea of particles that coalesce into the
 * top and bottom of the plane along which the lightcycle was travelling at spawn time, specifically
 * into the form use in phase (2).
 *
 * In phase (2), the wall is solid and fading - there is a bright bar along the top of the wall that
 * softens somewhat through the lifetime of the wall, and a much thinner bright bar along the bottom
 * with a gradient that reaches towards (but not all the way to) the top of the wall. The height of
 * this gradient decreases as the wall grows weaker, and the intensity of both the top and bottom
 * color decrease as well, until phase (3)...
 *
 * In phase (3) the wall disappates as a blurring cloud along the surface and fades into nothing.
 * The wall is non-solid during this phase, and collisions with it damage nothing.
 *
 * --- IMPLEMENTATION---
 * Phase (1): Spawn animation covers wall length (L) - sampling for a wall segment slides along
 * the animation segment based on the coalesce time, should slide along at 1:1 to give the illusion
 * that the particles are only spawning up/down. For (N) animations and a wall height of (H), this
 * will result in a total of N*L*H texel units that must be taken. Textures can wrap segments of L
 * across multiple rows if needed, but different animations should be assigned to different texture
 * units!
 *
 * Phase (2) doesn't even need to be a texture, it can be generated in a specialized shader.
 *
 * Phase (3) needs textures similar to Phase (4).
 *
 * --- PARAMETERS ---
 * Time (in seconds) of Phase 1,3 animations
 * Size, number of particles in Phase 1,3
 * Number of frames in Phase 1,3 animations
 * Number of unique entry animations for phase 1,3
 * Height of wall
 * Height of top bar
 * Height of bottom bar
 * Start height of gradient, end height of gradient
 * Start color of gradient, end color of gradient (top and bottom)
 * Blurring factor for phase 3
 * Texture size for textures in 1,3
 * Target max supported width of wall segment for animation (for wrapping only)
 */
function assertLoaded<T>(name: string, t: T|null): T {
  if (!t) {
    throw new Error(`Could not create resource ${name}`);
  }
  return t;
}

export class WallEditorAppService {
  private constructor(
    private gl: WebGL2RenderingContext,
    private ecs: ECSManager) {}

  static async create(gl: WebGL2RenderingContext) {
    const ecs = new ECSManager();

    WallEditorAppService.createLogicalSystems(ecs);
    await WallEditorAppService.createRenderingSystems(ecs, gl);
    WallEditorAppService.createInitialWorldState(ecs);

    return new WallEditorAppService(gl, ecs);
  }

  async start() {
    console.log('Starting WallEditorAppService...');
    this.ecs.start();
    this.startRendering();
  }

  private static createLogicalSystems(ecs: ECSManager) {
    LightcycleSystemUtils.installLightcycleUpdateSystem(ecs);
    LightcycleSystemUtils.installWallSpawnerSystem(ecs);
  }

  private static async createRenderingSystems(ecs: ECSManager, gl: WebGL2RenderingContext) {
    const { SceneNodeFactory } = CommonComponentUtils.getSceneNodeFactoryComponent(ecs);
    const { Vec3 } = CommonComponentUtils.getTempMathAllocatorsComponent(ecs);

    const floorReflectionTexture = assertLoaded(
      'FloorReflectionTexture', Texture.createEmptyTexture(gl, 512, 512, 'rgba32'));
    const roughTileTexture = assertLoaded(
      'RoughTileTexture',
      await Texture.createFromURL(gl, 'assets/textures/roughtiles_bump.jpg', {
        MagFilter: 'linear',
        MinFilter: 'linear',
        WrapU: 'repeat',
        WrapV: 'repeat',
      }));
    const floorReflectionFramebuffer = assertLoaded(
      'FloorReflectionFramebuffer', Framebuffer.create(gl, {
        AttachedTexture: floorReflectionTexture,
        ColorAttachment: 0,
        DepthEnabled: true,
      }));

    // TODO (sessamekesh): Add in the animated texture / texture lookup for the sliding walls
    // TODO (sessamekesh): Add in the sliding walls render generation system

    //
    // Shaders
    //
    ecs.iterateComponents([ShaderSingletonTag], (entity) => entity.destroy());
    const shadersEntity = ecs.createEntity();
    shadersEntity.addComponent(ShaderSingletonTag);
    shadersEntity.addComponent(
      LambertShaderComponent, assertLoaded('LambertShader', LambertShader.create(gl)));
    shadersEntity.addComponent(
      ArenaFloorShaderComponent, assertLoaded('ArenaFloorShader', ArenaFloorShader.create(gl)));

    //
    // Geometry
    //
    ecs.iterateComponents([GeoRenderResourcesSingletonTag], (entity) => entity.destroy());
    const geoEntity = ecs.createEntity();
    geoEntity.addComponent(GeoRenderResourcesSingletonTag);

    //
    // Miscellaneous objects
    //
    const glGlobalsEntity = ecs.createEntity();
    glGlobalsEntity.addComponent(RenderResourcesSingletonTag);
    glGlobalsEntity.addComponent(GLContextComponent, gl);

    const globalTexturesEntity = ecs.createEntity();
    globalTexturesEntity.addComponent(RenderResourcesSingletonTag);
    globalTexturesEntity.addComponent(
      ArenaFloorReflectionTextureComponent, floorReflectionTexture, roughTileTexture);

    const globalFramebuffersEntity = ecs.createEntity();
    globalFramebuffersEntity.addComponent(RenderResourcesSingletonTag);
    globalFramebuffersEntity.addComponent(
      ArenaFloorReflectionFramebufferComponent, floorReflectionFramebuffer);

    //
    // Install systems
    //
    ecs.addSystem2(PathWallSpawnerSystem);
    ecs.addSystem2(WallSpawnerSystem2);
    ecs.addSystem2(BasicWallLambertSystem);
    ecs.addSystem2(EnvironmentArenaFloorSystem);
    ecs.addSystem2(WallEditorAppRenderSystem);
  }

  private static createInitialWorldState(ecs: ECSManager) {
    const { SceneNodeFactory } = CommonComponentUtils.getSceneNodeFactoryComponent(ecs);
    const { Vec3 } = CommonComponentUtils.getTempMathAllocatorsComponent(ecs);

    //
    // Logical rendering resources (camera, light)
    //
    const camera = new BasicCamera(
      vec3.fromValues(0, 3, -15), vec3.fromValues(0, 0.85, 0), vec3.fromValues(0, 1, 0));
    const floorReflectionCamera = new ReflectionCamera(
      camera, vec3.fromValues(0, -0.5, 0), vec3.fromValues(0, 1, 0), Vec3);
    const cameraEntity = ecs.createEntity();
    cameraEntity.addComponent(CameraComponent, camera);
    cameraEntity.addComponent(ReflectionCameraComponent, floorReflectionCamera);

    const lightsEntity = ecs.createEntity();
    lightsEntity.addComponent(
      LightSettingsComponent, vec3.fromValues(0, -1, 0), vec3.fromValues(1, 1, 1), 0.3);

    const GEN_LEN = 50;
    const SPEED = LIGHTCYCLE_SPEED;
    PathWallSpawnerSystem.createPathSpawner(
      ecs, SceneNodeFactory, Vec3,
      new PointToPointRepeatPath(
        vec2.fromValues(-GEN_LEN / 2, 0),
        vec2.fromValues(GEN_LEN / 2, 0),
        GEN_LEN / SPEED), (GEN_LEN / SPEED) * 1.65);

    //
    // Initial game state
    //
    EnvironmentUtils.spawnArenaFloor(ecs, 400, 400);
  }

  private startRendering() {
    let lastFrame = performance.now();
    const frame = () => {
      const now = performance.now();
      const msDt = now - lastFrame;
      lastFrame = now;

      this.ecs.update(msDt);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
}
