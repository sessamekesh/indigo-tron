import { LambertShader } from '@librender/shader/lambertshader';
import { WallRenderUtils } from '@libgamerender/systems/wallrenderutils';
import { FloorTileTexture } from '@librender/texture/floortiletexture';
import { vec4 } from 'gl-matrix';
import { ECSManager } from '@libecs/ecsmanager';
import { GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { LambertShaderComponent } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { BasicWallGeometrySingleton } from './basicwallgeometry.singleton';

export class BasicWallGeometryGenerator {
  static attachGeoSingleton(ecs: ECSManager) {
    const { gl } = ecs.getSingletonComponentOrThrow(GLContextComponent);
    const { LambertShader } = ecs.getSingletonComponentOrThrow(LambertShaderComponent);

    const wallGeo = WallRenderUtils.generateWallGeo(gl, LambertShader, 1, 1);
    const blueWallTexture = FloorTileTexture.create(
      gl, vec4.fromValues(0.1, 0.1, 0.98, 1), vec4.fromValues(0, 0, 1, 1), 32, 32, 8, 8, 8, 8);
    const greenWallTexture = FloorTileTexture.create(
      gl, vec4.fromValues(0.1, 0.98, 0.1, 1), vec4.fromValues(0, 1, 0, 1), 32, 32, 8, 8, 8, 8);
    const redWallTexture = FloorTileTexture.create(
      gl, vec4.fromValues(0.98, 0.1, 0.1, 1), vec4.fromValues(1, 0, 0, 1), 32, 32, 8, 8, 4, 4);

    const e = ecs.createEntity();
    e.addComponent(
      BasicWallGeometrySingleton, wallGeo, blueWallTexture, greenWallTexture, redWallTexture);
    return e;
  }
}
