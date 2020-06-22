import { ECSManager } from '@libecs/ecsmanager';
import { ECSSystem } from '@libecs/ecssystem';
import { ParticleBase } from './particlebase';
import { mat4, vec2 } from 'gl-matrix';
import { ParticleTexturesComponent } from './components';

export class ParticleComponent {
  constructor(
    public readonly Particle: ParticleBase,
    public readonly MatWorld: mat4,
    public readonly Tex1Offset: vec2,
    public readonly Tex2Offset: vec2,
    public readonly Tex3Offset: vec2) {}
}

export class ParticleUpdaterSystem extends ECSSystem {
  start() { return true; }

  update(ecs: ECSManager, msDt: number) {
    const dt = msDt / 1000;
    const singletonQuery = {
      particleTextures: ParticleTexturesComponent,
    };
    const componentQuery = {
      particle: ParticleComponent,
    };
    ecs.iterateComponents2(singletonQuery, componentQuery, (entity, s, c) => {
      c.particle.Particle.update(msDt / 1000);
      if (c.particle.Particle.shouldDestroy()) {
        entity.destroy();
        return;
      }

      c.particle.Particle.sceneNode.getMatWorld(c.particle.MatWorld);

      c.particle.Tex1Offset[0] += s.particleTextures.OffsetVelocity1[0] * dt;
      c.particle.Tex1Offset[1] += s.particleTextures.OffsetVelocity1[1] * dt;
      c.particle.Tex2Offset[0] += s.particleTextures.OffsetVelocity2[0] * dt;
      c.particle.Tex2Offset[1] += s.particleTextures.OffsetVelocity2[1] * dt;
      c.particle.Tex3Offset[0] += s.particleTextures.OffsetVelocity3[0] * dt;
      c.particle.Tex3Offset[1] += s.particleTextures.OffsetVelocity3[1] * dt;
    });
  }
}
