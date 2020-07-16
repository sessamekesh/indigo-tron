import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { LightcycleComponent2 } from '@libgamemodel/lightcycle/lightcycle.component';
import { LightcycleCollisionBoundsComponent } from '@libgamemodel/lightcycle/lightcyclecollisionbounds.component';
import { LambertGeo } from '@librender/geo/lambertgeo';
import { LambertShader, LambertRenderCall } from '@librender/shader/lambertshader';
import { CubeGeoGenerator } from '@librender/geo/generators/cubegeogenerator';
import { vec3, vec4 } from 'gl-matrix';
import { FrameSettings } from '@libgamerender/framesettings';
import { Texture } from '@librender/texture/texture';
import { FlatTexture } from '@librender/texture/flattexture';
import { Mat4TransformAddon } from '@libscenegraph/scenenodeaddons/mat4transformaddon';
import { LambertShaderComponent } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { MathAllocatorsComponent } from '@libgamemodel/components/commoncomponents';

export interface DebugBikeSystemConfig {
  BikeCollisionBounds: boolean,
  BikeCollisionBoundsMarkerColor: vec4,
};

/**
 * System for debugging bike rendering - overlays, etc.
 */
export class DebugBikeSystem extends ECSSystem {
  static readonly DEFAULT_CONFIG: DebugBikeSystemConfig = {
    BikeCollisionBounds: true,
    BikeCollisionBoundsMarkerColor: vec4.fromValues(0.3, 0.95, 0.3, 1),
  };

  private cubeGeo: LambertGeo|null = null;
  private bikeCornerTexture: Texture|null = null;
  constructor() {
    super();
  }

  start() {return true;}

  update(ecs: ECSManager, msDt: number) {}

  render(gl: WebGL2RenderingContext, ecs: ECSManager, frameSettings: FrameSettings) {
    const lambertShader = ecs.getSingletonComponentOrThrow(LambertShaderComponent).LambertShader;
    const mat4Allocator = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent).Mat4;
    const config = DebugBikeSystem.DEFAULT_CONFIG;

    ecs.iterateComponents(
        [LightcycleComponent2, LightcycleCollisionBoundsComponent],
        (lightcycleEntity, lightcycleComponent, collisionBoundsComponent) => {
      // foobar here?
      lambertShader.activate(gl);
      mat4Allocator.get(1, (matWorld) => {
        const geo = this.getCubeGeo(gl, lambertShader);
        const tex = this.getCubeTexture(gl, config);
        if (geo && tex) {
          const call: LambertRenderCall = {
            AmbientCoefficient: 1,
            DiffuseTexture: tex,
            Geo: geo,
            LightColor: frameSettings.LightColor,
            LightDirection: frameSettings.LightDirection,
            MatProj: frameSettings.MatProj,
            MatView: frameSettings.MatView,
            MatWorld: matWorld,
          };

          collisionBoundsComponent.FrontLeftPoint.getAddon(Mat4TransformAddon).getMatWorld(matWorld);
          lambertShader.render(gl, call);

          collisionBoundsComponent.FrontRightPoint.getAddon(Mat4TransformAddon).getMatWorld(matWorld);
          lambertShader.render(gl, call);

          collisionBoundsComponent.BackLeftPoint.getAddon(Mat4TransformAddon).getMatWorld(matWorld);
          lambertShader.render(gl, call);

          collisionBoundsComponent.BackRightPoint.getAddon(Mat4TransformAddon).getMatWorld(matWorld);
          lambertShader.render(gl, call);
        }
      });
    });
  }

  private getCubeGeo(gl: WebGL2RenderingContext, lambertShader: LambertShader) {
    if (!this.cubeGeo) {
      const cubeGeo = CubeGeoGenerator.generateLambertCubeGeo(
        gl, lambertShader, vec3.fromValues(0.05, 0.05, 0.05));
      this.cubeGeo = LambertGeo.create(gl, cubeGeo.vertexData, {BitWidth: 8, Data: cubeGeo.indices});
    }
    return this.cubeGeo;
  }

  private getCubeTexture(gl: WebGL2RenderingContext, config: DebugBikeSystemConfig) {
    if (!this.bikeCornerTexture) {
      this.bikeCornerTexture = FlatTexture.create(
        gl, config.BikeCollisionBoundsMarkerColor, 1, 1);
    }
    return this.bikeCornerTexture;
  }
}
