import { mat4, glMatrix, vec3, quat, vec4 } from 'gl-matrix';
import { LambertShader } from '@librender/shader/lambertshader';
import { DracoDecoderCreationOptions } from '@librender/geo/draco/decoderconfig';
import { DracoDecoder } from '@librender/geo/draco/decoder';
import { loadRawBuffer } from '@libutil/loadutils';
import { LambertConverter } from '@librender/geo/draco/lambertconverter';
import { Texture } from '@librender/texture/texture';
import { LightcycleRenderSystem } from '@libgamerender/systems/lightcycle.rendersystem';
import { ECSManager } from '@libecs/ecsmanager';
import { LightcycleSpawnerSystem } from '@libgamemodel/lightcycle/lightcyclespawner.system';
import { TempGroupAllocator } from '@libutil/allocator';
import { SceneNodeFactory } from '@libutil/scene/scenenodefactory';
import { BikeInputManager } from '@io/bikeinput/bikeinputmanager';
import { KeyboardBikeInputController } from '@io/bikeinput/keyboardbikeinputcontroller';
import { KeyboardManager } from '@io/keyboardmanager';
import { LightcycleUpdateSystem } from '@libgamemodel/lightcycle/lightcycleupdate.system';
import { GamepadBikeInputController } from '@io/bikeinput/gamepadbikeinputcontroller';
import { TouchEventBikeInputController } from '@io/bikeinput/toucheventbikeinputcontroller';
import { BasicCamera } from '@libgamemodel/camera/basiccamera';
import { CameraRigSystem } from '@libgamemodel/camera/camerarig.system';
import { FloorTileTexture } from '@librender/texture/floortiletexture';
import { EnvironmentRenderSystem } from '@libgamerender/systems/environment.rendersystem';
import { FrameSettings } from '@libgamerender/framesettings';
import { EnvironmentSystem } from '@libgamemodel/systems/environment.system';
import { WallspawnerSystem } from '@libgamemodel/wall/wallspawner.system';
import { WallRenderSystem } from '@libgamerender/systems/wall.rendersystem';
import { DebugBikeSystem } from '@libgamerender/debug/debugbike.system';
import { GameAppUIEvents } from './gameappuieventmanager';
import { IEventManager } from '@libutil/eventmanager';

const DRACO_CONFIG: DracoDecoderCreationOptions = {
  jsFallbackURL: 'assets/draco3d/draco_decoder.js',
  wasmBinaryURL: 'assets/draco3d/draco_decoder.wasm',
  wasmLoaderURL: 'assets/draco3d/draco_wasm_wrapper.js',
};

// Order of teaching this one:
// Import the geo/texture for stick, wheel
// Draw them (crudely, incorrectly) in the render system
// Implement scene graph objects
// Introduce unit testing, since the scene graph could REALLY use it.

export class GameAppService {
  private clearColor_ = [0, 0, 1];
  private lightColor_ = vec3.fromValues(1, 1, 1);
  private lightDirection_ = vec3.fromValues(0, -1, 0);
  private ambientCoefficient_ = 0.3;
  private isGameOver_ = false;

  private constructor(
    private gl: WebGL2RenderingContext,
    private gameAppUiEventManager: IEventManager<GameAppUIEvents>,
    private ecs: ECSManager,
    private bikeRenderSystem: LightcycleRenderSystem,
    private camera: BasicCamera,
    private environmentRenderSystem: EnvironmentRenderSystem,
    private wallRenderSystem: WallRenderSystem,
    private debugBikeRenderSystem: DebugBikeSystem,
    private onDestroyEvents: Function[]) {}

