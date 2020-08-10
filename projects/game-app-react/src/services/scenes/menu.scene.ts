import { SceneBase } from "./scenebase";
import { GameAppRenderProviders2 } from "../gameapprenderproviders2";
import { IEventManager } from "@libutil/eventmanager";
import { GameAppUIEvents } from "../gameappuieventmanager";
import { ECSManager } from "@libecs/ecsmanager";
import { BaseArenaLoadUtil } from "./basearena.loadutil";
import { EnvironmentUtils } from "@libgamemodel/environment/environmentutils";
import { vec3, glMatrix, vec2, vec4 } from "gl-matrix";
import { LightSettingsComponent } from "@libgamerender/components/lightsettings.component";
import { ReflectionCamera } from "@libgamemodel/camera/reflectioncamera";
import { MathAllocatorsComponent, PauseStateComponent, OwnedMathAllocatorsComponent } from "@libgamemodel/components/commoncomponents";
import { CameraComponent, ReflectionCameraComponent } from "@libgamemodel/components/gameappuicomponents";
import { UpdatePhysicsSystemConfigComponent, UpdatePhysicsSystem } from "@libgamemodel/physics/updatephysics.system";
import { GreenAiUtil2 } from "@libgamemodel/ai2/greenai/greenai2.util";
import { AIStateManagerSystem } from "@libgamemodel/ai2/aistatemanager.system";
import { AiSteeringSystem } from "@libgamemodel/ai/aisteering.system";
import { LightcycleDrivingSystem3 } from "@libgamemodel/lightcycle3/lightcycle3driving.system";
import { Lightcycle3ArenaCollisionSystem } from "@libgamemodel/lightcycle3/lightcycle3arenacollision.system";
import { Lightcycle3WallGeneratorSystem } from "@libgamemodel/lightcycle3/lightcycle3wallgenerator.system";
import { WallSpawnerSystem2 } from "@libgamemodel/wall/wallspawner2.system";
import { LightcycleLambertSystem2 } from "@libgamerender/lightcycle/lightcycle.lambertsystem2";
import { BasicWallRenderSystem2 } from "@libgamerender/wall/basicwall.rendersystem";
import { ArenaFloor3RenderSystem } from "@libgamerender/arena/arenafloor3.rendersystem";
import { ArenaWall2RenderSystem } from "@libgamerender/arena/arenawall2.rendersystem";
import { Lightcycle3LambertGeoRenderSystem } from "@libgamerender/lightcycle/lightcycle3lambertgeo.rendersystem";
import { HudConfigUpdateSystem } from "@libgamerender/hud/hudconfigupdate.system";
import { GameAppRenderSystem } from "@libgamerender/systems/gameapp.rendersystem";
import { ECSSystem } from "@libecs/ecssystem";
import { RadialCamera } from '@libgamemodel/camera/radialcamera';
import { Y_UNIT_DIR, Z_UNIT_DIR } from "@libutil/helpfulconstants";
import { MouseStateManager } from "@io/mousestatemanager";
import { MouseStateSingleton } from '@libgamerender/hud/menu/mousestate.singleton';
import { StandardButtonComponent } from '@libgamerender/hud/menu/btnstartgame.component';
import { MenuUiSystem } from '@libgamerender/hud/menu/menuui.system';
import { MainGameScene } from "./maingame.scene";
import { GLContextComponent } from "@libgamerender/components/renderresourcecomponents";

// TODO (sessamekesh): Put in the main menu systems and components for the main menu UI
// - "Start Game" button
// - Github link button

class RotateRadialCameraSystem extends ECSSystem {
  start(ecs: ECSManager) {
    return this.expectSingletons(ecs, {}, 'RotateRadialCameraSystem');
  }

  update(ecs: ECSManager, msDt: number) {
    ecs.withSingletons({camera: CameraComponent}, (s) => {
      if (s.camera.Camera instanceof RadialCamera) {
        s.camera.Camera.spinRight(msDt * 0.08 / 1000);
      }
    });
  }
}

export class MenuScene extends SceneBase {
  constructor(
      ecs: ECSManager,
      private rp: GameAppRenderProviders2,
      private gameAppUiManager: IEventManager<GameAppUIEvents>) {
    super(ecs);
  }

  static async createMenu(
      gl: WebGL2RenderingContext,
      rp: GameAppRenderProviders2,
      gameAppUiManager: IEventManager<GameAppUIEvents>,
      mouseStateManager: MouseStateManager): Promise<MenuScene> {
    const ecs = new ECSManager();

    BaseArenaLoadUtil.PopulateUtilitySingletons(ecs, gl, rp);
    await Promise.all([
      BaseArenaLoadUtil.LoadGameGeometryObjects(ecs, gl, rp),
      BaseArenaLoadUtil.LoadArenaFloorResources(ecs, gl, rp)]);

    MouseStateSingleton.upsert(ecs, mouseStateManager);

    MenuScene.installSystems(ecs);

    return new MenuScene(ecs, rp, gameAppUiManager);
  }

