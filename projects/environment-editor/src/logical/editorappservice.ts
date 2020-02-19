import { ECSManager } from '@libecs/ecsmanager';
import { ShaderSingletonTag, ArenaFloorShaderComponent } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { ArenaFloorShader } from '@libgamemodel/../librender/shader/arenafloorshader';
import { RenderResourcesSingletonTag } from '@libgamerender/renderresourcesingletons/renderresourcessingletontag';
import { ArenaFloorReflectionFramebufferComponent, ArenaFloorReflectionTextureComponent, GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { Texture } from '@libgamemodel/../librender/texture/texture';
import { Framebuffer } from '@libgamemodel/../librender/texture/framebuffer';

function assertLoaded<T>(name: string, t: T|null): T {
  if (!t) {
    throw new Error(`Could not load resource ${name}`);
  }
  return t;
}

export class EditorAppService {
  private constructor(
    private gl: WebGL2RenderingContext,
    private ecs: ECSManager) {}

  static async create(gl: WebGL2RenderingContext) {
    const ecs = new ECSManager();
    return new EditorAppService(gl, ecs);
  }

  async start() {
    this.ecs.start();
  }

  private static initializeSystems_(ecs: ECSManager) {

  }

  private static async loadGlResources(gl: WebGL2RenderingContext, ecs: ECSManager) {
    //
    // Shaders
    //
    ecs.iterateComponents([ShaderSingletonTag], entity => entity.destroy());
    const shader = assertLoaded('ArenaFloorShader', ArenaFloorShader.create(gl));
    const shadersEntity = ecs.createEntity();
    shadersEntity.addComponent(ShaderSingletonTag);
    shadersEntity.addComponent(ArenaFloorShaderComponent, shader);

    //
    // Miscellaneous Objects
    //
    ecs.iterateComponents([RenderResourcesSingletonTag], (entity) => entity.destroy());
    const framebuffersEntity = ecs.createEntity();
    framebuffersEntity.addComponent(RenderResourcesSingletonTag);
    const floorReflectionTexture = assertLoaded('FloorReflectionTexture', Texture.createEmptyTexture(gl, 256, 256, 'rgba32'));
    const floorReflectionFramebuffer = assertLoaded('FloorReflectionFramebuffer', Framebuffer.create(gl, {
      AttachedTexture: floorReflectionTexture,
      ColorAttachment: 0,
      DepthEnabled: true,
    }));
    framebuffersEntity.addComponent(
      ArenaFloorReflectionFramebufferComponent, floorReflectionFramebuffer);
    // TODO (sessamekesh): Grab this from application state?
    framebuffersEntity.addComponent(
      ArenaFloorReflectionTextureComponent,
      floorReflectionTexture,
      floorReflectionTexture);

  }
}
