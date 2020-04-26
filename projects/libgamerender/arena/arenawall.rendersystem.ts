import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { Entity } from '@libecs/entity';
import { ArenaWallComponent } from '@libgamemodel/arena/arenawall.component';
import { ArenaWallRenderableComponent, ArenaWallRenderingConfigComponent } from '@libgamerender/components/arenawallrenderable.component';
import { GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { mat4, quat, vec3, vec2 } from 'gl-matrix';
import { MathAllocatorsComponent } from '@libgamemodel/components/commoncomponents';

export class ArenaWallRenderSystem extends ECSSystem {
  start(ecs: ECSManager) {
    const config = ecs.getSingletonComponent(ArenaWallRenderingConfigComponent);

    return !!config;
  }

  update(ecs: ECSManager, msDt: number) {
    const { gl } = ecs.getSingletonComponentOrThrow(GLContextComponent);
    const dt = msDt / 1000;

    ecs.iterateComponents([ArenaWallComponent], (entity, logicalComponent) => {
      const renderComponent = this.createRenderComponentIfMissing(
        ecs, entity, logicalComponent, gl);
      renderComponent.DistortionOffset[0] += renderComponent.DistortionOffsetUpdateRate[0] * dt;
      renderComponent.DistortionOffset[1] += renderComponent.DistortionOffsetUpdateRate[1] * dt;
      renderComponent.IntensityDisplacement[0] +=
        renderComponent.IntensityDisplacementUpdateRate[0] * dt;
      renderComponent.IntensityDisplacement[1] +=
        renderComponent.IntensityDisplacementUpdateRate[1] * dt;
    });
  }

  private createRenderComponentIfMissing(
      ecs: ECSManager,
      entity: Entity,
      wallComponent: ArenaWallComponent,
      gl: WebGL2RenderingContext): ArenaWallRenderableComponent {
    const config = ecs.getSingletonComponentOrThrow(ArenaWallRenderingConfigComponent);
    const { Vec3, Quat } = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent);
    let component = entity.getComponent(ArenaWallRenderableComponent);
    if (!component) {
      const MatWorld = mat4.create();
      const wallLength = Math.sqrt(
        (wallComponent.LineSegment.x1 - wallComponent.LineSegment.x0) ** 2
          + (wallComponent.LineSegment.y1 - wallComponent.LineSegment.y0) ** 2);
      const wallHeight = 50;
      Quat.get(1, (rot) => {
        Vec3.get(3, (pos, scl, axis) => {
          vec3.set(axis, 0, wallComponent.FuckIt ? -1 : 1, 0);
          quat.setAxisAngle(
            rot,
            axis,
            Math.atan2(
              wallComponent.LineSegment.y1 - wallComponent.LineSegment.y0,
              wallComponent.LineSegment.x1 - wallComponent.LineSegment.x0));
          vec3.set(
            pos,
            wallComponent.LineSegment.x0,
            -0.5,
            wallComponent.LineSegment.y0);
          vec3.set(scl, wallLength, wallHeight, 1);
          mat4.fromRotationTranslationScale(MatWorld, rot, pos, scl);
        });
      });
      const BaseColorTilingScale = vec2.fromValues(
        config.BaseColorUVPerWorldUnit[0] * wallLength,
        config.BaseColorUVPerWorldUnit[1] * wallHeight);
      const IntensityTilingScale = vec2.fromValues(
        config.IntensityUVPerWorldUnit[0] * wallLength,
        config.IntensityUVPerWorldUnit[1] * wallHeight);
      const ForceFieldTilingScale = vec2.fromValues(
        config.ForceFieldUVPerWorldUnit[0] * wallLength,
        config.ForceFieldUVPerWorldUnit[1] * wallHeight);
      const IntensityDisplacement = vec2.fromValues(0, 0);
      const IntensityDisplacementUpdateRate = vec2.create();
      vec2.copy(
        IntensityDisplacementUpdateRate, config.IntensityDisplacementUpdateRateInWorldUnits);
      const DistortionOffset = vec2.fromValues(0, 0);
      const DistortionOffsetUpdateRate = vec2.create();
      vec2.copy(DistortionOffsetUpdateRate, config.DistortionOffsetUpdateRateInWorldUnits);
      component = entity.addComponent(
        ArenaWallRenderableComponent,
        MatWorld,
        BaseColorTilingScale,
        IntensityTilingScale,
        ForceFieldTilingScale,
        IntensityDisplacement,
        IntensityDisplacementUpdateRate,
        DistortionOffset,
        DistortionOffsetUpdateRate);
    }
    return component;
  }
}
