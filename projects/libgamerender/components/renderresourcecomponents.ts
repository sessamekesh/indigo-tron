import { LambertGeo } from '@librender/geo/lambertgeo';
import { Texture } from '@librender/texture/texture';
import { Framebuffer } from '@librender/texture/framebuffer';

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
}

export class ArenaFloorReflectionFramebufferComponent {
  constructor(public readonly FBO: Framebuffer) {}
}

export class ArenaFloorReflectionTextureComponent {
  constructor(public readonly Texture: Texture, public readonly BumpmapTexture: Texture) {}
}

export class GLContextComponent {
  constructor(public gl: WebGL2RenderingContext) {}
}
