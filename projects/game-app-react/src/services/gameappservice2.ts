import { ECSManager } from '@libecs/ecsmanager';
import { IEventManager } from '@libutil/eventmanager';
import { GameAppUIEvents } from './gameappuieventmanager';
import { DracoDecoderComponent } from '@libgamerender/renderresourcesingletons/dracodecodercomponent';
import { ArenaWallShader2Singleton } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { GeoRenderResourcesSingletonTag } from '@libgamerender/renderresourcesingletons/georenderresourcessingletontag';
import { RenderResourcesSingletonTag } from '@libgamerender/renderresourcesingletons/renderresourcessingletontag';
import { KeyboardManager } from '@io/keyboardmanager';
import { CameraComponent, ReflectionCameraComponent, BikeInputManagerComponent } from '../../../libgamemodel/components/gameappuicomponents';
import { BikeInputManager } from '@io/bikeinput/bikeinputmanager';
import { KeyboardBikeInputController } from '@io/bikeinput/keyboardbikeinputcontroller';
import { TouchEventBikeInputController } from '@io/bikeinput/toucheventbikeinputcontroller';
import { GamepadBikeInputController } from '@io/bikeinput/gamepadbikeinputcontroller';
import { Entity } from '@libecs/entity';
import { BasicCamera } from '@libgamemodel/camera/basiccamera';
import { vec3, glMatrix, vec2 } from 'gl-matrix';
import { ReflectionCamera } from '@libgamemodel/camera/reflectioncamera';
import { MathAllocatorsComponent, PauseStateComponent, OwnedMathAllocatorsComponent, MainPlayerComponent, SceneGraphComponent } from '@libgamemodel/components/commoncomponents';
import { UIEventEmitterComponent } from '@libgamemodel/components/gameui';
import { LightcycleUpdateSystem2 } from '@libgamemodel/lightcycle/lightcycleupdate2.system';
import { GameAppRenderProviders2 } from './gameapprenderproviders2';
import { LightcycleLambertRenderResourcesComponent, ArenaFloorReflectionFramebufferComponent, ArenaFloorReflectionTextureComponent, GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { LightcycleSpawner } from '@libgamemodel/lightcycle/lightcyclespawner';
import { EnvironmentUtils } from '@libgamemodel/environment/environmentutils';
import { WallSpawnerSystem2 } from '@libgamemodel/wall/wallspawner2.system';
import { Renderable2SceneGraphModule } from '@librender/renderable/renderable2.scenegraphmodule';
import { LightcycleCollisionSystem } from '@libgamemodel/lightcycle/lightcyclecollisionsystem';
import { ArenaWall2RenderResourcesSingleton } from '@libgamerender/arena/arenawall2renderresources.singleton';
import { BasicWallGeometryGenerator } from '@libgamerender/wall/basicwallgeometry.generator';
import { ArenaWall2GeoGenerator } from '@librender/geo/generators/arenawall2geogenerator';
import { LightcycleSteeringSystem } from '@libgamemodel/lightcycle/lightcyclesteeringsystem';
import { LightcycleHealthSystem } from '@libgamemodel/lightcycle/lightcyclehealthsystem';
import { LightcycleLambertSystem2 } from '@libgamerender/lightcycle/lightcycle.lambertsystem2';
import { GameAppRenderSystem } from '@libgamerender/systems/gameapp.rendersystem';
import { GreenAiUtil2 } from '@libgamemodel/ai2/greenai/greenai2.util';
import { AIStateManagerSystem } from '@libgamemodel/ai2/aistatemanager.system';
import { BasicWallRenderSystem2 } from '@libgamerender/wall/basicwall.rendersystem';
import { LightSettingsComponent } from '@libgamerender/components/lightsettings.component';
import { MinimapComponent } from '@libgamerender/hud/minimap.component';
import { HudConfigUpdateSystem } from '@libgamerender/hud/hudconfigupdate.system';
import { MinimapRenderSystem } from '@libgamerender/hud/minimap.rendersystem';
import { Key } from 'ts-key-enum';
import { ShaderBuilderUtil } from '@libgamerender/utils/shaderbuilder.util';
import { LambertShader } from '@librender/shader/lambertshader';
import { assert } from '@libutil/loadutils';
import { Texture } from '@librender/texture/texture';
import { ArenaWall2RenderSystem } from '@libgamerender/arena/arenawall2.rendersystem';
import { AiSteeringSystem } from '@libgamemodel/ai/aisteering.system';
import { LightcycleColorComponent } from '@libgamemodel/lightcycle/lightcyclecolor.component';
import { UpdatePhysicsSystemConfigComponent, UpdatePhysicsSystem } from '@libgamemodel/physics/updatephysics.system';
import { CameraRig5Component } from '@libgamemodel/camera/camerarig5.component';
import { ArenaFloor3RenderSystem } from '@libgamerender/arena/arenafloor3.rendersystem';
import { CameraRig5System } from '@libgamemodel/camera/camerarig5.system';
import { Solid2DShader } from '@librender/shader/solid2dshader';
import { HudViewportSingleton } from '@libgamerender/hud/hudviewport.singleton';
import { ArenaFloor3GlResourcesSingleton } from '@libgamerender/arena/arenafloor3glresources.singleton';
import { ArenaFloorShader3 } from '@librender/shader/arenafloorshader3';
import { ArenaFloor3GeometrySingleton } from '@libgamerender/arena/arenafloor3geometry.singleton';
import { SceneGraph2 } from '@libscenegraph/scenegraph2';
import { Mat4TransformModule } from '@libscenegraph/scenenodeaddons/mat4transformmodule';
import { ArenaWallShader2 } from '@librender/shader/arenawallshader2';

interface IDisposable { destroy(): void; }
function registerDisposable<T extends IDisposable>(entity: Entity, disposable: T): T {
  entity.addListener('destroy', () => disposable.destroy());
  return disposable;
}

export class GameAppService2 {
  private isGameOver_ = false;

  private renderProviders_ = new GameAppRenderProviders2();

  private constructor(
    private gl: WebGL2RenderingContext,
    private ecs: ECSManager,
    private gameAppUiManager: IEventManager<GameAppUIEvents>) {}

  static async create(
      gl: WebGL2RenderingContext, gameAppUiEventManager: IEventManager<GameAppUIEvents>) {
    const ecs = new ECSManager();
    ((window as any)['ecs'] as any) = ecs as any;

    const gameAppService = new GameAppService2(gl, ecs, gameAppUiEventManager);
    // Bootstrap GL resources for initial play before finishing "create"
    await GameAppService2.loadGlResources(gl, ecs, gameAppService.renderProviders_);
    return gameAppService;
  }

  async start() {
    const gameOverListener = this.gameAppUiManager.addListener('player-death', () => {
      this.isGameOver_ = true;
      this.gameAppUiManager.removeListener('player-death', gameOverListener);
    });
    await this.setFreshEcsState_();
    GameAppService2.initializeSystems_(this.ecs);
    this.ecs.start();
    this.beginRendering();
  }

  async restart() {
    this.stopRendering();
    await this.setFreshEcsState_();
    this.gameAppUiManager.fireEvent('player-death', false);
    this.gameAppUiManager.fireEvent('playerhealth', {MaxHealth: 100, CurrentHealth: 100});
    this.ecs.restart();
    this.beginRendering();
  }

  pause() {
    const pauseState = this.ecs.getSingletonComponent(PauseStateComponent);
    if (pauseState) {
      pauseState.IsPaused = !pauseState.IsPaused;
      this.gameAppUiManager.fireEvent('apppaused', pauseState.IsPaused);
    }
  }

  private static initializeSystems_(ecs: ECSManager) {
    // This only needs to be done once if systems are truly stateless.
    // However, systems may need to set up their own intermediate state - which should be done
    //  as often as is needed.

    //
    // Logical Systems
    //
    ecs.addSystem2(LightcycleSteeringSystem);
    ecs.addSystem2(LightcycleUpdateSystem2);
    ecs.addSystem2(LightcycleCollisionSystem);
    ecs.addSystem2(LightcycleHealthSystem);
    ecs.addSystem2(WallSpawnerSystem2);
    ecs.addSystem2(CameraRig5System);
    ecs.addSystem2(AIStateManagerSystem);
    ecs.addSystem2(AiSteeringSystem);

    //
    // Physics System... belongs on its own. Only one here, but really it could/should be many.
    //
    ecs.addSystem2(UpdatePhysicsSystem);

    //
    // Renderable Generation Systems
    //
    ecs.addSystem2(LightcycleLambertSystem2);
    ecs.addSystem2(BasicWallRenderSystem2);
    ecs.addSystem2(ArenaFloor3RenderSystem);
    ecs.addSystem2(ArenaWall2RenderSystem);

    //
    // HUD
    //
    ecs.addSystem2(HudConfigUpdateSystem);
    ecs.addSystem2(MinimapRenderSystem);

    //
    // Debug systems (and debug renderable generation)
    //
    // ecs.addSystem2(GreenAiGoalDebugSystem);
    // ecs.addSystem2(DrawGreenAiGoalDebugSystem);
    // ecs.addSystem2(DebugFutureLightcyclePositionSystem);
    // ecs.addSystem2(DrawFutureLightcyclePositionSystem);

    // Special case, the game frame render system (full frame generation code in there)
    ecs.addSystem2(GameAppRenderSystem);
  }

  private static async loadGlResources(
      gl: WebGL2RenderingContext, ecs: ECSManager, rp: GameAppRenderProviders2) {
    // Global Resources
    ecs.iterateComponents([RenderResourcesSingletonTag], (entity) => entity.destroy());
    const glGlobalsEntity = ecs.createEntity();
    glGlobalsEntity.addComponent(RenderResourcesSingletonTag);
    glGlobalsEntity.addComponent(GLContextComponent, gl);

    //
    // Shaders
    //
    ShaderBuilderUtil.createShaders(
      ecs,
      gl,
      [ LambertShader, Solid2DShader, ArenaFloorShader3, ArenaWallShader2 ]);

    //
    // Geometry
    //
    ecs.iterateComponents([GeoRenderResourcesSingletonTag], (entity) => entity.destroy());
    const geoEntity = ecs.createEntity();
    geoEntity.addComponent(GeoRenderResourcesSingletonTag);
    geoEntity.addComponent(DracoDecoderComponent, await rp.DracoProvider.getOrThrow(gl));
    geoEntity.addComponent(
      LightcycleLambertRenderResourcesComponent,
      await rp.BikeBodyLambertGeo.getOrThrow(gl),
      await rp.BikeWheelLambertGeo.getOrThrow(gl),
      await rp.BikeStickLambertGeo.getOrThrow(gl),
      await rp.BikeBodyTexture.getOrThrow(gl),
      await rp.BikeWheelTexture.getOrThrow(gl),
      await rp.BikeBodyTexture.getOrThrow(gl));
    geoEntity.addComponent(
      ArenaWall2RenderResourcesSingleton,
      assert(
        'ArenaWall2UnitGeo',
        ArenaWall2GeoGenerator.createUnitWall(
          gl, ecs.getSingletonComponentOrThrow(ArenaWallShader2Singleton).ArenaWallShader2)),
      await Texture.createFromURL(gl, 'assets/particles/gimp_cloud_1.png', Texture.REPEAT_LINEAR),
      await Texture.createFromURL(gl, 'assets/particles/gimp_cloud_2.png', Texture.REPEAT_LINEAR),
      /* Wisp2Scale */ vec2.fromValues(1/25, 1/25),
      /* Wisp2Scale */ vec2.fromValues(1/15, 1/20),
      /* Wisp1Velocity */ vec2.fromValues(0.15, -0.4),
      /* Wisp2Velocity */ vec2.fromValues(-0.15, -0.15));
    BasicWallGeometryGenerator.attachGeoSingleton(ecs);

    //
    // Render Resources for various objects
    //
    ArenaFloor3GeometrySingleton.generate(ecs);
    ArenaFloor3GlResourcesSingleton.attach(ecs, rp.FloorReflectionTexture.getOrThrow(gl));

    //
    // Miscelaneous Objects
    //
    const framebuffersEntity = ecs.createEntity();
    framebuffersEntity.addComponent(RenderResourcesSingletonTag);
    framebuffersEntity.addComponent(
      ArenaFloorReflectionFramebufferComponent, rp.FloorReflectionFramebuffer.getOrThrow(gl));

    const texturesEntity = ecs.createEntity();
    texturesEntity.addComponent(RenderResourcesSingletonTag);
    texturesEntity.addComponent(
      ArenaFloorReflectionTextureComponent,
      rp.FloorReflectionTexture.getOrThrow(gl));
  }

  private async setFreshEcsState_() {
    const ecs = this.ecs;
    ecs.clearAllEntities();

    await GameAppService2.loadGlResources(this.gl, ecs, this.renderProviders_);

    const utilitiesEntity = ecs.createEntity();
    utilitiesEntity.addComponent(
      MathAllocatorsComponent,
      this.renderProviders_.Vec2Allocator.get(),
      this.renderProviders_.Vec3Allocator.get(),
      this.renderProviders_.Mat4Allocator.get(),
      this.renderProviders_.QuatAllocator.get(),
      this.renderProviders_.CircleAllocator.get());
    utilitiesEntity.addComponent(
      OwnedMathAllocatorsComponent,
      this.renderProviders_.OwnedVec2Allocator.get(),
      this.renderProviders_.OwnedVec3Allocator.get(),
      this.renderProviders_.OwnedVec4Allocator.get(),
      this.renderProviders_.OwnedMat4Allocator.get(),
      this.renderProviders_.OwnedQuatAllocator.get(),
      this.renderProviders_.PlaneAllocator.get());
    utilitiesEntity.addComponent(
      SceneGraphComponent,
      new SceneGraph2()
        .addModule(
          Mat4TransformModule,
          new Mat4TransformModule(
            this.renderProviders_.OwnedMat4Allocator.get(),
            this.renderProviders_.OwnedVec3Allocator.get(),
            this.renderProviders_.Mat4Allocator.get(),
            this.renderProviders_.QuatAllocator.get()))
        .addModule(
          Renderable2SceneGraphModule,
          new Renderable2SceneGraphModule()));
    // TODO (sessamekesh): Move all the singletons from here to libgamemodel/libgamerender
    //  because the model and render systems that need them are in those libraries (not here)

    GameAppService2.loadInputResources(ecs, this.gl.canvas as HTMLCanvasElement);

    const gameAppUiEntity = ecs.createEntity();
    gameAppUiEntity.addComponent(UIEventEmitterComponent, this.gameAppUiManager);

    //
    // Logical rendering resources (camera, lights)
    //
    const camera = new BasicCamera(
      vec3.fromValues(5, 10, 5), vec3.fromValues(5, 8, -5), vec3.fromValues(0, 1, 0));
    const floorReflectionCamera = new ReflectionCamera(
      camera, vec3.fromValues(0, -0.5, 0), vec3.fromValues(0, 1, 0),
      this.renderProviders_.Vec3Allocator.get());
    const camerasEntity = ecs.createEntity();
    camerasEntity.addComponent(CameraComponent, camera);
    camerasEntity.addComponent(ReflectionCameraComponent, floorReflectionCamera);

    const gamePlaybackStateEntity = ecs.createEntity();
    gamePlaybackStateEntity.addComponent(PauseStateComponent, /* IsPaused */ false);

    const lightsEntity = ecs.createEntity();
    const lightDirection = vec3.fromValues(1, -8, 2);
    vec3.normalize(lightDirection, lightDirection);
    lightsEntity.addComponent(
      LightSettingsComponent, lightDirection, vec3.fromValues(1, 1, 1), 0.55);

    //
    // System run-time configuration
    //
    const configurationEntity = ecs.createEntity();
    configurationEntity.addComponent(
      UpdatePhysicsSystemConfigComponent,
      /* UpdateTick */ 1 / 180,
      /* TimeSinceLastTick */ 0,
      /* MaxCollisionResolutionIterations */ 10,
      /* PositionErrorThreshold */ 0.0001, // 0.1 mm
      /* VelocityErrorThreshold */ 0.01); // 1 cm/s

    //
    // Initial game state
    //
    EnvironmentUtils.spawnArenaFloor(ecs, 250, 250);
    const mainPlayerEntity = LightcycleSpawner.spawnLightcycle(ecs, {
      Position: vec3.fromValues(5, 0, 0),
      Orientation: glMatrix.toRadian(180),
      Velocity: 38.5,
      AngularVelocity: 1.85,
    });
    mainPlayerEntity.addComponent(LightcycleColorComponent, 'blue');
    mainPlayerEntity.addComponent(MainPlayerComponent);

    const cameraRigEntity = ecs.createEntity();
    cameraRigEntity.addComponent(
      CameraRig5Component,
      /* Camera */ camera,
      /* CameraHeight */ 8.5,
      /* LookAtHeight */ 2.5,
      /* WallCollisionRadius */ 0.5,
      /* FollowDistance */ 40,
      /* LeadDistance */ 1,
      /* FollowCurveTime */ 0.1,
      /* LeadCurvetime */ 0.35,
      /* CarEntity */ mainPlayerEntity,
      /* GoalApproachMinVelocity */ 50,
      /* GoalApproachMaxVelocity */ 250,
      /* GoalApproachMaxDistance */ 70);

    GreenAiUtil2.createAiPlayer(
      ecs, vec2.fromValues(8, -50), glMatrix.toRadian(180), 'green', 25, Math.random);
    GreenAiUtil2.createAiPlayer(
      ecs, vec2.fromValues(8, 50), glMatrix.toRadian(270), 'red', 75, Math.random);

    //
    // HUD
    //
    HudViewportSingleton.attach(ecs);
    const minimapEntity = ecs.createEntity();
    minimapEntity.addComponent(
      MinimapComponent,
      /* MaxViewportWidth */ 0.25,
      /* MaxViewportHeight */ 0.22,
      /* TopPx */ 32,
      /* RightPx */ 32);
  }

  private static loadInputResources(ecs: ECSManager, canvas: HTMLCanvasElement) {
    const ioEntity = ecs.createEntity();

    const inputManager = registerDisposable(ioEntity, new BikeInputManager());
    const keyboardManager = registerDisposable(ioEntity, new KeyboardManager(document.body));
    const keyboardInputController = registerDisposable(
      ioEntity, new KeyboardBikeInputController(keyboardManager));
    const touchInputController = registerDisposable(
      ioEntity, new TouchEventBikeInputController(canvas));
    inputManager.addController(keyboardInputController);
    inputManager.addController(touchInputController);

    keyboardManager.addListener('keypress', (keyEvent) => {
      if (keyEvent.key === Key.Escape) {
        const pausedComponent = ecs.getSingletonComponent(PauseStateComponent);
        if (pausedComponent) {
          pausedComponent.IsPaused = !pausedComponent.IsPaused;
        }
      }
    });

    if (GamepadBikeInputController.canUse(navigator)) {
      const gamepadInputController = registerDisposable(
          ioEntity, new GamepadBikeInputController(window, navigator));
      inputManager.addController(gamepadInputController);
    }

    ioEntity.addComponent(BikeInputManagerComponent, inputManager);

    return ioEntity;
  }

  private frameCapture: number|null = null;
  private beginRendering() {
    let lastFrame = performance.now();
    const frame = () => {
      const now = performance.now();
      const msDt = now - lastFrame;
      lastFrame = now;

      // For debugging: Skip absurdly long frames
      if (msDt < 600) {
        this.ecs.update(msDt);
      }

      this.frameCapture = requestAnimationFrame(frame);
    }
    this.frameCapture = requestAnimationFrame(frame);
  }

  private stopRendering() {
    if (this.frameCapture) cancelAnimationFrame(this.frameCapture);
  }
}
