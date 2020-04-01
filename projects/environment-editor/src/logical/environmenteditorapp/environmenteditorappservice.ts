import { ECSManager } from "@libecs/ecsmanager";
import { Texture } from "@librender/texture/texture";
import { Framebuffer } from "@librender/texture/framebuffer";
import { ShaderBuilderUtil } from '@libgamerender/utils/shaderbuilder.util';
import { LambertShader } from "@librender/shader/lambertshader";
import { ArenaFloorShader } from "@librender/shader/arenafloorshader";
import { RenderResourcesSingletonTag } from "@libgamerender/renderresourcesingletons/renderresourcessingletontag";
import { GLContextComponent, ArenaFloorReflectionTextureComponent, ArenaFloorReflectionFramebufferComponent } from "@libgamerender/components/renderresourcecomponents";
import { CommonComponentUtils } from "@libgamemodel/components/commoncomponentutils";
import { FreeMovementCamera } from '@libgamemodel/camera/freemovementcamera';
import { vec3 } from "gl-matrix";
import { ReflectionCamera } from "@libgamemodel/camera/reflectioncamera";
import { CameraComponent, ReflectionCameraComponent } from "@libgamemodel/components/gameappuicomponents";
import { EnvironmentUtils } from "@libgamemodel/environment/environmentutils";
import { LightSettingsComponent } from "@libgamerender/components/lightsettings.component";
import { EnvironmentArenaFloorSystem } from "@libgamerender/systems/environment.arenafloorsystem";
import { EnvironmentEditorAppRenderSystem } from "./environmenteditorapp.rendersystem";
import { Camera } from "@libgamemodel/camera/camera";
import { KeyboardStateManager } from '@io/keyboardstatemanager';
import { MouseStateManager } from "@io/mousestatemanager";
import { FreeMovementCameraComponent, RadialCameraComponent } from './appcomponents';
import { MouseManagerComponent, KeyboardStateManagerComponent } from '@libgamemodel/utilities/ioeventsqueuecomponents';
import { MouseEventsQueueUtil } from '@libgamemodel/utilities/ioeventsqueueutils';
import { EnvironmentEditorAppIOSystem } from "./environmenteditorapp.iosystem";
import { RadialCamera } from "@libgamemodel/camera/radialcamera";

/**
 * Engine Service for ENVIRONMENT EDITOR APP
 *
 * Draw with in-game graphics (or reasonable approximation) the environment and arena, giving the
 *   editor a variety of camera controls (free flying, centered, game simulating) to look around,
 *   as well as tools to edit the environment outside of the core arena, add scene geometry, effect
 *   spawns, etc.
 *
 * --- CONCEPTS ---
 * Arena: Flat textured quad that forms the playable area of the game.
 * Environment: Collection of terrain and environment features lie outside of the playable area, but
 *              are visible to the player as they approach the arena edges.
 * Terrain: Grid-like floor outside of the arena comprised of quad tiles. Tiles may be sloped.
 * Environment Features: Rocks, trees, etc., that are scattered around the environment. Static.
 *
 * --- UI INPUTS ---
 * Camera Type: one of "free flying", "centered", "game simulation"
 *   This may imply other properties: e.g., free flying has a theta, phi, position.
 * Edit Mode: Terrain editor, feature editor, feature spawn
 * Environment File: May be saved/loaded as a JSON object
 */

// TODO (sessamekesh):
// - Make the "free" be a freely controlled camera, "centered" centered about a point in the world,
//   and "simulation" start up a game simulation where you're on a lightcycle that respawns in the
//   middle when killed and has very high health and regeneration rates
// - Make the arena size configurable! When it is changed, re-generate the environment!
// - Introduce the terrain logical object and rendering of it: flat quads, flat Lambert shading,
//   generated from a configuration file that lists the (1) tile dimensions, (2) terrain dimensions,
//   and (3) an array of the Y coordinates of each tile vertex in the entire terrain.
// - Continue with... everything else, there's so much work to do here!

function assert<T>(name: string, t: T|null): T {
  if (!t) {
    throw new Error(`Could not create resource ${name}`);
  }
  return t;
}

