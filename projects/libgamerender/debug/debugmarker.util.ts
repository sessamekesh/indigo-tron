import { vec4, vec3, mat4 } from 'gl-matrix';
import { FloorTileTexture } from '@librender/texture/floortiletexture';
import { CubeGeoGenerator } from '@librender/geo/generators/cubegeogenerator';
import { LambertShader } from '@librender/shader/lambertshader';
import { LambertGeo } from '@librender/geo/lambertgeo';
import { Entity } from '@libecs/entity';
import { LambertRenderableComponent } from '@libgamerender/components/lambertrenderable.component';

export class DebugMarkerUtil {
  static attachDebugMarker(
      entity: Entity, gl: WebGL2RenderingContext, lambertShader: LambertShader, color: vec4) {
    const texture = FloorTileTexture.create(gl, color, color, 32, 32, 10, 10, 0, 0);
    const geoData =
      CubeGeoGenerator.generateLambertCubeGeo(gl, lambertShader, vec3.fromValues(0.5, 0.5, 0.5));
    const geo = LambertGeo.create(gl, geoData.vertexData, {BitWidth: 8, Data: geoData.indices});
    if (!texture || !geo) {
      return null;
    }

    return entity.addComponent(LambertRenderableComponent, mat4.create(), geo, texture);
  }
}
