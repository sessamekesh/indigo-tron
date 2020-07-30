import { SceneBase } from "./scenebase";
import { ECSManager } from "@libecs/ecsmanager";
import { GLContextComponent, LightcycleLambertRenderResourcesComponent, ArenaFloorReflectionFramebufferComponent, ArenaFloorReflectionTextureComponent } from "@libgamerender/components/renderresourcecomponents";
import { RenderResourcesSingletonTag } from "@libgamerender/renderresourcesingletons/renderresourcessingletontag";
import { ShaderBuilderUtil } from "@libgamerender/utils/shaderbuilder.util";
import { LambertShader } from "@librender/shader/lambertshader";
import { Solid2DShader } from "@librender/shader/solid2dshader";
import { ArenaFloorShader3 } from "@librender/shader/arenafloorshader3";
import { ArenaWallShader2 } from "@librender/shader/arenawallshader2";
import { GeoRenderResourcesSingletonTag } from "@libgamerender/renderresourcesingletons/georenderresourcessingletontag";
import { DracoDecoderComponent } from "@libgamerender/renderresourcesingletons/dracodecodercomponent";
import { GameAppRenderProviders2 } from "../gameapprenderproviders2";
import { ArenaWall2RenderResourcesSingleton } from "@libgamerender/arena/arenawall2renderresources.singleton";
import { assert } from "@libutil/loadutils";
import { ArenaWall2GeoGenerator } from "@librender/geo/generators/arenawall2geogenerator";
import { ArenaWallShader2Singleton } from "@libgamerender/renderresourcesingletons/shadercomponents";
import { vec2, vec3, glMatrix } from "gl-matrix";
import { BasicWallGeometryGenerator } from "@libgamerender/wall/basicwallgeometry.generator";
import { ArenaFloor3GeometrySingleton } from "@libgamerender/arena/arenafloor3geometry.singleton";
import { ArenaFloor3GlResourcesSingleton } from "@libgamerender/arena/arenafloor3glresources.singleton";
import { MathAllocatorsComponent, OwnedMathAllocatorsComponent, SceneGraphComponent, PauseStateComponent, MainPlayerComponent } from "@libgamemodel/components/commoncomponents";
import { SceneGraph2 } from "@libscenegraph/scenegraph2";
import { Mat4TransformModule } from "@libscenegraph/scenenodeaddons/mat4transformmodule";
import { Renderable2SceneGraphModule } from "@librender/renderable/renderable2.scenegraphmodule";
import { Entity } from "@libecs/entity";
import { BikeInputManager } from "@io/bikeinput/bikeinputmanager";
import { KeyboardManager } from "@io/keyboardmanager";
import { KeyboardBikeInputController } from "@io/bikeinput/keyboardbikeinputcontroller";
import { TouchEventBikeInputController } from "@io/bikeinput/toucheventbikeinputcontroller";
import { Key } from "ts-key-enum";
import { GamepadBikeInputController } from "@io/bikeinput/gamepadbikeinputcontroller";
import { BikeInputManagerComponent, CameraComponent, ReflectionCameraComponent } from "@libgamemodel/components/gameappuicomponents";
import { GameAppUIEvents } from "../gameappuieventmanager";
import { IEventManager } from "@libutil/eventmanager";
import { UIEventEmitterComponent } from "@libgamemodel/components/gameui";
import { LightcycleCollisionsListSingleton } from "@libgamemodel/components/lightcyclecollisionslist.singleton";
import { BasicCamera } from "@libgamemodel/camera/basiccamera";
import { ReflectionCamera } from "@libgamemodel/camera/reflectioncamera";
import { LightSettingsComponent } from "@libgamerender/components/lightsettings.component";
import { UpdatePhysicsSystemConfigComponent, UpdatePhysicsSystem } from "@libgamemodel/physics/updatephysics.system";
import { EnvironmentUtils } from "@libgamemodel/environment/environmentutils";
import { Lightcycle3SpawnerUtil } from "@libgamemodel/lightcycle3/lightcycle3spawner.util";
import { CameraRig5Component, CameraRig5TargetTag } from "@libgamemodel/camera/camerarig5.component";
import { GreenAiUtil2 } from "@libgamemodel/ai2/greenai/greenai2.util";
import { HudViewportSingleton } from "@libgamerender/hud/hudviewport.singleton";
import { MinimapComponent } from "@libgamerender/hud/minimap.component";
import { Lightcycle3SteeringSystem } from "@libgamemodel/lightcycle3/lightcycle3steering.system";
import { AIStateManagerSystem } from "@libgamemodel/ai2/aistatemanager.system";
import { AiSteeringSystem } from "@libgamemodel/ai/aisteering.system";
import { LightcycleDrivingSystem3 } from "@libgamemodel/lightcycle3/lightcycle3driving.system";
import { Lightcycle3ArenaCollisionSystem } from "@libgamemodel/lightcycle3/lightcycle3arenacollision.system";
import { Lightcycle3CollisionDamageSystem } from "@libgamemodel/lightcycle3/lightcycle3collisiondamage.system";
import { Lightcycle3WallGeneratorSystem } from "@libgamemodel/lightcycle3/lightcycle3wallgenerator.system";
import { LightcycleHealthSystem } from "@libgamemodel/lightcycle/lightcyclehealthsystem";
import { WallSpawnerSystem2 } from "@libgamemodel/wall/wallspawner2.system";
import { CameraRig5System } from "@libgamemodel/camera/camerarig5.system";
import { CameraRig6System } from "@libgamemodel/camera/camerarig6.system";
import { LightcycleLambertSystem2 } from "@libgamerender/lightcycle/lightcycle.lambertsystem2";
import { BasicWallRenderSystem2 } from "@libgamerender/wall/basicwall.rendersystem";
import { ArenaFloor3RenderSystem } from "@libgamerender/arena/arenafloor3.rendersystem";
import { ArenaWall2RenderSystem } from "@libgamerender/arena/arenawall2.rendersystem";
import { Lightcycle3LambertGeoRenderSystem } from "@libgamerender/lightcycle/lightcycle3lambertgeo.rendersystem";
import { HudConfigUpdateSystem } from "@libgamerender/hud/hudconfigupdate.system";
import { PlayerHealthUiSystem } from '@libgamerender/hud/playerhealth/playerhealthui.system';
import { OpenSansFontSingleton } from '@libgamerender/components/opensansfont.singleton';
import { GameAppRenderSystem } from "@libgamerender/systems/gameapp.rendersystem";
import { MsdfGlyphShader } from "@librender/text/msdfglyphshader";
import { SolidColorUiShader } from "@librender/ui/solidcolorui.shader";

