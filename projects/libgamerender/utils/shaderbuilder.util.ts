import { ECSManager } from '@libecs/ecsmanager';
import { ShaderSingletonTag, LambertShaderComponent, ArenaFloorShaderComponent, FlatColorLambertShaderComponent, ArenaWallShaderComponent } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { LambertShader } from '@librender/shader/lambertshader';
import { ArenaFloorShader } from '@librender/shader/arenafloorshader';
import { assert } from '@libutil/loadutils';
import { FlatColorLambertShader } from '@librender/shader/flatcolorlambertshader';
import { ArenaWallShader } from '@librender/shader/arenawallshader';

type ShaderType = typeof LambertShader | typeof ArenaFloorShader | typeof FlatColorLambertShader
    | typeof ArenaWallShader;

export class ShaderBuilderUtil {
  static createShaders(ecs: ECSManager, gl: WebGL2RenderingContext, shaderList: ShaderType[]) {
    ecs.iterateComponents([ShaderSingletonTag], (entity) => entity.destroy());

    const shadersEntity = ecs.createEntity();
    shadersEntity.addComponent(ShaderSingletonTag);

    for (let i = 0; i < shaderList.length; i++) {
      let klass = shaderList[i];
      switch (klass) {
        case LambertShader:
          shadersEntity.addComponent(
            LambertShaderComponent, assert('LambertShader', LambertShader.create(gl)));
          break;
        case ArenaFloorShader:
          shadersEntity.addComponent(
            ArenaFloorShaderComponent, assert('ArenaFloorShader', ArenaFloorShader.create(gl)));
          break;
        case FlatColorLambertShader:
          shadersEntity.addComponent(
            FlatColorLambertShaderComponent,
            assert('FlatColorLambertShader', FlatColorLambertShader.create(gl)));
          break;
        case ArenaWallShader:
          shadersEntity.addComponent(
            ArenaWallShaderComponent,
            assert('ArenaWallShader', ArenaWallShader.create(gl)));
          break;
        default:
          throw new Error('Failed to create unsupported shader type: ' + klass.name);
      }
    }
  }
}