  static async create(
      gl: WebGL2RenderingContext, gameAppUiEventManager: IEventManager<GameAppUIEvents>) {
    const lambertShader = LambertShader.create(gl);
    if (!lambertShader) {
      throw new Error('Failed to create lambert shader!');
    }

    // Get GL resources
    const dracoDecoder = await DracoDecoder.create(DRACO_CONFIG);
    const bikeRawData = await loadRawBuffer('assets/models/lightcycle_base.drc');
    const bikeWheelData = await loadRawBuffer('assets/models/lightcycle_wheel.drc');
    const bikeStickData = await loadRawBuffer('assets/models/lightcycle_stick.drc');
    const bikeBuffers = dracoDecoder.decodeMesh(bikeRawData, LambertConverter.BUFFER_DESC);
    const bikeWheelBuffers = dracoDecoder.decodeMesh(bikeWheelData, LambertConverter.BUFFER_DESC);
    const bikeStickBuffers = dracoDecoder.decodeMesh(bikeStickData, LambertConverter.BUFFER_DESC);
    const bikeLambertGeo = LambertConverter.generateLambertGeo(
      gl, lambertShader, bikeBuffers.VertexData, bikeBuffers.IndexData);
    const bikeWheelGeo = LambertConverter.generateLambertGeo(
      gl, lambertShader, bikeWheelBuffers.VertexData, bikeWheelBuffers.IndexData);
    const bikeStickGeo = LambertConverter.generateLambertGeo(
      gl, lambertShader, bikeStickBuffers.VertexData, bikeStickBuffers.IndexData);
    if (!bikeLambertGeo || !bikeWheelGeo || !bikeStickGeo) {
      throw new Error('Could not generate bike lambert geometry');
    }
    const bikeTexture = await Texture.createFromURL(gl, 'assets/models/lightcycle_base_diffuse.png');
    const bikeWheelTexture = await Texture.createFromURL(gl, 'assets/models/lightcycle_wheel_diffuse.png');
    const floorTexture = FloorTileTexture.create(
      gl, vec4.fromValues(0.005, 0.005, 0.005, 1), vec4.fromValues(0.5, 0.5, 0.45, 0), 256, 256, 2, 3, 2, 3);
    const wallTexture = FloorTileTexture.create(
      gl, vec4.fromValues(0.1, 0.1, 0.98, 1), vec4.fromValues(0, 0, 1, 1), 32, 32, 8, 8, 8, 8);
    const wallGeo = WallRenderSystem.generateWallGeo(gl, lambertShader, 1, 1);

    // Utility objects
    const vec3Allocator = new TempGroupAllocator(vec3.create);
    const mat4Allocator = new TempGroupAllocator(mat4.create);
    const quatAllocator = new TempGroupAllocator(quat.create);
    const sceneNodeFactory = new SceneNodeFactory(mat4Allocator, quatAllocator);

    // I/O
    const inputManager = new BikeInputManager();
    const keyboardManager = new KeyboardManager(document.body); // TODO (sessamekesh): Destroy
    const keyboardInputController = new KeyboardBikeInputController(keyboardManager); // TODO (sessamekesh): Destroy
    const touchInputController = new TouchEventBikeInputController(gl.canvas as HTMLCanvasElement);
    if (GamepadBikeInputController.canUse(navigator)) {
      inputManager.addController(new GamepadBikeInputController(window, navigator)); // TODO (sessamekesh): Destroy
    }
    inputManager.addController(keyboardInputController);
    inputManager.addController(touchInputController);
    const camera = new BasicCamera(vec3.fromValues(13, 6, 8), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));

    // ECS + systems
    const ecs = new ECSManager();
    const lightcycleSpawnerSystem = ecs.addSystem(new LightcycleSpawnerSystem(sceneNodeFactory));
    const bikeRenderSystem = ecs.addSystem(new LightcycleRenderSystem(
      lambertShader, bikeLambertGeo, bikeWheelGeo, bikeStickGeo,
      bikeTexture, bikeWheelTexture, bikeWheelTexture,
      sceneNodeFactory, mat4Allocator));
    const lightcycleUpdateSystem = ecs.addSystem(
      new LightcycleUpdateSystem(inputManager, vec3Allocator, sceneNodeFactory));
    const cameraRiggingSystem = ecs.addSystem(new CameraRigSystem(
      vec3Allocator, sceneNodeFactory, 55, 12, 4.5));
    const environmentSystem = ecs.addSystem(new EnvironmentSystem());
    const environmentRenderSystem = ecs.addSystem(new EnvironmentRenderSystem(lambertShader, 0.15, floorTexture));
    ecs.addSystem(new WallspawnerSystem(vec3Allocator));
    const wallRenderSystem = ecs.addSystem(new WallRenderSystem(
      lambertShader, wallGeo, sceneNodeFactory, vec3Allocator, mat4Allocator, wallTexture));
    // DEBUGGING
    const debugBikeRenderSystem = ecs.addSystem(new DebugBikeSystem(lambertShader, mat4Allocator));
    // END DEBUGGING
    if (!ecs.start()) {
      throw new Error('Failed to start all ECS systems, check output');
    }

    // Initial game state
    environmentSystem.spawnFloor(ecs, 400, 400);
    const playerCycle = lightcycleSpawnerSystem.spawnLightcycle(ecs, {
      Position: vec3.fromValues(5, 0, 0),
      Orientation: glMatrix.toRadian(180),
    });
    lightcycleUpdateSystem.setPlayerCycle(playerCycle);
    cameraRiggingSystem.attachToLightcycle(playerCycle, vec3.fromValues(0, 7, -18), camera);

