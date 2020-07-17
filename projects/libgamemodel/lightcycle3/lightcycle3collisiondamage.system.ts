import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { LightcycleCollisionsListSingleton } from "@libgamemodel/components/lightcyclecollisionslist.singleton";
import { LightcycleComponent3 } from "./lightcycle3.component";
import { HealthComponent } from "@libgamemodel/components/healthcomponent";
import { MathAllocatorsComponent, MainPlayerComponent } from "@libgamemodel/components/commoncomponents";
import { vec2 } from "gl-matrix";
import { UIEventEmitterComponent } from "@libgamemodel/components/gameui";
import { Entity } from "@libecs/entity";
import { LightcycleColorComponent } from "@libgamemodel/lightcycle/lightcyclecolor.component";
import { SceneModeUtil } from "@libgamemodel/scenemode/scenemodeutil";

const SINGLETON_QUERY = {
  collisions: LightcycleCollisionsListSingleton,
  tempAlloc: MathAllocatorsComponent,
  uiEventEmitter: UIEventEmitterComponent,
};

const COMPONENT_QUERY = {
  lightcycle: LightcycleComponent3,
  health: HealthComponent,
};

export class Lightcycle3CollisionDamageSystem extends ECSSystem {
  start(ecs: ECSManager) {
    return this.expectSingletons(ecs, SINGLETON_QUERY, 'Lightcycle3CollisionDamageSystem');
  }

  update(ecs: ECSManager, msDt: number) {
    ecs.iterateComponents2(SINGLETON_QUERY, COMPONENT_QUERY, (e, s, c) => {
      // TODO (sessamekesh): Put this as a property on the bike instead
      c.health.Health = Math.min(c.health.Health + 0.75 * msDt / 1000, c.health.MaxHealth);
      const tempVec2 = s.tempAlloc.Vec2;
      const lightcycleCollisions =
        s.collisions.Collisions.filter(collision => collision.LightcycleEntity === e);

      if (lightcycleCollisions.length === 0) {
        return;
      }

      // Apply collision damage based on the collisions present: use velocity into the thing
      //  to determine damage. In a later iteration, it may be worth adding some amount
      tempVec2.get(1, (lightcycleForwardNormal) => {
        vec2.set(
          lightcycleForwardNormal,
          Math.sin(c.lightcycle.FrontWheelRotation),
          Math.cos(c.lightcycle.FrontWheelRotation));
        lightcycleCollisions.forEach((collision) => {
          const damage =
            Lightcycle3CollisionDamageSystem.getDamageAmount(
              msDt,
              Math.abs(vec2.dot(lightcycleForwardNormal, collision.CollisionNormal.Value)));
          // TODO (sessamekesh): Make this a singleton/configuration value instead
          c.health.Health -= damage;
        });
      });

      if (e.hasComponent(MainPlayerComponent)) {
        s.uiEventEmitter.EventEmitter.fireEvent(
          'playerhealth',
          { CurrentHealth: Math.max(0, c.health.Health), MaxHealth: c.health.MaxHealth });
      }

      if (c.health.Health <= 0) {
        if (e.hasComponent(MainPlayerComponent)) {
          s.uiEventEmitter.EventEmitter.fireEvent('player-death', true);
        }
        SceneModeUtil.killPlayer(ecs, e);
      }
    });
  }

  static getDamageAmount(msDt: number, collisionStrength: number): number {
    // Piecewise scaling of damage: small angles aren't very harmful, medium angles are
    //  moderately harmful, steep angles are very harmful.
    // 0-0.2: scaling of 0.25
    // 0.2-0.8: scaling of 1
    // 0.8-1.0: scaling of 1.75
    const MAX_DAMAGE_PER_SECOND = 2800;
    if (collisionStrength < 0.2) {
      return (collisionStrength / 4) * MAX_DAMAGE_PER_SECOND * msDt / 1000;
    } else if (collisionStrength < 0.8) {
      return 0.05 + ((collisionStrength - 0.2) * MAX_DAMAGE_PER_SECOND * msDt / 1000);
    } else {
      return 0.65 + ((collisionStrength - 0.8) * MAX_DAMAGE_PER_SECOND * msDt / 1000);
    }
  }
}
