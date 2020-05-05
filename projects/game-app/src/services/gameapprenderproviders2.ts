import { LambertShader } from '@librender/shader/lambertshader';
import { DracoDecoderCreationOptions } from '@librender/geo/draco/decoderconfig';
import { AsyncRenderProvider, RenderProvider, Provider } from '@librender/renderprovider';
import { DracoDecoder } from '@librender/geo/draco/decoder';
import { ArenaFloorShader } from '@librender/shader/arenafloorshader';
import { loadRawBuffer } from '@libutil/loadutils';
import { LambertConverter } from '@librender/geo/draco/lambertconverter';
import { Texture } from '@librender/texture/texture';
import { Framebuffer } from '@librender/texture/framebuffer';
import { TempGroupAllocator, LifecycleOwnedAllocator } from '@libutil/allocator';
import { vec3, mat4, quat, vec2, vec4 } from 'gl-matrix';
import { SceneNodeFactory } from '@libutil/scene/scenenodefactory';
import { FloorTileTexture } from '@librender/texture/floortiletexture';
import { Plane } from '@libgamemodel/physics/plane';
import { Circle3 } from '@libutil/math/circle3';

//
// Configuration Constants
//
const DRACO_CONFIG: DracoDecoderCreationOptions = {
  jsFallbackURL: 'assets/draco3d/draco_decoder.js',
  wasmBinaryURL: 'assets/draco3d/draco_decoder.wasm',
  wasmLoaderURL: 'assets/draco3d/draco_wasm_wrapper.js',
};
const REFLECTION_FRAMEBUFFER_TEXTURE_WIDTH = 512;

//
// Render providers class (entry point to all this)
//
export class GameAppRenderProviders2 {
  //
  // Shaders
  //
  readonly LambertShader = LambertShader.getRenderProvider();
  readonly ArenaFloorShader = ArenaFloorShader.getRenderProvider();

  //
  // Geometry
  //
  readonly DracoProvider = new AsyncRenderProvider(() => DracoDecoder.create(DRACO_CONFIG));
  readonly BikeBodyLambertGeo = this.lambertGeoProvider('assets/models/lightcycle_base.drc');
  readonly BikeWheelLambertGeo = this.lambertGeoProvider('assets/models/lightcycle_wheel.drc');
  readonly BikeStickLambertGeo = this.lambertGeoProvider('assets/models/lightcycle_stick.drc');

  //
  // Textures (non-framebuffer)
  //
  readonly BikeBodyTexture = new AsyncRenderProvider(
    (gl) => Texture.createFromURL(gl, 'assets/models/lightcycle_base_diffuse.png'));
  readonly BikeWheelTexture = new AsyncRenderProvider(
    (gl) => Texture.createFromURL(gl, 'assets/models/lightcycle_wheel_diffuse.png'));
  readonly RoughTileTexture = new AsyncRenderProvider(
    (gl) => Texture.createFromURL(gl, 'assets/textures/roughtiles_bump.jpg', {
      MagFilter: 'linear',
      MinFilter: 'linear',
      WrapU: 'repeat',
      WrapV: 'repeat',
    }));
  readonly FlatBumpmapDebugTexture = new RenderProvider(
    (gl) => Texture.createFromData(gl, 1, 1, new Uint8Array([127, 127, 255, 255])));

  //
  // Framebuffers (and associated textures)
  //
  readonly FloorReflectionTexture = new RenderProvider(
    (gl) => Texture.createEmptyTexture(
      gl, REFLECTION_FRAMEBUFFER_TEXTURE_WIDTH, REFLECTION_FRAMEBUFFER_TEXTURE_WIDTH, 'rgba32'));
  readonly FloorReflectionFramebuffer = new RenderProvider((gl) => {
    const floorReflectionTexture = this.FloorReflectionTexture.get(gl);
    if (!floorReflectionTexture) return null;
    return Framebuffer.create(gl, {
      AttachedTexture: floorReflectionTexture, ColorAttachment: 0, DepthEnabled: true
    });
  });

  //
  // Utility Objects
  //
  readonly Vec2Allocator = new Provider(() => new TempGroupAllocator(vec2.create));
  readonly Vec3Allocator = new Provider(() => new TempGroupAllocator(vec3.create));
  readonly Mat4Allocator = new Provider(() => new TempGroupAllocator(mat4.create));
  readonly QuatAllocator = new Provider(() => new TempGroupAllocator(quat.create));
  readonly CircleAllocator = new Provider(() => new TempGroupAllocator(
    () => new Circle3(vec3.create(), vec3.create(), 0)));
  readonly OwnedVec2Allocator = new Provider(() => new LifecycleOwnedAllocator(vec2.create));
  readonly OwnedVec3Allocator = new Provider(() => new LifecycleOwnedAllocator(vec3.create));
  readonly OwnedMat4Allocator = new Provider(() => new LifecycleOwnedAllocator(mat4.create));
  readonly OwnedQuatAllocator = new Provider(() => new LifecycleOwnedAllocator(quat.create));
  readonly PlaneAllocator = new Provider(() => new LifecycleOwnedAllocator(Plane.defaultPlane));
  readonly SceneNodeFactory = new Provider(
    () => new SceneNodeFactory(this.Mat4Allocator.get(), this.QuatAllocator.get()));

  //
  // Helpers
  //
  private lambertGeoProvider(src: string) {
    return new AsyncRenderProvider(async (gl) => {
      const rawData = await loadRawBuffer(src);
      const dracoDecoder = await this.DracoProvider.get(gl);
      const lambertShader = this.LambertShader.get(gl);
      if (!dracoDecoder || !lambertShader) return null;
      const buffers = dracoDecoder.decodeMesh(rawData, LambertConverter.BUFFER_DESC);
      return LambertConverter.generateLambertGeo(
        gl, lambertShader, buffers.VertexData, buffers.IndexData);
    });
  }
}