export class EnvironmentEditorAppService {
  private constructor(
    private gl: WebGL2RenderingContext,
    private keyboardStateManager: KeyboardStateManager,
    private mouseStateManager: MouseStateManager,
    private ecs: ECSManager) {}

  static async create(
      gl: WebGL2RenderingContext,
      keyboardStateManager: KeyboardStateManager,
      mouseStateManager: MouseStateManager) {
    const ecs = new ECSManager();

    await Promise.all([
      EnvironmentEditorAppService.createLogicalSystems(ecs),
      EnvironmentEditorAppService.createRenderingSystems(ecs, gl),
      EnvironmentEditorAppService.setupIOComponents(ecs, keyboardStateManager, mouseStateManager)]);

    EnvironmentEditorAppService.createSystems(ecs);

    return new EnvironmentEditorAppService(
      gl, keyboardStateManager, mouseStateManager, ecs);
  }

  //
  // Public API
  //
  setCameraType(cameraType: 'free'|'centered'|'simulation') {
    // TODO (sessamekesh): Make it so that the cameras are in the same position and looking at the
    //  same point when this is changed! Or at least, as closely as possible, eh?
    switch (cameraType) {
      case 'free':
        EnvironmentEditorAppService.setupFreeMovementCamera(this.ecs);
        break;
      case 'centered':
        EnvironmentEditorAppService.setupRadialCamera(this.ecs);
        break;
      // TODO (sessamekesh): Support centered and simulation cameras as well!
    }
  }

  async start() {
    console.log('Starting EnvironmentEditorAppService...');
    this.ecs.start();
    await this.startRendering();
  }

  destroy() {
    this.ecs.clearAllEntities();
  }

  //
  // Setup Helper Methods
  //
  private static setupIOComponents(
      ecs: ECSManager,
      keyboard: KeyboardStateManager,
      mouse: MouseStateManager) {
    const entity = ecs.createEntity();
    entity.addComponent(MouseManagerComponent, mouse);
    entity.addComponent(KeyboardStateManagerComponent, keyboard);
    MouseEventsQueueUtil.getMouseEventsQueue(ecs);
  }

  private static async createLogicalSystems(ecs: ECSManager) {
    const { SceneNodeFactory } = CommonComponentUtils.getSceneNodeFactoryComponent(ecs);
    const { Vec3 } = CommonComponentUtils.getTempMathAllocatorsComponent(ecs);

    //
    // Camera, light, floor
    //
    EnvironmentEditorAppService.setupFreeMovementCamera(ecs);
    EnvironmentUtils.spawnFloor(ecs, 400, 400);

    const lightsEntity = ecs.createEntity();
    lightsEntity.addComponent(
      LightSettingsComponent, vec3.fromValues(0, -1, 0), vec3.fromValues(1, 1, 1), 0.3);
  }

  private static setupFreeMovementCamera(ecs: ECSManager) {
    const { Vec3, Quat } = CommonComponentUtils.getTempMathAllocatorsComponent(ecs);

    let freeMovementCamera = ecs.getSingletonComponent(FreeMovementCameraComponent)?.Camera;
    let camera = ecs.getSingletonComponent(CameraComponent)?.Camera;

    if (!freeMovementCamera) {
      freeMovementCamera = new FreeMovementCamera(
        vec3.fromValues(0, 3, -15), vec3.fromValues(0, 1, 0), vec3.fromValues(0, 0, 1),
        /* spin */ 0, /* tilt */ 0, Vec3, Quat);
      const component = ecs.createEntity();
      component.addComponent(FreeMovementCameraComponent, freeMovementCamera, 50, 0.8);
    }

    if (camera !== freeMovementCamera) {
      EnvironmentEditorAppService.createOrUpdateCamera(ecs, freeMovementCamera);
    }
  }

