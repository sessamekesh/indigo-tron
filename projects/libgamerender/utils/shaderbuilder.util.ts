import { ECSManager } from '@libecs/ecsmanager';
import { ShaderSingletonTag, LambertShaderComponent, FlatColorLambertShaderComponent, Solid2DShaderComponent, ArenaFloor2ShaderComponent, ArenaFloor3ShaderSingleton, ArenaWallShader2Singleton } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { LambertShader } from '@librender/shader/lambertshader';
import { assert } from '@libutil/loadutils';
import { FlatColorLambertShader } from '@librender/shader/flatcolorlambertshader';
import { Solid2DShader } from '@librender/shader/solid2dshader';
import { ArenaFloorShader2 } from '@librender/shader/arenafloorshader2';
import { ArenaFloorShader3 } from '@librender/shader/arenafloorshader3';
import { ArenaWallShader2 } from '@librender/shader/arenawallshader2';

type ShaderType = typeof LambertShader | typeof ArenaFloorShader2 | typeof FlatColorLambertShader
    | typeof Solid2DShader | typeof ArenaFloorShader3 | typeof ArenaWallShader2;

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
        case FlatColorLambertShader:
          shadersEntity.addComponent(
            FlatColorLambertShaderComponent,
            assert('FlatColorLambertShader', FlatColorLambertShader.create(gl)));
          break;
        case Solid2DShader:
          shadersEntity.addComponent(
            Solid2DShaderComponent,
            assert('Solid2DShader', Solid2DShader.create(gl)));
          break;
        case ArenaFloorShader2:
          shadersEntity.addComponent(
            ArenaFloor2ShaderComponent,
            assert('ArenaFloor2Shader', ArenaFloorShader2.create(gl)));
          break;
        case ArenaFloorShader3:
          shadersEntity.addComponent(
            ArenaFloor3ShaderSingleton,
            assert('ArenaFloor3Shader', ArenaFloorShader3.create(gl)));
          break;
        case ArenaWallShader2:
          shadersEntity.addComponent(
            ArenaWallShader2Singleton,
            assert('ArenaWallShader2', ArenaWallShader2.create(gl)));
          break;
        default:
          throw new Error('Failed to create unsupported shader type: ' + klass.name);
      }
    }
  }
}
