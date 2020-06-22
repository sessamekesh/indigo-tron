import { ECSManager } from "@libecs/ecsmanager";
import { ParticleUpdaterSystem, ParticleComponent } from "./particleupdater.system";
import { ParticleShaderComponent } from "./particleshader";
import { ParticleAppRenderSystem } from "./particleapp.rendersystem";
import { GLContextComponent, ParticleGeoComponent, CameraComponent, ParticleTexturesComponent } from "./components";
import { BasicCamera } from "@libgamemodel/camera/basiccamera";
import { vec3, vec2, mat4, quat } from "gl-matrix";
import { SceneNodeFactory } from '@libutil/scene/scenenodefactory';
import { TempGroupAllocator } from "@libutil/allocator";
import { WallGridParticleSystem, WallGridParticleSpawner, WallParticleSpawnerComponent } from "./wallgrid.particlesystem";

export class AppService {
  private frameHandle: number|null = null;
  constructor(private gl: WebGL2RenderingContext, private ecs: ECSManager) {}

  static async create(gl: WebGL2RenderingContext): Promise<AppService> {
    const ecs = new ECSManager();

    GLContextComponent.upsert(ecs, gl);
    ParticleShaderComponent.upsert(ecs, gl);
    ParticleGeoComponent.upsert(ecs);
    CameraComponent.upsert(
      ecs,
      new BasicCamera(
        /*pos*/ vec3.fromValues(0, 0, 5),
        /*lookAt*/ vec3.fromValues(0, 0, 0),
        /*up*/ vec3.fromValues(0, 1, 0)));
    await ParticleTexturesComponent.upsert(
      ecs,
      vec2.fromValues(0, 0),
      vec2.fromValues(0.25, 0.35),
      vec2.fromValues(0.5, -0.35),
      vec2.fromValues(1, 1),
      vec2.fromValues(1, 1),
      vec2.fromValues(1, 1),
      '/assets/particles/circle.png',
      '/assets/particles/gimp_cloud_1.png',
      '/assets/particles/gimp_cloud_2.png');

    // TODO (sessamekesh): Move this to a particle spawner system, and use that logic instead
    // TODO (sessamekesh): Use advice https://www.youtube.com/watch?v=YPy2hytwDLM
    // TODO (sessamekesh): Start playing around with some particle effects to use
    const sceneNodeFactory = new SceneNodeFactory(
      new TempGroupAllocator(mat4.create), new TempGroupAllocator(quat.create));
    const particle = ecs.createEntity();
    particle.addComponent(
      ParticleComponent,
      {
        sceneNode: sceneNodeFactory.createSceneNode(),
        shouldDestroy: ()=>false,
        update: ()=>{},
      },
      mat4.create(),
      vec2.fromValues(0, 0),
      vec2.fromValues(0, 0),
      vec2.fromValues(0, 0));

    // Smokey lines, not really in style
    // for (let x = -3; x < 3; x += 1.15) {
    //   WallParticleSpawnerComponent.addToScene(
    //     ecs, vec3.fromValues(x, -2.2, 0), vec3.fromValues(x, 2.2, 0));
    // }

    ecs.addSystem2(WallGridParticleSystem);
    ecs.addSystem2(ParticleUpdaterSystem);
    ecs.addSystem2(ParticleAppRenderSystem);

    (window as any)['howManyParticlesAreThere'] = () => {
      let i = 0;
      ecs.iterateComponents2({}, {ParticleComponent}, (e) => {
        i++;
      });
      return i;
    };

    return new AppService(gl, ecs);
  }

  start() {
    if (!this.ecs.start()) return false;

    let lastFrameTime = performance.now();
    const frame = () => {
      const thisFrame = performance.now();
      const msDt = (thisFrame - lastFrameTime);
      lastFrameTime = thisFrame;

      this.ecs.update(1000 / 60);

      this.frameHandle = requestAnimationFrame(frame);
    };
    this.frameHandle = requestAnimationFrame(frame);
  }
}
