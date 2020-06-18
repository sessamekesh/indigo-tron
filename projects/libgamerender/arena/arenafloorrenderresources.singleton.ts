import { Texture, SamplerState } from '@librender/texture/texture';
import { ECSManager } from '@libecs/ecsmanager';

export class ArenaFloorRenderResourcesSingleton {
  constructor(
    public readonly ReflectionTexture: Texture,
    public readonly NormalMap: Texture,
    public readonly ColorMap: Texture,
    public readonly RoughnessMap: Texture) {}

  static async load(gl: WebGL2RenderingContext, ecs: ECSManager, reflectionTexture: Texture) {
    const existing = ecs.getSingletonComponent(ArenaFloorRenderResourcesSingleton);
    if (existing) return existing;

    const textureParams: SamplerState = {
      MagFilter: 'linear',
      MinFilter: 'linear',
      WrapU: 'repeat',
      WrapV: 'repeat',
    };

    const [
      normalMap,
      colorMap,
      roughnessMap,
    ] = await Promise.all([
      Texture.createFromURL(gl, 'assets/textures/Metal029_2K_Normal.jpg', textureParams),
      Texture.createFromURL(gl, 'assets/textures/Metal029_2K_Color.jpg', textureParams),
      Texture.createFromURL(gl, 'assets/textures/Metal029_2K_Roughness.jpg', textureParams),
    ]);

    const e = ecs.createEntity();
    e.addComponent(
      ArenaFloorRenderResourcesSingleton, reflectionTexture, normalMap, colorMap, roughnessMap);
  }
}