interface IDisposable { destroy(): void; }
function registerDisposable<T extends IDisposable>(entity: Entity, disposable: T): T {
  entity.addListener('destroy', () => disposable.destroy());
  return disposable;
}

export class MainGameScene extends SceneBase {
  static async createFresh(
      gl: WebGL2RenderingContext,
      rp: GameAppRenderProviders2,
      gameAppUiManager: IEventManager<GameAppUIEvents>): Promise<MainGameScene> {
    const ecs = new ECSManager();

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
      [
        LambertShader, Solid2DShader, ArenaFloorShader3,
        ArenaWallShader2, MsdfGlyphShader, SolidColorUiShader
      ]);

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
      await rp.CloudWispTexture1.getOrThrow(gl),
      await rp.CloudWispTexture2.getOrThrow(gl),
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
    OpenSansFontSingleton.attach(ecs, await rp.OpenSansBMFont.getOrThrow(gl));

    //
    // Miscelaneous Render Objects
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

    //
    // Utility singletons
    //
    const utilitiesEntity = ecs.createEntity();
    utilitiesEntity.addComponent(
      MathAllocatorsComponent,
      rp.Vec2Allocator.get(),
      rp.Vec3Allocator.get(),
      rp.Mat4Allocator.get(),
      rp.QuatAllocator.get(),
      rp.CircleAllocator.get());
    utilitiesEntity.addComponent(
      OwnedMathAllocatorsComponent,
      rp.OwnedVec2Allocator.get(),
      rp.OwnedVec3Allocator.get(),
      rp.OwnedVec4Allocator.get(),
      rp.OwnedMat4Allocator.get(),
      rp.OwnedQuatAllocator.get(),
      rp.PlaneAllocator.get());
    utilitiesEntity.addComponent(
      SceneGraphComponent,
      new SceneGraph2()
        .addModule(
          Mat4TransformModule,
          new Mat4TransformModule(
            rp.OwnedMat4Allocator.get(),
            rp.OwnedVec3Allocator.get(),
            rp.Mat4Allocator.get(),
            rp.QuatAllocator.get()))
        .addModule(
          Renderable2SceneGraphModule,
          new Renderable2SceneGraphModule()));

    //
    // Web-specific I/O resources
    //
    const ioEntity = ecs.createEntity();

    const inputManager = registerDisposable(ioEntity, new BikeInputManager());
    const keyboardManager = registerDisposable(ioEntity, new KeyboardManager(document.body));
    const keyboardInputController = registerDisposable(
      ioEntity, new KeyboardBikeInputController(keyboardManager));
    const touchInputController = registerDisposable(
      ioEntity, new TouchEventBikeInputController(gl.canvas as HTMLCanvasElement));
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

