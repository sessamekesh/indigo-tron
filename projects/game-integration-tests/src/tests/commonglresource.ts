import { DracoDecoderCreationOptions, BufferData } from "@librender/geo/draco/decoderconfig";
import { DracoDecoder } from '@librender/geo/draco/decoder';
import { loadRawBuffer } from '@libutil/loadutils';
import { LambertShader } from '@librender/shader/lambertshader';
import { LambertConverter } from '@librender/geo/draco/lambertconverter';
import { IBData } from '@librender/geo/ibdesc';
import { Texture } from '@librender/texture/texture';
import { FloorTileTexture } from '@librender/texture/floortiletexture';
import { vec4 } from 'gl-matrix';
import { WallRenderSystem } from '@libgamerender/systems/wall.rendersystem';

class AsyncResourceProvider<T> {
  private val_: T|null = null;

  constructor(private genFn: (()=>Promise<T>)) {}

  async get(): Promise<T> {
    if (this.val_ == null) {
      this.val_ = await this.genFn();
    }
    return this.val_;
  }
}

class GLResourceProvider<T> {
  private val_: T|null = null;
  private gl_: WebGL2RenderingContext|null = null;

  constructor(private genFn: ((gl: WebGL2RenderingContext)=>(T|null))) {}

  get(gl: WebGL2RenderingContext): T {
    if (this.val_ == null || this.gl_ !== gl) {
      this.val_ = this.genFn(gl);
      this.gl_ = gl;
    }

    if (this.val_ == null) {
      throw new Error('Failed to provision GL resource');
    }

    return this.val_;
  }
}

class AsyncGLResourceProvider<T> {
  private val_: T|null = null;
  private gl_: WebGL2RenderingContext|null = null;

  constructor(private genFn: ((gl: WebGL2RenderingContext)=>(Promise<T|null>))) {}

  async get(gl: WebGL2RenderingContext): Promise<T> {
    if (this.val_ == null || this.gl_ !== gl) {
      this.val_ = await this.genFn(gl);
      this.gl_ = gl;
    }

    if (this.val_ == null) {
      throw new Error('Failed to provision GL resource');
    }

    return this.val_;
  }
}

const DRACO_CONFIG: DracoDecoderCreationOptions = {
  jsFallbackURL: 'assets/draco3d/draco_decoder.js',
  wasmBinaryURL: 'assets/draco3d/draco_decoder.wasm',
  wasmLoaderURL: 'assets/draco3d/draco_wasm_wrapper.js',
};

function _LambertConversionFn(resource: AsyncResourceProvider<ArrayBuffer>) {
  return async (gl: WebGL2RenderingContext) => {
    const dracoDecoder = await CommonGLResource.DracoDecoder.get();
    const buffer = await resource.get();
    return dracoDecoder.decodeMesh(buffer, LambertConverter.BUFFER_DESC);
  };
}

function _LambertGeoProvider(
    resource: AsyncGLResourceProvider<{VertexData: BufferData[], IndexData: IBData}>,
    shader: GLResourceProvider<LambertShader>) {
  return new AsyncGLResourceProvider(async (gl) => {
    const lambertShader = shader.get(gl);
    const buffers = await resource.get(gl);
    return LambertConverter.generateLambertGeo(gl, lambertShader, buffers.VertexData, buffers.IndexData);
  });
}

export class CommonGLResource {
  static DracoDecoder = new AsyncResourceProvider(() => DracoDecoder.create(DRACO_CONFIG));
  static LambertShader = new GLResourceProvider((gl) => LambertShader.create(gl));

  static BikeRawData = new AsyncResourceProvider(() => loadRawBuffer('assets/models/lightcycle_base.drc'));
  static BikeWheelData = new AsyncResourceProvider(() => loadRawBuffer('assets/models/lightcycle_wheel.drc'));
  static BikeStickData = new AsyncResourceProvider(() => loadRawBuffer('assets/models/lightcycle_stick.drc'));
  static BikeBodyBuffers = new AsyncGLResourceProvider(_LambertConversionFn(CommonGLResource.BikeRawData));
  static BikeWheelBuffers = new AsyncGLResourceProvider(_LambertConversionFn(CommonGLResource.BikeWheelData));
  static BikeStickBuffers = new AsyncGLResourceProvider(_LambertConversionFn(CommonGLResource.BikeStickData));
  static BikeBodyLambertGeo = _LambertGeoProvider(CommonGLResource.BikeBodyBuffers, CommonGLResource.LambertShader);
  static BikeWheelLambertGeo = _LambertGeoProvider(CommonGLResource.BikeWheelBuffers, CommonGLResource.LambertShader);
  static BikeStickLambertGeo = _LambertGeoProvider(CommonGLResource.BikeStickBuffers, CommonGLResource.LambertShader);
  static BikeTexture = new AsyncGLResourceProvider((gl) => Texture.createFromURL(gl, 'assets/models/lightcycle_base_diffuse.png'));
  static BikeWheelTexture = new AsyncGLResourceProvider((gl) => Texture.createFromURL(gl, 'assets/models/lightcycle_wheel_diffuse.png'));

  static FloorTexture = new GLResourceProvider((gl) => FloorTileTexture.create(gl, vec4.fromValues(0.005, 0.005, 0.005, 1), vec4.fromValues(0.5, 0.5, 0.45, 0), 256, 256, 2, 3, 2, 3));
  static WallTexture = new GLResourceProvider((gl) => FloorTileTexture.create(gl, vec4.fromValues(0.1, 0.1, 0.98, 1), vec4.fromValues(0, 0, 1, 1), 32, 32, 8, 8, 8, 8));
  static WallGeo = new GLResourceProvider((gl) => WallRenderSystem.generateWallGeo(gl, CommonGLResource.LambertShader.get(gl), 1, 1));
}