  private static setupRadialCamera(ecs: ECSManager) {
    const { Vec3, Quat } = CommonComponentUtils.getTempMathAllocatorsComponent(ecs);

    let radialCamera = ecs.getSingletonComponent(RadialCameraComponent)?.Camera;
    let activeCamera = ecs.getSingletonComponent(CameraComponent)?.Camera;

    if (!radialCamera) {
      // TODO (sessamekesh): Also set up a UI indication of where the radial camera is looking, eh?
      radialCamera = new RadialCamera(
        /* center */ vec3.fromValues(0, 3, -15),
        /* radius */ 50, /* minRadius */ 0.1, /* maxRadius */ 1000,
        /* worldUpAxis */ vec3.fromValues(0, 1, 0),
        /* worldForwardAxis */ vec3.fromValues(0, 0, 1),
        /* spin */ 0, /* tilt */ 0, Vec3, Quat);
      const radialCameraEntity = ecs.createEntity();
      radialCameraEntity.addComponent(RadialCameraComponent, radialCamera, 50, 0.8);
    }

    if (activeCamera !== radialCamera) {
      EnvironmentEditorAppService.createOrUpdateCamera(ecs, radialCamera);
    }
  }

  private static async createRenderingSystems(ecs: ECSManager, gl: WebGL2RenderingContext) {
    const floorReflectionTexture = assert(
      'FloorReflectionTexture', Texture.createEmptyTexture(gl, 512, 512, 'rgba32'));
    const roughTileTexture = assert(
      'RoughTileTexture',
      await Texture.createFromURL(gl, 'assets/textures/roughtiles_bump.jpg', {
        MagFilter: 'linear',
        MinFilter: 'linear',
        WrapU: 'repeat',
        WrapV: 'repeat',
      }));
    const floorReflectionFramebuffer = assert(
      'FloorReflectionFramebuffer',
      Framebuffer.create(gl, {
        AttachedTexture: floorReflectionTexture,
        ColorAttachment: 0,
        DepthEnabled: true,
      }));

    //
    // Shaders
    //
    ShaderBuilderUtil.createShaders(ecs, gl, [LambertShader, ArenaFloorShader]);

    //
    // Miscellaneous GL objects
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
  }

  private static createSystems(ecs: ECSManager) {
    //
    // IO
    //
    ecs.addSystem2(EnvironmentEditorAppIOSystem);

    //
    // Install render systems
    //
    ecs.addSystem2(EnvironmentArenaFloorSystem);
    ecs.addSystem2(EnvironmentEditorAppRenderSystem);
  }

  private static createOrUpdateCamera(ecs: ECSManager, mainCamera: Camera) {
    let cameraComponent = ecs.getSingletonComponent(CameraComponent);
    let reflectionCameraComponent = ecs.getSingletonComponent(ReflectionCameraComponent);
    const { Vec3 } = CommonComponentUtils.getTempMathAllocatorsComponent(ecs);
    const floorReflectionCamera = new ReflectionCamera(
      mainCamera, vec3.fromValues(0, -0.5, 0), vec3.fromValues(0, 1, 0), Vec3);

    if (!cameraComponent || !reflectionCameraComponent) {
      const cameraEntity = ecs.createEntity();
      if (!cameraComponent) {
        cameraComponent = cameraEntity.addComponent(CameraComponent, mainCamera);
      } else {
        cameraComponent.Camera = mainCamera;
      }
      if (!reflectionCameraComponent) {
        reflectionCameraComponent = cameraEntity.addComponent(
          ReflectionCameraComponent, floorReflectionCamera);
      } else {
        reflectionCameraComponent.ReflectionCamera = floorReflectionCamera;
      }
    } else {
      cameraComponent.Camera = mainCamera;
      reflectionCameraComponent.ReflectionCamera = floorReflectionCamera;
    }
  }

  private startRendering() {
    return new Promise(firstFrame => {
      let lastFrame = performance.now();
      const frame = () => {
        const now = performance.now();
        const msDt = now - lastFrame;
        lastFrame = now;

        this.gl.clearColor(1, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.ecs.update(msDt);
        requestAnimationFrame(frame);
      };

      // Bootstrap first frame, don't resolve the promise until it has been called initially
      requestAnimationFrame(() => {
        frame();
        requestAnimationFrame(frame);
        firstFrame();
      });
    });
  }
}
