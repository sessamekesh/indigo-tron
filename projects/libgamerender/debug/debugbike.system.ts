import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { LightcycleComponent2 } from '@libgamemodel/lightcycle/lightcycle.component';
import { LightcycleCollisionBoundsComponent } from '@libgamemodel/lightcycle/lightcyclecollisionbounds.component';
import { LambertGeo } from '@librender/geo/lambertgeo';
import { LambertShader, LambertRenderCall } from '@librender/shader/lambertshader';
import { CubeGeoGenerator } from '@librender/geo/generators/cubegeogenerator';
import { vec3, mat4, vec4 } from 'gl-matrix';
import { TempGroupAllocator } from '@libutil/allocator';
import { FrameSettings } from '@libgamerender/framesettings';
import { Texture } from '@librender/texture/texture';
import { FlatTexture } from '@librender/texture/flattexture';

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
  constructor(
      private lambertShader: LambertShader,
      private mat4Allocator: TempGroupAllocator<mat4>,
      private readonly config: DebugBikeSystemConfig = DebugBikeSystem.DEFAULT_CONFIG) {
    super();
  }

  start() {return true;}

  update(ecs: ECSManager, msDt: number) {}

  render(gl: WebGL2RenderingContext, ecs: ECSManager, frameSettings: FrameSettings) {
    ecs.iterateComponents(
        [LightcycleComponent2, LightcycleCollisionBoundsComponent],
        (lightcycleEntity, lightcycleComponent, collisionBoundsComponent) => {
      // foobar here?
      this.lambertShader.activate(gl);
      this.mat4Allocator.get(1, (matWorld) => {
        const geo = this.getCubeGeo(gl);
        const tex = this.getCubeTexture(gl);
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

          collisionBoundsComponent.FrontLeftPoint.getMatWorld(matWorld);
          this.lambertShader.render(gl, call);

          collisionBoundsComponent.FrontRightPoint.getMatWorld(matWorld);
          this.lambertShader.render(gl, call);

          collisionBoundsComponent.BackLeftPoint.getMatWorld(matWorld);
          this.lambertShader.render(gl, call);

          collisionBoundsComponent.BackRightPoint.getMatWorld(matWorld);
          this.lambertShader.render(gl, call);
        }
      });
    });
  }

  private getCubeGeo(gl: WebGL2RenderingContext) {
    if (!this.cubeGeo) {
      const cubeGeo = CubeGeoGenerator.generateLambertCubeGeo(
        gl, this.lambertShader, vec3.fromValues(0.05, 0.05, 0.05));
      this.cubeGeo = LambertGeo.create(gl, cubeGeo.vertexData, {BitWidth: 8, Data: cubeGeo.indices});
    }
    return this.cubeGeo;
  }

  private getCubeTexture(gl: WebGL2RenderingContext) {
    if (!this.bikeCornerTexture) {
      this.bikeCornerTexture = FlatTexture.create(
        gl, this.config.BikeCollisionBoundsMarkerColor, 1, 1);
    }
    return this.bikeCornerTexture;
  }
}