    const gameAppUiEntity = ecs.createEntity();
    gameAppUiEntity.addComponent(UIEventEmitterComponent, gameAppUiManager);

    MainGameScene.installSystems(ecs);

    return new MainGameScene(ecs);
  }

  start() {
    const ecs = this.ecs;

    //
    // Global game state singletons
    //
    LightcycleCollisionsListSingleton.upsert(ecs);

    //
    // Logical rendering resources (camera, lights)
    //
    const camera = new BasicCamera(
      vec3.fromValues(5, 10, 5), vec3.fromValues(5, 8, -5), vec3.fromValues(0, 1, 0));
    const floorReflectionCamera = new ReflectionCamera(
      camera, vec3.fromValues(0, -0.5, 0), vec3.fromValues(0, 1, 0),
      ecs.getSingletonComponentOrThrow(MathAllocatorsComponent).Vec3);
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
    const mainPlayerEntity = Lightcycle3SpawnerUtil.spawnLightcycle(ecs, {
      Position: vec2.fromValues(5, 0),
      BodyOrientation: glMatrix.toRadian(180),
      Color: 'blue',
      MaxSteeringAngularVelocity: 1.85,
      SpawnHealth: 100,
      Velocity: 38.5,
      WallSpawnHealth: 10,
    });
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
    mainPlayerEntity.addComponent(CameraRig5TargetTag);

    // TODO (sessamekesh): Create this! Create lightcycle and then attach AI player, eh?
    GreenAiUtil2.createAiPlayer2(
      ecs,
      {
        BodyOrientation: glMatrix.toRadian(180),
        Color: 'green',
        MaxSteeringAngularVelocity: 25,
        Position: vec2.fromValues(8, -50),
        SpawnHealth: 125,
        Velocity: 38.5,
        WallSpawnHealth: 10
      },
      /* wallScanDistance */ 25,
      /* wanderRandFn */ Math.random);
    GreenAiUtil2.createAiPlayer2(
      ecs,
      {
        BodyOrientation: glMatrix.toRadian(270),
        Color: 'red',
        MaxSteeringAngularVelocity: 25,
        Position: vec2.fromValues(8, 50),
        SpawnHealth: 125,
        Velocity: 38.5,
        WallSpawnHealth: 10
      },
      /* wallScanDistance */ 85,
      /* wanderRandFn */ Math.random);

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

    //
    // Fire off game events to setup game state
    //
    const eventManager = ecs.getSingletonComponentOrThrow(UIEventEmitterComponent).EventEmitter;
    eventManager.fireEvent('player-death', false);
    eventManager.fireEvent('playerhealth', {MaxHealth: 100, CurrentHealth: 100});

    const gameOverListener = eventManager.addListener('player-death', () => {
      eventManager.removeListener('player-death', gameOverListener);
    });

    this.ecs.start();
  }

  private static installSystems(ecs: ECSManager) {
    // This only needs to be done once if systems are truly stateless.
    // However, systems may need to set up their own intermediate state - which should be done
    //  as often as is needed.

    //
    // Logical Systems. Notice: Order is often important, get that right.
    //
    ecs.addSystem2(Lightcycle3SteeringSystem);
    ecs.addSystem2(AIStateManagerSystem);
    ecs.addSystem2(AiSteeringSystem);
    ecs.addSystem2(LightcycleDrivingSystem3);
    ecs.addSystem2(Lightcycle3ArenaCollisionSystem);
    ecs.addSystem2(Lightcycle3CollisionDamageSystem);
    ecs.addSystem2(Lightcycle3WallGeneratorSystem);
    ecs.addSystem2(LightcycleHealthSystem);
    ecs.addSystem2(WallSpawnerSystem2);
    ecs.addSystem2(CameraRig5System);
    ecs.addSystem2(CameraRig6System);

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
    ecs.addSystem2(Lightcycle3LambertGeoRenderSystem);

    //
    // HUD
    //
    ecs.addSystem2(HudConfigUpdateSystem);
    ecs.addSystem2(PlayerHealthUiSystem);

    //
    // Debug systems (and debug renderable generation)
    //
    // ecs.addSystem2(GreenAiGoalDebugSystem);
    // ecs.addSystem2(DrawGreenAiGoalDebugSystem);
    // ecs.addSystem2(DebugFutureLightcyclePositionSystem);
    // ecs.addSystem2(DrawFutureLightcyclePositionSystem);

    // Special case, the game frame render system (full frame generation code in there)
    ecs.addSystem2(GameAppRenderSystem);

    //
    // Verify Utilities
    //
    Lightcycle3SpawnerUtil.assertSingletonsPresent(ecs);
  }
}
