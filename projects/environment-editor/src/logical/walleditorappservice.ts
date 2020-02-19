import { ECSManager } from "@libecs/ecsmanager";
import { LightcycleSystemUtils } from '@libgamemodel/lightcycle/lightcyclesystemutils';
import { CommonComponentUtils } from '@libgamemodel/components/commoncomponentutils';
import { LightcycleSpawner } from '@libgamemodel/lightcycle/lightcyclespawner';
import { vec3 } from "gl-matrix";
import { LightcycleComponent2 } from "@libgamemodel/lightcycle/lightcycle.component";
import { SceneNodeCamera } from '@libgamemodel/camera/scenenodecamera';
import { Y_UNIT_DIR } from "@libutil/helpfulconstants";

/**
 * Engine Service for WALL EDITOR APP
 *
 * --- OVERVIEW ---
 * Walls are semi-transparent and animated in three distinct phases:
 * (1) Spawn
 * (2) Persist
 * (3) Break
 *
 * In phase (1), the wall appears behind the lightcycle as a sea of particles that coalesce into the
 * top and bottom of the plane along which the lightcycle was travelling at spawn time, specifically
 * into the form use in phase (2).
 *
 * In phase (2), the wall is solid and fading - there is a bright bar along the top of the wall that
 * softens somewhat through the lifetime of the wall, and a much thinner bright bar along the bottom
 * with a gradient that reaches towards (but not all the way to) the top of the wall. The height of
 * this gradient decreases as the wall grows weaker, and the intensity of both the top and bottom
 * color decrease as well, until phase (3)...
 *
 * In phase (3) the wall disappates as a blurring cloud along the surface and fades into nothing.
 * The wall is non-solid during this phase, and collisions with it damage nothing.
 *
 * --- IMPLEMENTATION---
 * Phase (1): Spawn animation covers wall length (L) - sampling for a wall segment slides along
 * the animation segment based on the coalesce time, should slide along at 1:1 to give the illusion
 * that the particles are only spawning up/down. For (N) animations and a wall height of (H), this
 * will result in a total of N*L*H texel units that must be taken. Textures can wrap segments of L
 * across multiple rows if needed, but different animations should be assigned to different texture
 * units!
 *
 * Phase (2) doesn't even need to be a texture, it can be generated in a specialized shader.
 *
 * Phase (3) needs textures similar to Phase (4).
 *
 * --- PARAMETERS ---
 * Time (in seconds) of Phase 1,3 animations
 * Size, number of particles in Phase 1,3
 * Number of frames in Phase 1,3 animations
 * Number of unique entry animations for phase 1,3
 * Height of wall
 * Height of top bar
 * Height of bottom bar
 * Start height of gradient, end height of gradient
 * Start color of gradient, end color of gradient (top and bottom)
 * Blurring factor for phase 3
 * Texture size for textures in 1,3
 * Target max supported width of wall segment for animation (for wrapping only)
 */
function assertLoaded<T>(name: string, t: T|null): T {
  if (!t) {
    throw new Error(`Could not create resource ${name}`);
  }
  return t;
}

export class WallEditorAppService {
  private constructor(
    private gl: WebGL2RenderingContext,
    private ecs: ECSManager) {}

  static async create(gl: WebGL2RenderingContext) {
    const ecs = new ECSManager();

    WallEditorAppService.createLogicalSystems(ecs);

    return new WallEditorAppService(gl, ecs);
  }

  async start() {
    this.ecs.start();
    this.startRendering();
  }

  private static createLogicalSystems(ecs: ECSManager) {
    LightcycleSystemUtils.installLightcycleUpdateSystem(ecs);
    LightcycleSystemUtils.installWallSpawnerSystem(ecs);
  }

  private static async createRenderingSystems(ecs: ECSManager) {
    const { SceneNodeFactory } = CommonComponentUtils.getSceneNodeFactoryComponent(ecs);
    const { Vec3 } = CommonComponentUtils.getTempMathAllocatorsComponent(ecs);
    const newLightcycle = LightcycleSpawner.spawnLightcycle(ecs, {
      Orientation: 0,
      Position: vec3.fromValues(0, 0, 0),
    });
    const camera = SceneNodeCamera.attachAtFixedOffsetTo(
      Vec3, newLightcycle.getComponent(LightcycleComponent2)!.BodySceneNode,
      SceneNodeFactory, vec3.fromValues(0, 0, 5), Y_UNIT_DIR);


  }

  private startRendering() {
    let lastFrame = performance.now();
    const frame = () => {
      const now = performance.now();
      const msDt = now - lastFrame;
      lastFrame = now;

      this.ecs.update(msDt);
      requestAnimationFrame(frame);

      const gl = this.gl;
      gl.clearColor(0.85, 0.75, 1, 1);
      gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    };
    requestAnimationFrame(frame);
  }
}
