import { LambertGeo } from '@librender/geo/lambertgeo';
import { Texture } from '@librender/texture/texture';
import { Framebuffer } from '@librender/texture/framebuffer';
import { ECSManager } from '@libecs/ecsmanager';
import { DracoDecoder } from '@librender/geo/draco/decoder';
import { loadRawBuffer } from '@libutil/loadutils';
import { LambertShader } from '@librender/shader/lambertshader';
import { LambertConverter } from '@librender/geo/draco/lambertconverter';

//
// Game-specific singleton component definitions
//
export class LightcycleLambertRenderResourcesComponent {
  constructor(
    public readonly Body: LambertGeo,
    public readonly Wheel: LambertGeo,
    public readonly Stick: LambertGeo,
    public readonly BodyTexture: Texture,
    public readonly WheelTexture: Texture,
    public readonly StickTexture: Texture) {}

  static async upsertSingletonFromURLs(
      ecs: ECSManager,
      gl: WebGL2RenderingContext,
      dracoDecoder: DracoDecoder,
      lambertShader: LambertShader,
      settings: {
        bodyGeoUrl: string,
        wheelGeoUrl: string,
        stickGeoUrl: string,
        bodyTextureUrl: string,
        wheelTextureUrl: string,
        stickTextureUrl: string,
      }) {
    // Notice: There's an inefficiency here if two textures from the same URL are used. Really,
    // there should be a texture manager that is responsible for giving resources and holding onto
    // them for the duration of initialization time.
    const existing = ecs.getSingletonComponent(LightcycleLambertRenderResourcesComponent);
    if (existing) return existing;

    const [
      bodyTexture,
      wheelTexture,
      stickTexture,
      bodyGeo,
      wheelGeo,
      stickGeo,
    ] = await Promise.all([
      Texture.createFromURL(gl, settings.bodyTextureUrl),
      Texture.createFromURL(gl, settings.wheelTextureUrl),
      Texture.createFromURL(gl, settings.stickTextureUrl),
      this.loadBikeLambertGeo(gl, dracoDecoder, lambertShader, settings.bodyGeoUrl),
      this.loadBikeLambertGeo(gl, dracoDecoder, lambertShader, settings.wheelGeoUrl),
      this.loadBikeLambertGeo(gl, dracoDecoder, lambertShader, settings.stickGeoUrl),
    ]);

    const e = ecs.createEntity();
    return e.addComponent(
      LightcycleLambertRenderResourcesComponent,
      bodyGeo, wheelGeo, stickGeo,
      bodyTexture, wheelTexture, stickTexture);
  }

  private static async loadBikeLambertGeo(
      gl: WebGL2RenderingContext,
      dracoDecoder: DracoDecoder,
      lambertShader: LambertShader,
      src: string) {
    const rawData = await loadRawBuffer(src);
    const buffers = dracoDecoder.decodeMesh(rawData, LambertConverter.BUFFER_DESC);
    return LambertConverter.generateLambertGeo(
      gl, lambertShader, buffers.VertexData, buffers.IndexData);
  }
}

export class ArenaFloorReflectionFramebufferComponent {
  constructor(public readonly FBO: Framebuffer) {}

  static upsertSingleton(ecs: ECSManager, gl: WebGL2RenderingContext, textureWidth: number) {
    const texComponent = ArenaFloorReflectionTextureComponent.upsertSingleton(ecs, gl, textureWidth);

    const f = Framebuffer.create(gl, {
      AttachedTexture: texComponent.Texture, ColorAttachment: 0, DepthEnabled: true,
    });
    if (!f) throw new Error('Failed to create ArenaFloorReflectionFramebufferComponent');

    const e = ecs.createEntity();
    return e.addComponent(ArenaFloorReflectionFramebufferComponent, f);
  }
}

export class ArenaFloorReflectionTextureComponent {
  constructor(public readonly Texture: Texture) {}

  static upsertSingleton(ecs: ECSManager, gl: WebGL2RenderingContext, textureWidth: number) {
    const existing = ecs.getSingletonComponent(ArenaFloorReflectionTextureComponent);
    if (existing) return existing;

    const tex = Texture.createEmptyTexture(gl, textureWidth, textureWidth, 'rgba32');
    if (!tex) throw new Error('Failed to create ArenaFloorReflectionTextureComponent');

    const e = ecs.createEntity();
    return e.addComponent(ArenaFloorReflectionTextureComponent, tex);
  }
}

export class GLContextComponent {
  constructor(public gl: WebGL2RenderingContext) {}
}
