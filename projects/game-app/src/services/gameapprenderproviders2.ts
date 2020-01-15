import { LambertShader } from '@librender/shader/lambertshader';
import { DracoDecoderCreationOptions } from '@librender/geo/draco/decoderconfig';
import { AsyncRenderProvider, RenderProvider, Provider } from '@librender/renderprovider';
import { DracoDecoder } from '@librender/geo/draco/decoder';
import { ArenaFloorShader } from '@librender/shader/arenafloorshader';
import { loadRawBuffer } from '@libutil/loadutils';
import { LambertConverter } from '@librender/geo/draco/lambertconverter';
import { Texture } from '@librender/texture/texture';
import { WallRenderSystem } from '@libgamerender/systems/wall.rendersystem';
import { Framebuffer } from '@librender/texture/framebuffer';
import { TempGroupAllocator, LifecycleOwnedAllocator } from '@libutil/allocator';
import { vec3, mat4, quat } from 'gl-matrix';
import { SceneNodeFactory } from '@libutil/scene/scenenodefactory';

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
  readonly WallGeo = new RenderProvider((gl) => {
    const lambertShader = this.LambertShader.get(gl);
    if (!lambertShader) return null;
    return WallRenderSystem.generateWallGeo(gl, lambertShader, 1, 1);
  });

  //
  // Textures (non-framebuffer)
  //
  readonly BikeBodyTexture = new AsyncRenderProvider(
    (gl) => Texture.createFromURL(gl, 'assets/models/lightcycle_base_diffuse.png'));
  readonly BikeWheelTexture = new AsyncRenderProvider(
    (gl) => Texture.createFromURL(gl, 'assets/models/lightcycle_wheel_diffuse.png'));

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
  readonly Vec3Allocator = new Provider(() => new TempGroupAllocator(vec3.create));
  readonly Mat4Allocator = new Provider(() => new TempGroupAllocator(mat4.create));
  readonly QuatAllocator = new Provider(() => new TempGroupAllocator(quat.create));
  readonly OwnedVec3Allocator = new Provider(() => new LifecycleOwnedAllocator(vec3.create));
  readonly OwnedMat4Allocator = new Provider(() => new LifecycleOwnedAllocator(mat4.create));
  readonly OwnedQuatAllocator = new Provider(() => new LifecycleOwnedAllocator(quat.create));
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
