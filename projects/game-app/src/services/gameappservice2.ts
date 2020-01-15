import { ECSManager } from '@libecs/ecsmanager';
import { IEventManager } from '@libutil/eventmanager';
import { GameAppUIEvents } from './gameappuieventmanager';
import { DracoDecoderComponent } from '@libgamerender/renderresourcesingletons/dracodecodercomponent';
import { LambertShaderComponent, ArenaFloorShaderComponent, ShaderSingletonTag } from '@libgamerender/renderresourcesingletons/shadercomponents';
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
import { vec3, glMatrix } from 'gl-matrix';
import { ReflectionCamera } from '@libgamemodel/camera/reflectioncamera';
import { MathAllocatorsComponent, SceneNodeFactoryComponent, OwnedMathAllocatorsComponent } from '@libgamemodel/components/commoncomponents';
import { UIEventEmitterComponent } from '@libgamemodel/components/gameui';
import { LightcycleUpdateSystem2, MainPlayerComponent } from '@libgamemodel/lightcycle/lightcycleupdate2.system';
import { RenderPassResetSystem } from '@libgamerender/systems/renderpassreset.rendersystem';
import { GameAppRenderProviders2 } from './gameapprenderproviders2';
import { LightcycleLambertRenderResourcesComponent, ArenaFloorReflectionFramebufferComponent, ArenaFloorReflectionTextureComponent, GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { LightcycleRenderSystem2 } from '@libgamerender/systems/lightcycle2.rendersystem';
import { MainRenderPassSystem } from '@libgamerender/systems/mainrenderpass.system';
import { LightcycleSpawner } from '@libgamemodel/lightcycle/lightcyclespawner';

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

    const gameAppService = new GameAppService2(gl, ecs, gameAppUiEventManager);
    // Bootstrap GL resources for initial play before finishing "create"
    await GameAppService2.loadGlResources(gl, ecs, gameAppService.renderProviders_);
    return gameAppService;
  }

  start() {
    const gameOverListener = this.gameAppUiManager.addListener('player-death', () => {
      this.isGameOver_ = true;
      this.gameAppUiManager.removeListener('player-death', gameOverListener);
    });
    this.setFreshEcsState_();
    GameAppService2.initializeSystems_(this.ecs);
    this.ecs.start();
    this.beginRendering();
  }

  restart() {
    this.setFreshEcsState_();
    this.ecs.restart();
  }

  private static initializeSystems_(ecs: ECSManager) {
    // This only needs to be done once if systems are truly stateless

    // TODO (sessamekesh): Move over camera rigging system!

    //
    // Logical Systems
    //
    ecs.addSystem2(LightcycleUpdateSystem2);

    //
    // Render Systems
    //
    ecs.addSystem2(RenderPassResetSystem);
    ecs.addSystem2(LightcycleRenderSystem2);
    ecs.addSystem2(MainRenderPassSystem);
  }

  private static async loadGlResources(
      gl: WebGL2RenderingContext, ecs: ECSManager, rp: GameAppRenderProviders2) {
    //
    // Shaders
    //
    ecs.iterateComponents([ShaderSingletonTag], (entity) => entity.destroy());
    const shadersEntity = ecs.createEntity();
    shadersEntity.addComponent(ShaderSingletonTag);
    shadersEntity.addComponent(LambertShaderComponent, rp.LambertShader.getOrThrow(gl));
    shadersEntity.addComponent(ArenaFloorShaderComponent, rp.ArenaFloorShader.getOrThrow(gl));

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

    //
    // Miscelaneous Objects
    //
    ecs.iterateComponents([RenderResourcesSingletonTag], (entity) => entity.destroy());
    const framebuffersEntity = ecs.createEntity();
    framebuffersEntity.addComponent(RenderResourcesSingletonTag);
    framebuffersEntity.addComponent(
      ArenaFloorReflectionFramebufferComponent, rp.FloorReflectionFramebuffer.getOrThrow(gl));

    const texturesEntity = ecs.createEntity();
    texturesEntity.addComponent(RenderResourcesSingletonTag);
    texturesEntity.addComponent(
      ArenaFloorReflectionTextureComponent, rp.FloorReflectionTexture.getOrThrow(gl));

    const glGlobalsEntity = ecs.createEntity();
    glGlobalsEntity.addComponent(RenderResourcesSingletonTag);
    glGlobalsEntity.addComponent(GLContextComponent, gl);
  }

  private async setFreshEcsState_() {
    const ecs = this.ecs;
    ecs.clearAllEntities();

    GameAppService2.loadGlResources(this.gl, ecs, this.renderProviders_);

    const utilitiesEntity = ecs.createEntity();
    utilitiesEntity.addComponent(
      MathAllocatorsComponent, this.renderProviders_.Vec3Allocator.get(),
      this.renderProviders_.Mat4Allocator.get(), this.renderProviders_.QuatAllocator.get());
    utilitiesEntity.addComponent(
      OwnedMathAllocatorsComponent, this.renderProviders_.OwnedVec3Allocator.get(),
      this.renderProviders_.OwnedMat4Allocator.get(),
      this.renderProviders_.OwnedQuatAllocator.get());
    utilitiesEntity.addComponent(
      SceneNodeFactoryComponent, this.renderProviders_.SceneNodeFactory.get());

    // TODO (sessamekesh): Move all the singletons from here to libgamemodel/libgamerender
    //  because the model and render systems that need them are in those libraries (not here)

    GameAppService2.loadInputResources(ecs, this.gl.canvas as HTMLCanvasElement);

    const gameAppUiEntity = ecs.createEntity();
    gameAppUiEntity.addComponent(UIEventEmitterComponent, this.gameAppUiManager);

    const camera = new BasicCamera(
      vec3.fromValues(5, 10, 5), vec3.fromValues(5, 8, -5), vec3.fromValues(0, 1, 0));
    const floorReflectionCamera = new ReflectionCamera(
      camera, vec3.fromValues(0, -0.5, 0), vec3.fromValues(0, 1, 0),
      this.renderProviders_.Vec3Allocator.get());
    const camerasEntity = ecs.createEntity();
    camerasEntity.addComponent(CameraComponent, camera);
    camerasEntity.addComponent(ReflectionCameraComponent, floorReflectionCamera);

    //
    // Initial player game state
    // TODO (sessamekesh): Clean this up, where does it belong?
    //
    const mainPlayerEntity = LightcycleSpawner.spawnLightcycle(ecs, {
      Position: vec3.fromValues(5, 0, 0),
      Orientation: glMatrix.toRadian(180),
    });
    mainPlayerEntity.addComponent(MainPlayerComponent);
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

    if (GamepadBikeInputController.canUse(navigator)) {
      const gamepadInputController = registerDisposable(
          ioEntity, new GamepadBikeInputController(window, navigator));
      inputManager.addController(gamepadInputController);
    }

    ioEntity.addComponent(BikeInputManagerComponent, inputManager);

    return ioEntity;
  }

  private beginRendering() {
    let lastFrame = performance.now();
    const frame = () => {
      const now = performance.now();
      const msDt = now - lastFrame;
      lastFrame = now;

      this.ecs.update(msDt);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
}