  private static installSystems(ecs: ECSManager) {
    // Many logical systems also used from the main game - not all though (e.g., no player controls)
    ecs.addSystem2(AIStateManagerSystem);
    ecs.addSystem2(AiSteeringSystem);
    ecs.addSystem2(LightcycleDrivingSystem3);
    ecs.addSystem2(Lightcycle3ArenaCollisionSystem);
    ecs.addSystem2(Lightcycle3WallGeneratorSystem);
    ecs.addSystem2(WallSpawnerSystem2);

    ecs.addSystem2(UpdatePhysicsSystem);

    ecs.addSystem2(LightcycleLambertSystem2);
    ecs.addSystem2(BasicWallRenderSystem2);
    ecs.addSystem2(ArenaFloor3RenderSystem);
    ecs.addSystem2(ArenaWall2RenderSystem);
    ecs.addSystem2(Lightcycle3LambertGeoRenderSystem);

    ecs.addSystem2(HudConfigUpdateSystem);
    ecs.addSystem2(MenuUiSystem);

    ecs.addSystem2(RotateRadialCameraSystem);

    ecs.addSystem2(GameAppRenderSystem);
  }

  start(): void {
    const ecs = this.ecs;

    EnvironmentUtils.spawnArenaFloor(ecs, 250, 250);
    const lightsEntity = ecs.createEntity();
    const lightDirection = vec3.fromValues(1, -8, 2);
    vec3.normalize(lightDirection, lightDirection);
    lightsEntity.addComponent(
      LightSettingsComponent, lightDirection, vec3.fromValues(1, 1, 1), 0.55);

    const mathAllocators = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent);
    const camera = new RadialCamera(
      vec3.fromValues(0, -5, 0),
      /* radius */ 210,
      /* minRadius */ 1,
      /* maxRadius */ 55550,
      /* worldUpAxis */ Y_UNIT_DIR,
      /* worldForwardAxis */ Z_UNIT_DIR,
      /* spin */ 0,
      /* tilt */ glMatrix.toRadian(22.5),
      /* vec3Allocator */ mathAllocators.Vec3,
      /* quatAllocator */ mathAllocators.Quat);
    const floorReflectionCamera = new ReflectionCamera(
      camera, vec3.fromValues(0, -0.5, 0), vec3.fromValues(0, 1, 0),
      ecs.getSingletonComponentOrThrow(MathAllocatorsComponent).Vec3);
    const camerasEntity = ecs.createEntity();
    camerasEntity.addComponent(CameraComponent, camera);
    camerasEntity.addComponent(ReflectionCameraComponent, floorReflectionCamera);

    const gamePlaybackStateEntity = ecs.createEntity();
    gamePlaybackStateEntity.addComponent(PauseStateComponent, /* IsPaused */ false);

    const configurationEntity = ecs.createEntity();
    configurationEntity.addComponent(
      UpdatePhysicsSystemConfigComponent,
      /* UpdateTick */ 1 / 180,
      /* TimeSinceLastTick */ 0,
      /* MaxCollisionResolutionIterations */ 10,
      /* PositionErrorThreshold */ 0.0001, // 0.1 mm
      /* VelocityErrorThreshold */ 0.01); // 1 cm/s

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
    GreenAiUtil2.createAiPlayer2(
      ecs,
      {
        BodyOrientation: glMatrix.toRadian(90),
        Color: 'green',
        MaxSteeringAngularVelocity: 25,
        Position: vec2.fromValues(50, -50),
        SpawnHealth: 125,
        Velocity: 38.5,
        WallSpawnHealth: 10
      },
      /* wallScanDistance */ 25,
      /* wanderRandFn */ Math.random);
    GreenAiUtil2.createAiPlayer2(
      ecs,
      {
        BodyOrientation: glMatrix.toRadian(0),
        Color: 'red',
        MaxSteeringAngularVelocity: 25,
        Position: vec2.fromValues(50, 50),
        SpawnHealth: 125,
        Velocity: 38.5,
        WallSpawnHealth: 10
      },
      /* wallScanDistance */ 85,
      /* wanderRandFn */ Math.random);

    const alloc = ecs.getSingletonComponentOrThrow(OwnedMathAllocatorsComponent);

    const startButton = ecs.createEntity();
    const origin = alloc.Vec2.get();
    vec2.set(origin.Value, 0.5, 0.35);
    const color = alloc.Vec4.get();
    vec4.set(color.Value, 0.08, 0.65, 0.08, 1.0);
    const hover = alloc.Vec4.get();
    vec4.set(hover.Value, 0.12, 0.6, 0.12, 1.0);
    const pressed = alloc.Vec4.get();
    vec4.set(pressed.Value, 0.08, 0.35, 0.08, 1.0);
    startButton.addComponent(
      StandardButtonComponent,
      'Start Game',
      /* Width */ 0.25,
      /* Height */ 0.06,
      /* Origin */ origin,
      /* BtnColor */ color,
      /* HoverColor */ hover,
      /* PressedColor */ pressed,
      /* OnPress */ async () => {
        // TODO (sessamekesh): Start the actual game here!
        const gameScene = await MainGameScene.createFresh(
          this.ecs.getSingletonComponentOrThrow(GLContextComponent).gl,
          this.rp, this.gameAppUiManager);
        gameScene.start();
        this.switchScenes(gameScene);
      });

    ecs.start();
  }
}
