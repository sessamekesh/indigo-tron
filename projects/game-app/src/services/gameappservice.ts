import { mat4, glMatrix, vec3 } from 'gl-matrix';
import { LambertShader } from '@librender/shader/lambertshader';
import { DracoDecoderCreationOptions } from '@librender/geo/draco/decoderconfig';
import { DracoDecoder } from '@librender/geo/draco/decoder';
import { loadRawBuffer } from '@libutil/loadutils';
import { LambertConverter } from '@librender/geo/draco/lambertconverter';
import { Texture } from '@librender/geo/texture';
import { LightcycleRenderSystem } from '@libgamerender/systems/lightcycle.rendersystem';
import { ECSManager } from '@libecs/ecsmanager';
import { LightcycleSpawnerSystem } from '@libgamemodel/systems/lightcyclespawner.system';

const DRACO_CONFIG: DracoDecoderCreationOptions = {
  jsFallbackURL: '/assets/draco3d/draco_decoder.js',
  wasmBinaryURL: '/assets/draco3d/draco_decoder.wasm',
  wasmLoaderURL: '/assets/draco3d/draco_wasm_wrapper.js',
};

// Order of teaching this one:
// - Create ECS library
// - Create libgamemodel for logical game stuff
// - Create libgamerender for rendering stuff
// - Implement them in the GameAppService

export class GameAppService {
  private clearColor_ = [0, 0, 1];
  private lightColor_ = vec3.fromValues(1, 1, 1);
  private lightDirection_ = vec3.fromValues(0, -1, 0);
  private ambientCoefficient_ = 0.3;

  private constructor(
    private gl: WebGL2RenderingContext,
    private ecs: ECSManager,
    private bikeRenderSystem: LightcycleRenderSystem) {}

  static async create(gl: WebGL2RenderingContext) {
    const lambertShader = LambertShader.create(gl);
    if (!lambertShader) {
      throw new Error('Failed to create lambert shader!');
    }

    const dracoDecoder = await DracoDecoder.create(DRACO_CONFIG);
    const bikeRawData = await loadRawBuffer('/assets/models/lightcycle_base.drc');
    const bikeBuffers = dracoDecoder.decodeMesh(bikeRawData, LambertConverter.BUFFER_DESC);
    const bikeLambertGeo = LambertConverter.generateLambertGeo(
      gl, lambertShader, bikeBuffers.VertexData, bikeBuffers.IndexData);
    if (!bikeLambertGeo) {
      throw new Error('Could not generate bike lambert geometry');
    }
    const bikeTexture = await Texture.createFromURL(gl, '/assets/models/lightcycle_base_diffuse.png');

    const lightcycleInitialConfig = {
      Lightcycles: [{
        Position: vec3.fromValues(5, 0, 0),
        Orientation: 270,
      }, {
        Position: vec3.fromValues(-5, 0, 0),
        Orientation: 90,
      }, {
        Position: vec3.fromValues(0, 0, 5),
        Orientation: 180,
      }, {
        Position: vec3.fromValues(0, 0, -5),
        Orientation: 0,
      }],
    };

    const ecs = new ECSManager();
    ecs.addSystem(new LightcycleSpawnerSystem(lightcycleInitialConfig));
    const bikeRenderSystem = ecs.addSystem(new LightcycleRenderSystem(lambertShader, bikeLambertGeo, bikeTexture));
    if (!ecs.start()) {
      throw new Error('Failed to start all ECS systems, check output');
    }

    return new GameAppService(gl, ecs, bikeRenderSystem);
  }

  start() {
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
    this.bikeRenderSystem.render(gl, this.ecs, {
      AmbientCoefficient: this.ambientCoefficient_,
      LightColor: this.lightColor_,
      LightDirection: this.lightDirection_,
      MatProj: perspectiveProjectionValue,
      MatView: cameraValue,
    });
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
      0.01, 100.0);
    return this.perspectiveProjectionMatrixValue_;
  }

  private cameraMatrixValue_ = mat4.create();
  private getCameraMatrixValue(): mat4 {
    mat4.lookAt(
      this.cameraMatrixValue_,
      vec3.fromValues(12, 12, 15.5),
      vec3.fromValues(0, 0, 0),
      vec3.fromValues(0, 1, 0));
    return this.cameraMatrixValue_;
  }
}
