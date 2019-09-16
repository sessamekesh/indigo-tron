import { mat4, glMatrix, vec3 } from 'gl-matrix';
import { TriangleShader } from '@librender/shader/triangleshader';
import { TriangleGeo } from '@librender/geo/trianglegeo';
import { LambertShader } from '@librender/shader/lambertshader';
import { LambertGeo } from '@librender/geo/lambertgeo';
import { DracoDecoderCreationOptions } from '@librender/geo/draco/decoderconfig';
import { DracoDecoder } from '@librender/geo/draco/decoder';
import { loadRawBuffer } from '@libutil/loadutils';
import { LambertConverter } from '@librender/geo/draco/lambertconverter';
import { Texture } from '@librender/geo/texture';

const DRACO_CONFIG: DracoDecoderCreationOptions = {
  jsFallbackURL: '/assets/draco3d/draco_decoder.js',
  wasmBinaryURL: '/assets/draco3d/draco_decoder.wasm',
  wasmLoaderURL: '/assets/draco3d/draco_wasm_wrapper.js',
};

// Order of teaching this one:
// - Move "create shader" code to ShaderUtils.ts
// - Create TypeScript paths (point out that it will help proper isolation later)
// - Create triangleshader.ts, use for draw code instead of main
// - Create trianglegeo.ts, use for geometry data instead of main
// - Create lambertshader.ts and lambertgeo.ts, but do not use yet (next step)
// - Create dracodecoder.ts, use to import geometry data from an external file
// - Draw that geometry.
// - Add in texture information

export class GameAppService {
  private clearColor_ = [0, 0, 1];
  private constructor(
    private gl: WebGL2RenderingContext,
    private triangleShader: TriangleShader,
    private triangleGeo: TriangleGeo,
    private lambertShader: LambertShader,
    private bikeGeo: LambertGeo,
    private bikeTexture: Texture) {}

  static async create(gl: WebGL2RenderingContext) {
    const triangleShader = TriangleShader.create(gl);
    if (!triangleShader) {
      throw new Error('Failed to initialize triangle shader!');
    }
    const {Pos, Color} = triangleShader.getAttribLocations();
    const triangleGeo = TriangleGeo.create(gl, Pos, Color);
    if (!triangleGeo) {
      throw new Error('Failed to initialize triangle geometry!');
    }

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

    return new GameAppService(gl, triangleShader, triangleGeo, lambertShader, bikeLambertGeo, bikeTexture);
  }

  start() {
    let lastFrame = performance.now();
    const frame = () => {
      const now = performance.now();
      const millisecondsElapsed = now - lastFrame;
      lastFrame = now;

      this.drawFrame(millisecondsElapsed);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  drawFrame(millisecondsElapsed: number) {
    const gl = this.gl;

    gl.canvas.width = gl.canvas.clientWidth * window.devicePixelRatio;
    gl.canvas.height = gl.canvas.clientHeight * window.devicePixelRatio;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(this.clearColor_[0], this.clearColor_[1], this.clearColor_[2], 1);
    // REMEMBER: Demonstrate this _after_ switching to perspective projection
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    this.triangleShader.activate(gl);
    const perspectiveProjectionValue = this.getPerspectiveProjectionMatrixValue();
    const cameraValue = this.getCameraMatrixValue();
    this.getTriangleOffsetValue(millisecondsElapsed);
    const worldValue = this.getWorldMatrixValue(millisecondsElapsed);
    this.triangleShader.render(gl, {
      Geo: this.triangleGeo,
      NumVertices: 6,
      MatCamera: cameraValue,
      MatProj: perspectiveProjectionValue,
      MatWorld: worldValue,
    });

    this.lambertShader.activate(gl);
    this.lambertShader.render(gl, {
      AmbientCoefficient: 0.3,
      Geo: this.bikeGeo,
      LightColor: vec3.fromValues(1, 1, 1),
      LightDirection: vec3.fromValues(0, -1, 0),
      MatProj: perspectiveProjectionValue,
      MatView: cameraValue,
      MatWorld: worldValue,
      DiffuseTexture: this.bikeTexture,
      // SurfaceColor: vec3.fromValues(0.8, 0.4, 0.5),
    });
  }

  changeClearColor() {
    this.clearColor_[0] = 1 - this.clearColor_[0];
    this.clearColor_[2] = 1 - this.clearColor_[2];
  }

  private triangleOffset_ = [0.3, 0];
  private goalTriangleOffset_ = [0.3, 0];
  private velocity_ = 0.35;
  private getTriangleOffsetValue(millisecondsElapsed: number) {
    if (this.triangleOffset_[0] !== this.goalTriangleOffset_[0]) {
      const dist = this.goalTriangleOffset_[0] - this.triangleOffset_[0];
      const max = this.velocity_ * millisecondsElapsed/1000;
      if (Math.abs(dist) <= max) {
        this.triangleOffset_[0] = this.goalTriangleOffset_[0];
      } else {
        this.triangleOffset_[0] += dist * (max / Math.abs(dist));
      }
    }

    if (this.triangleOffset_[1] !== this.goalTriangleOffset_[1]) {
      const dist = this.goalTriangleOffset_[1] - this.triangleOffset_[1];
      const max = this.velocity_ * millisecondsElapsed/1000;
      if (Math.abs(dist) <= max) {
        this.triangleOffset_[1] = this.goalTriangleOffset_[1];
      } else {
        this.triangleOffset_[1] += dist * (max / Math.abs(dist));
      }
    }

    if (this.triangleOffset_[2] !== this.goalTriangleOffset_[2]) {
      const dist = this.goalTriangleOffset_[2] - this.triangleOffset_[2];
      const max = this.velocity_ * millisecondsElapsed;
      if (Math.abs(dist) <= max) {
        this.triangleOffset_[2] = this.goalTriangleOffset_[2];
      } else {
        this.triangleOffset_[2] += dist * (max / Math.abs(dist));
      }
    }
    return this.triangleOffset_;
  }

  private perspectiveProjectionMatrixValue_ = mat4.create();
  private getPerspectiveProjectionMatrixValue(): mat4 {
    // Teaching note: Use this first (to demonstrate an ortho projection identical to using no projection at all)
    // Then, teach cameras, and THEN implement perspective
    // mat4.ortho(
    //   this.perspectiveProjectionMatrixValue_,
    //   -1, 1,
    //   -1, 1,
    //   -1, 1);
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
      vec3.fromValues(6, 0, 7.5),
      vec3.fromValues(0, 0, 0),
      vec3.fromValues(0, 1, 0));
    return this.cameraMatrixValue_;
  }

  moveTriangles() {
    this.goalTriangleOffset_[0] *= -1;
  }

  private worldMatrixValue_ = mat4.create();
  private zOffsetTicks = 0;
  private getWorldMatrixValue(millisecondsElapsed): mat4 {
    this.zOffsetTicks += millisecondsElapsed * 0.001;
    mat4.fromTranslation(this.worldMatrixValue_, vec3.fromValues(this.triangleOffset_[0], this.triangleOffset_[1], Math.sin(this.zOffsetTicks)));
    return this.worldMatrixValue_;
  }
}