    // UI State
    const onDestroyEvents: Function[] = [];
    const playerHealthChangeListener = lightcycleUpdateSystem.addListener(
      'playerhealthchange',
      (playerHealthEvent) => {
        gameAppUiEventManager.fireEvent('playerhealth', {
          CurrentHealth: playerHealthEvent.CurrentHealth,
          MaxHealth: playerHealthEvent.MaxHealth,
        });
      });
    const playerDeathListener = lightcycleUpdateSystem.addListener(
      'death',
      (deathEvent) => {
        gameAppUiEventManager.fireEvent('player-death', true);
      });
    onDestroyEvents.push(() => {
      lightcycleUpdateSystem.removeListener('playerhealthchange', playerHealthChangeListener);
      lightcycleUpdateSystem.removeListener('death', playerDeathListener);
    });
    gameAppUiEventManager.fireEvent('playerhealth', { MaxHealth: 100, CurrentHealth: 100, });

    return new GameAppService(
      gl, gameAppUiEventManager, ecs,
      bikeRenderSystem, camera, environmentRenderSystem, wallRenderSystem, debugBikeRenderSystem,
      onDestroyEvents);
  }

  start() {
    const gameOverListener = this.gameAppUiEventManager.addListener('player-death', () => {
      this.isGameOver_ = true;
    });
    this.onDestroyEvents.push(() => {
      this.gameAppUiEventManager.removeListener('player-death', gameOverListener);
    });

    let lastFrame = performance.now();
    const frame = () => {
      const now = performance.now();
      const millisecondsElapsed = now - lastFrame;
      lastFrame = now;

      this.ecs.update(millisecondsElapsed);
      this.drawFrame();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  restart() {
    if (this.isGameOver_) {
      const lightcycleSpawner = this.ecs.getSystem(LightcycleSpawnerSystem);
      const lightcycleUpdateSystem = this.ecs.getSystem(LightcycleUpdateSystem);
      const cameraRiggingSystem = this.ecs.getSystem(CameraRigSystem);

      if (lightcycleSpawner && lightcycleUpdateSystem && cameraRiggingSystem) {
        const playerCycle = lightcycleSpawner.spawnLightcycle(this.ecs, {
          Position: vec3.fromValues(5, 0, 0),
          Orientation: glMatrix.toRadian(180),
        });
        lightcycleUpdateSystem.setPlayerCycle(playerCycle);
        cameraRiggingSystem.attachToLightcycle(
          playerCycle, vec3.fromValues(0, 7, -18), this.camera);
        this.gameAppUiEventManager.fireEvent('player-death', false);
      } else {
        console.error(
          'Could not restart game - missing required systems (spawner/update/rigging):',
          lightcycleSpawner, lightcycleUpdateSystem, cameraRiggingSystem);
      }
    }
  }

  drawFrame() {
    const gl = this.gl;

    // Cast: Narrows from type (HTMLCanvasElement | OffscreenCanvas)
    gl.canvas.width = (gl.canvas as HTMLCanvasElement).clientWidth * window.devicePixelRatio;
    gl.canvas.height = (gl.canvas as HTMLCanvasElement).clientHeight * window.devicePixelRatio;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(this.clearColor_[0], this.clearColor_[1], this.clearColor_[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    const perspectiveProjectionValue = this.getPerspectiveProjectionMatrixValue();
    const cameraValue = this.getCameraMatrixValue();
    const frameSettings: FrameSettings = {
      AmbientCoefficient: this.ambientCoefficient_,
      LightColor: this.lightColor_,
      LightDirection: this.lightDirection_,
      MatProj: perspectiveProjectionValue,
      MatView: cameraValue,
    };
    this.bikeRenderSystem.render(gl, this.ecs, frameSettings);
    this.environmentRenderSystem.render(gl, this.ecs, frameSettings);
    this.wallRenderSystem.render(gl, this.ecs, frameSettings);
    this.debugBikeRenderSystem.render(gl, this.ecs, frameSettings);
  }

  changeClearColor() {
    this.clearColor_[0] = 1 - this.clearColor_[0];
    this.clearColor_[2] = 1 - this.clearColor_[2];
  }

  private perspectiveProjectionMatrixValue_ = mat4.create();
  private getPerspectiveProjectionMatrixValue(): mat4 {
    mat4.perspective(
      this.perspectiveProjectionMatrixValue_,
      glMatrix.toRadian(45),
      this.gl.canvas.width / this.gl.canvas.height,
      0.01, 1000.0);
    return this.perspectiveProjectionMatrixValue_;
  }

  private cameraMatrixValue_ = mat4.create();
  private getCameraMatrixValue(): mat4 {
    this.camera.matView(this.cameraMatrixValue_);
    return this.cameraMatrixValue_;
  }

  destroy() {
    // TODO (sessamekesh): Fill in this method
    this.onDestroyEvents.forEach(_=>_());
  }
}
