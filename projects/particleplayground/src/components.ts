import { ECSManager } from "@libecs/ecsmanager";
import { BasicCamera } from '@libgamemodel/camera/basiccamera';
import { mat4, vec2 } from "gl-matrix";
import { GeoBase } from "@librender/geo/geobase";
import { ParticleGeo } from "./particlegeo";
import { ParticleShaderComponent } from "./particleshader";
import { Texture, SamplerState } from "@librender/texture/texture";

export class GLContextComponent {
  constructor(
    public gl: WebGL2RenderingContext,
    public MatProj: mat4,
    public MatView: mat4) {}

  static upsert(ecs: ECSManager, gl: WebGL2RenderingContext) {
    ecs.iterateComponents2({}, {GLContextComponent}, (e) => e.destroy());
    const e = ecs.createEntity();
    e.addComponent(GLContextComponent, gl, mat4.create(), mat4.create());
  }
}

export class CameraComponent {
  constructor(public Camera: BasicCamera) {}

  static upsert(ecs: ECSManager, camera: BasicCamera) {
    ecs.iterateComponents2({}, {CameraComponent}, (e) => e.destroy());
    const e = ecs.createEntity();
    e.addComponent(CameraComponent, camera);
  }
}

export class ParticleGeoComponent {
  constructor(public Geo: GeoBase) {}

  static upsert(ecs: ECSManager) {
    const missing = ecs.withSingletons({GLContextComponent, ParticleShaderComponent}, (s) => {
      const newGeo = ParticleGeo.createUnitSquareParticle(
        s.GLContextComponent.gl, s.ParticleShaderComponent.Shader);
      if (!newGeo) return;

      ecs.iterateComponents2({}, {ParticleGeoComponent}, (e) => e.destroy());
      const e = ecs.createEntity();
      e.addComponent(ParticleGeoComponent, newGeo);
    });

    if (missing.length > 0) {
      console.error('Failed to upsert ParticleGeoComponent, missing: ' + missing.join(','));
    }
  }
}

const samplerState: SamplerState = {
  MagFilter: 'linear',
  MinFilter: 'linear',
  WrapU: 'repeat',
  WrapV: 'repeat',
};
export class ParticleTexturesComponent {
  constructor(
    public Tex1: Texture,
    public Tex2: Texture,
    public Tex3: Texture,
    public OffsetVelocity1: vec2,
    public OffsetVelocity2: vec2,
    public OffsetVelocity3: vec2,
    public Scale1: vec2,
    public Scale2: vec2,
    public Scale3: vec2) {}

  static async upsert(
      ecs: ECSManager,
      offsetVelocity1: vec2, offsetVelocity2: vec2, offsetVelocity3: vec2,
      scale1: vec2, scale2: vec2, scale3: vec2,
      tex1Url: string, tex2Url: string, tex3Url: string) {
    let gl: WebGL2RenderingContext|null = null as WebGL2RenderingContext|null;
    const missing = ecs.withSingletons({GLContextComponent}, (s) => {
      gl = s.GLContextComponent.gl;
    });
    if (missing.length > 0) {
      console.error('Failed to upsert ParticleTexturesComponent, missing: ' + missing.join(','));
    }
    if (!gl) {
      console.error('Magically, no GL context is available');
      return;
    }

    const [tex1, tex2, tex3] = await Promise.all([
        Texture.createFromURL(gl, tex1Url, samplerState),
        Texture.createFromURL(gl, tex2Url, samplerState),
        Texture.createFromURL(gl, tex3Url, samplerState),
      ]);
    if (!tex1 || !tex2 || !tex3) {
      console.error('Failed to upsert textures, no textures are available');
      return;
    }

    ecs.iterateComponents2({}, {ParticleTexturesComponent}, e=>e.destroy());
    const e = ecs.createEntity();
    e.addComponent(
      ParticleTexturesComponent,
      tex1, tex2, tex3,
      offsetVelocity1, offsetVelocity2, offsetVelocity3,
      scale1, scale2, scale3);
  }
}
