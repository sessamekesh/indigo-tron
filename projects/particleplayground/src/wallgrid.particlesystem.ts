import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { ParticleBase } from "./particlebase";
import { SceneNode } from "@libutil/scene/scenenode";
import { vec3, mat4, quat, vec2 } from "gl-matrix";
import { SceneNodeFactory } from "@libutil/scene/scenenodefactory";
import { TempGroupAllocator } from "@libutil/allocator";
import { ParticleComponent } from "./particleupdater.system";

/**
 * Wall particle: Travel along a line from point A to point B, at some speed, occasionally subject
 *  to acceleration in one direction or another off the beaten path in a circle.
 */
class WallGridParticle implements ParticleBase {
  private forceAngle_ = 0.0;
  private forceAngleDirection_ = 1.0;
  private forceAngleVelocity_ = 1.0;
  private timeToForceAngleAdjust_ = 0.0;
  private forceRight_ = vec3.create();
  private position_ = vec3.create();
  private velocity_ = vec3.create();

  private up_ = vec3.create();
  private progress_ = vec3.create();
  constructor(
      public readonly sceneNode: SceneNode,
      public readonly startPosition: vec3,
      public readonly goalPosition: vec3,
      public readonly outVector: vec3,
      public readonly velocity: number,
      public readonly noiseVelocity: number,
      public readonly springStrength: number) {
    vec3.copy(this.position_, this.startPosition);

    vec3.sub(this.up_, this.goalPosition, this.startPosition)
    vec3.normalize(this.up_, this.up_);

    vec3.cross(this.forceRight_, this.outVector, this.up_);
    vec3.normalize(this.forceRight_, this.forceRight_);
  }

  shouldDestroy() {
    vec3.sub(this.progress_, this.position_, this.goalPosition);
    const should = vec3.dot(this.progress_, this.up_) > 0.0;
    if (should) {
      return true;
    }
    return false;
  }

  private force_ = vec3.create();
  private toCenterline_ = vec3.create();
  update(dt: number) {
    this.timeToForceAngleAdjust_ -= dt;
    if (this.timeToForceAngleAdjust_ < 0) {
      this.forceAngleVelocity_ = Math.random() * 2.0 - 1.0;
      this.forceAngleDirection_ = (Math.random() < 0.5) ? -1.0 : 1.0;
    }

    vec3.sub(this.progress_, this.position_, this.startPosition);
    const fromCenterlineRightDist = vec3.dot(this.forceRight_, this.progress_);

    this.forceAngle_ += this.forceAngleVelocity_ * this.forceAngleDirection_ * dt;
    vec3.set(this.force_, 0, 0, 0);
    vec3.scaleAndAdd(
      this.force_, this.force_,
      this.up_, Math.cos(this.forceAngle_) * this.noiseVelocity + this.velocity);
    vec3.scaleAndAdd(
      this.force_, this.force_,
      this.forceRight_, Math.sin(this.forceAngle_) * this.noiseVelocity);
    vec3.scaleAndAdd(
      this.force_, this.force_,
      this.forceRight_, -fromCenterlineRightDist * this.springStrength);

    vec3.scaleAndAdd(this.position_, this.position_, this.force_, dt);

    this.sceneNode.update({
      pos: this.position_,
      scl: vec3.fromValues(0.55, 0.55, 0.55),
    });
  }
}

export type WallGridParticleSpawner = {
  StartPos: vec3,
  EndPos: vec3,
  OutVector: vec3,
  GoalVelocity: number,
  NoiseVelocity: number,
  SpringStrength: number,
  TimeBetweenSpawns: number,
  TimeToNextSpawn: number,
}

export class WallParticleSpawnerComponent {
  constructor(public Spawner: WallGridParticleSpawner) {}

  static addToScene(ecs: ECSManager, startPos: vec3, endPos: vec3) {
    const e = ecs.createEntity();
    e.addComponent(
      WallParticleSpawnerComponent, {
        StartPos: startPos,
        EndPos: endPos,
        OutVector: vec3.fromValues(0, 0, 1),
        GoalVelocity: 0.8,
        NoiseVelocity: 2.85,
        SpringStrength: 5.5,
        TimeBetweenSpawns: 0.05,
        TimeToNextSpawn: 0.0,
      });
    return e;
  }
}

export class WallGridParticleSystem extends ECSSystem {
  private sceneNodeFactory_ =
    new SceneNodeFactory(new TempGroupAllocator(mat4.create), new TempGroupAllocator(quat.create));

  start() { return true; }
  update(ecs: ECSManager, msDt: number) {
    const singletonQuery = {};
    const componentQuery = {WallParticleSpawnerComponent};
    const dt = msDt / 1000;

    ecs.iterateComponents2(singletonQuery, componentQuery, (e, s, c) => {
      const spawner = c.WallParticleSpawnerComponent.Spawner;
      spawner.TimeToNextSpawn -= dt;
      if (spawner.TimeToNextSpawn < 0) {
        spawner.TimeToNextSpawn = spawner.TimeBetweenSpawns;
        const particle =
          new WallGridParticle(
            this.sceneNodeFactory_.createSceneNode(), spawner.StartPos, spawner.EndPos,
            spawner.OutVector, spawner.GoalVelocity, spawner.NoiseVelocity, spawner.SpringStrength);
        const newEntity = ecs.createEntity();
        newEntity.addComponent(
          ParticleComponent, particle, mat4.create(), vec2.create(), randOffset(), randOffset());
      }
    });
  }
}

function randOffset() {
  return vec2.fromValues(Math.random(), Math.random());
}
