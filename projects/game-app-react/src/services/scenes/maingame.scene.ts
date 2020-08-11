import { SceneBase } from "./scenebase";
import { ECSManager } from "@libecs/ecsmanager";
import { GameAppRenderProviders2 } from "../gameapprenderproviders2";
import { vec2, vec3, glMatrix, vec4 } from "gl-matrix";
import { MathAllocatorsComponent, MainPlayerComponent, PauseStateComponent, OwnedMathAllocatorsComponent } from "@libgamemodel/components/commoncomponents";
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
import { BasicCamera } from "@libgamemodel/camera/basiccamera";
import { ReflectionCamera } from "@libgamemodel/camera/reflectioncamera";
import { LightSettingsComponent } from "@libgamerender/components/lightsettings.component";
import { UpdatePhysicsSystemConfigComponent, UpdatePhysicsSystem } from "@libgamemodel/physics/updatephysics.system";
import { EnvironmentUtils } from "@libgamemodel/environment/environmentutils";
import { Lightcycle3SpawnerUtil } from "@libgamemodel/lightcycle3/lightcycle3spawner.util";
import { CameraRig5Component, CameraRig5TargetTag } from "@libgamemodel/camera/camerarig5.component";
import { GreenAiUtil2 } from "@libgamemodel/ai2/greenai/greenai2.util";
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
import { CameraRig6System } from "@libgamemodel/camera/camerarig6.system";
import { LightcycleLambertSystem2 } from "@libgamerender/lightcycle/lightcycle.lambertsystem2";
import { BasicWallRenderSystem2 } from "@libgamerender/wall/basicwall.rendersystem";
import { ArenaFloor3RenderSystem } from "@libgamerender/arena/arenafloor3.rendersystem";
import { ArenaWall2RenderSystem } from "@libgamerender/arena/arenawall2.rendersystem";
import { Lightcycle3LambertGeoRenderSystem } from "@libgamerender/lightcycle/lightcycle3lambertgeo.rendersystem";
import { HudConfigUpdateSystem } from "@libgamerender/hud/hudconfigupdate.system";
import { PlayerHealthUiSystem } from '@libgamerender/hud/playerhealth/playerhealthui.system';
import { GameAppRenderSystem } from "@libgamerender/systems/gameapp.rendersystem";
import { BaseArenaLoadUtil } from "./basearena.loadutil";
import { GameEndCameraRadialCameraPropertiesSingleton, GameEndCameraSystem } from '@libgamemodel/camera/gameendcamera.system';
import { GameOverUiSystem } from '@libgamerender/hud/gameoverui/gameoverui.system';
import { GameOverUiSettingsSingleton } from '@libgamerender/hud/gameoverui/gameoverui.component';
import { MenuUiSystem } from "@libgamerender/hud/menu/menuui.system";
import { StandardButtonComponent } from "@libgamerender/hud/menu/btnstartgame.component";
import { MouseStateSingleton } from "@libgamerender/hud/menu/mousestate.singleton";
import { MouseStateManager } from "@io/mousestatemanager";
import { MenuScene } from "./menu.scene";
import { GLContextComponent } from "@libgamerender/components/renderresourcecomponents";

interface IDisposable { destroy(): void; }
function registerDisposable<T extends IDisposable>(entity: Entity, disposable: T): T {
  entity.addListener('destroy', () => disposable.destroy());
  return disposable;
}

export class MainGameScene extends SceneBase {
  constructor(
      private rp: GameAppRenderProviders2,
      ecs: ECSManager,
      private gameAppUiManager: IEventManager<GameAppUIEvents>,
      private mouseStateManager: MouseStateManager) {
    super(ecs);
  }

  static async createFresh(
      gl: WebGL2RenderingContext,
      rp: GameAppRenderProviders2,
      gameAppUiManager: IEventManager<GameAppUIEvents>,
      mouseStateManager: MouseStateManager): Promise<MainGameScene> {
    const ecs = new ECSManager();

    BaseArenaLoadUtil.PopulateUtilitySingletons(ecs, gl, rp);
    await Promise.all([
      BaseArenaLoadUtil.LoadGameGeometryObjects(ecs, gl, rp),
      await BaseArenaLoadUtil.LoadArenaFloorResources(ecs, gl, rp)]);

    MouseStateSingleton.upsert(ecs, mouseStateManager);

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

    return new MainGameScene(rp, ecs, gameAppUiManager, mouseStateManager);
  }

  start() {
    const ecs = this.ecs;

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
    const minimapEntity = ecs.createEntity();
    minimapEntity.addComponent(
      MinimapComponent,
      /* MaxViewportWidth */ 0.25,
      /* MaxViewportHeight */ 0.22,
      /* TopPx */ 32,
      /* RightPx */ 32);

    //
    // Game end state configuration
    //
    GameEndCameraRadialCameraPropertiesSingleton.insert(ecs, /* radius */ 18, /* rotRate */ 0.45);

    const ownedAlloc = ecs.getSingletonComponentOrThrow(OwnedMathAllocatorsComponent);
    const e = ecs.createEntity();
    e.addComponent(
      GameOverUiSettingsSingleton,
      /* victoryText */ 'You won!',
      /* defeatText */ 'Oh dear, you are dead!',
      /* BoxWidth */ 0.25,
      /* BoxHeight */ 0.125,
      /* BoxOrigin */ vec2.fromValues(0, 0.5),
      /* BoxColor */ vec4.fromValues(0.1, 0.1, 0.1, 1),
      /* TextYOffset */ 15,
      /* StartOverButton */
      new StandardButtonComponent(
        'main menu',
        /* width */ 0.15,
        /* height */ 0.06,
        (()=>{const v = ownedAlloc.Vec2.get(); vec2.set(v.Value, 0.5, 0.65); return v;})(),
        (()=>{const v = ownedAlloc.Vec4.get(); vec4.set(v.Value, 0.3, 0.3, 0.3, 1.0); return v;})(),
        (()=>{const v = ownedAlloc.Vec4.get(); vec4.set(v.Value, 0.12, 0.3, 0.12, 1.0); return v;})(),
        (()=>{const v = ownedAlloc.Vec4.get(); vec4.set(v.Value, 0.08, 0.5, 0.08, 1.0); return v;})(),
        async () => {
          const gl = this.ecs.getSingletonComponentOrThrow(GLContextComponent).gl;
          const nextScene = await MenuScene.createMenu(
            gl, this.rp, this.gameAppUiManager, this.mouseStateManager);
          nextScene.start();
          this.switchScenes(nextScene);
        }),
        null);

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
    ecs.addSystem2(CameraRig6System);

    // Game end state - put here because lazy
    ecs.addSystem2(GameEndCameraSystem);
    ecs.addSystem2(GameOverUiSystem);
    ecs.addSystem2(MenuUiSystem);

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
