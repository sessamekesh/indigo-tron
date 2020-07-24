import { ECSManager } from '@libecs/ecsmanager';
import { ShaderSingletonTag, LambertShaderComponent, FlatColorLambertShaderComponent, Solid2DShaderComponent, ArenaFloor2ShaderComponent, ArenaFloor3ShaderSingleton, ArenaWallShader2Singleton } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { LambertShader } from '@librender/shader/lambertshader';
import { assert } from '@libutil/loadutils';
import { FlatColorLambertShader } from '@librender/shader/flatcolorlambertshader';
import { Solid2DShader } from '@librender/shader/solid2dshader';
import { ArenaFloorShader2 } from '@librender/shader/arenafloorshader2';
import { ArenaFloorShader3 } from '@librender/shader/arenafloorshader3';
import { ArenaWallShader2 } from '@librender/shader/arenawallshader2';
import { Entity } from '@libecs/entity';
import { Klass } from '@libecs/klass';

type ShaderType = typeof LambertShader | typeof ArenaFloorShader2 | typeof FlatColorLambertShader
    | typeof Solid2DShader | typeof ArenaFloorShader3 | typeof ArenaWallShader2;

export class ShaderBuilderUtil {
  static createShaders(
      ecs: ECSManager, gl: WebGL2RenderingContext, shaderList: ShaderType[], oldEcs?: ECSManager) {
    ecs.iterateComponents([ShaderSingletonTag], (entity) => entity.destroy());

    const shadersEntity = ecs.createEntity();
    shadersEntity.addComponent(ShaderSingletonTag);

    for (let i = 0; i < shaderList.length; i++) {
      let klass = shaderList[i];
      switch (klass) {
        case LambertShader:
          this.load(
            gl, shadersEntity, LambertShaderComponent, c=>c.LambertShader,
            LambertShader.create, 'LambertShader', oldEcs);
          break;
        case FlatColorLambertShader:
          this.load(
            gl, shadersEntity, FlatColorLambertShaderComponent, c=>c.FlatColorLambertShader,
            FlatColorLambertShader.create, 'FlatColorLambertShader', oldEcs);
          break;
        case Solid2DShader:
          this.load(
            gl, shadersEntity, Solid2DShaderComponent, c=>c.Solid2DShader,
            Solid2DShader.create, 'Solid2DShader', oldEcs);
          break;
        case ArenaFloorShader2:
          this.load(
            gl, shadersEntity, ArenaFloor2ShaderComponent, c=>c.ArenaFloor2Shader,
            ArenaFloorShader2.create, 'ArenaFloorShader2', oldEcs);
          break;
        case ArenaFloorShader3:
          this.load(
            gl, shadersEntity, ArenaFloor3ShaderSingleton, c=>c.ArenaFloor3Shader,
            ArenaFloorShader3.create, 'ArenaFloor3Shader', oldEcs);
          break;
        case ArenaWallShader2:
          this.load(
            gl, shadersEntity, ArenaWallShader2Singleton, c=>c.ArenaWallShader2,
            ArenaWallShader2.create, 'ArenaWallShader2', oldEcs);
          break;
        default:
          throw new Error('Failed to create unsupported shader type: ' + klass.name);
      }
    }
  }

  private static load<ShaderType, ShaderComponentType>(
      gl: WebGL2RenderingContext,
      entity: Entity,
      componentKlass: Klass<ShaderComponentType>,
      componentToShader: (componentType: ShaderComponentType)=>ShaderType,
      createFn: (gl: WebGL2RenderingContext)=>ShaderType|null,
      name: string,
      oldEcs?: ECSManager) {
    const oldComponent = oldEcs?.getSingletonComponent(componentKlass);
    entity.addComponent(
      componentKlass,
      assert(
        name,
        (oldComponent && componentToShader(oldComponent)) || createFn(gl)));
  }
}
