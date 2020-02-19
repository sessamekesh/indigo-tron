import { ECSManager } from '@libecs/ecsmanager';
import { GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { LambertShaderComponent, ArenaFloorShaderComponent } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { LambertShader } from '@librender/shader/lambertshader';
import { ArenaFloorShader } from '@librender/shader/arenafloorshader';

/**
 * Utility class to set up rendering infrastructure
 */
export class RenderInfrastructureUtils {
  static setWebGL2Context(ecs: ECSManager, gl: WebGL2RenderingContext) {
    const existingEntity = ecs.getSingletonComponent(GLContextComponent);
    if (existingEntity) {
      if (existingEntity.gl === gl) {
        return;
      }

      existingEntity.gl = gl;
      return;
    }

    const entity = ecs.createEntity();
    entity.addComponent(GLContextComponent, gl);
  }

  static getGlContextComponent(ecs: ECSManager) {
    return ecs.getSingletonComponentOrThrow(GLContextComponent);
  }

  static getLambertShaderComponent(ecs: ECSManager) {
    const component = ecs.getSingletonComponent(LambertShaderComponent);
    if (component) {
      return component;
    }

    const { gl } = RenderInfrastructureUtils.getGlContextComponent(ecs);
    const newEntity = ecs.createEntity();
    const shader = LambertShader.create(gl);
    if (!shader) {
      throw new Error('Failed to create Lambert shader!');
    }
    return newEntity.addComponent(LambertShaderComponent, shader);
  }

  static getArenaFloorComponent(ecs: ECSManager) {
    const component = ecs.getSingletonComponent(ArenaFloorShaderComponent);
    if (component) {
      return component;
    }

    const { gl } = RenderInfrastructureUtils.getGlContextComponent(ecs);
    const newEntity = ecs.createEntity();
    const shader = ArenaFloorShader.create(gl);
    if (!shader) {
      throw new Error('Failed to create Lambert shader!');
    }
    return newEntity.addComponent(ArenaFloorShaderComponent, shader);
  }

  // TODO (sessamekesh): Method to install all the rendering systems for drawing the arena and floor
  // and whatnot go here!
}
