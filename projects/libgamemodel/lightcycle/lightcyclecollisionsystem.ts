import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { LightcycleUpdateRandomFnComponent } from "./lightcycleupdate2.system";
import { LightcycleComponent2 } from "./lightcycle.component";
import { WallComponent2 } from "@libgamemodel/wall/wallcomponent";
import { TempGroupAllocator } from "@libutil/allocator";
import { vec3 } from "gl-matrix";
import { LineSegment2D, LineSegmentUtils } from "@libutil/math/linesegment";
import { Entity } from "@libecs/entity";
import { LightcycleCollisionBoundsComponent } from "./lightcyclecollisionbounds.component";
import { SceneGraphComponent, MathAllocatorsComponent, PlayerDeadTag, MainPlayerComponent } from "@libgamemodel/components/commoncomponents";
import { LightcycleUtils, CollisionAction } from "./lightcycleutils";
import { MathUtils } from "@libutil/mathutils";
import { UIEventEmitterComponent } from "@libgamemodel/components/gameui";
import { ArenaWallComponent } from "@libgamemodel/arena/arenawall.component";
import { SceneModeUtil } from "@libgamemodel/scenemode/scenemodeutil";
import { Mat4TransformAddon } from "@libgamemodel/../libscenegraph/scenenodeaddons/mat4transformaddon";
import { SceneGraph2 } from "@libgamemodel/../libscenegraph/scenegraph2";

export class LightcycleCollisionSystem extends ECSSystem {
  static setRandomFn(ecs: ECSManager, fn: ()=>number) {
    ecs.iterateComponents([LightcycleUpdateRandomFnComponent], (entity, randomFnComponent) => {
      randomFnComponent.Fn = fn;
    });
  }

  start(ecs: ECSManager) {
    const existingRandomFn = ecs.getSingletonComponent(LightcycleUpdateRandomFnComponent);
    if (!existingRandomFn) {
      const randomFnEntity = ecs.createEntity();
      randomFnEntity.addComponent(LightcycleUpdateRandomFnComponent, Math.random);
    }
    return true;
  }

  private timeRemain = 5000;

  update(ecs: ECSManager, msDt: number) {
    const {
      EventEmitter: uiEventEmitter,
    } = ecs.getSingletonComponentOrThrow(UIEventEmitterComponent);
    const {
      Vec3: vec3Allocator,
    } = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent);
    const {
      SceneGraph: sceneGraph,
    } = ecs.getSingletonComponentOrThrow(SceneGraphComponent);
    const {
      Fn: randomFn,
    } = ecs.getSingletonComponentOrThrow(LightcycleUpdateRandomFnComponent);

    // Collision checking
    let n = true;
    ecs.iterateComponents([LightcycleComponent2], (lightcycleEntity, lightcycle) => {
      if (n) {
        n = false;
        this.timeRemain -= msDt;
        if (this.timeRemain < 0) {
          this.timeRemain = 5000;
          const pos = vec3.create();
          lightcycle.BodySceneNode.getAddon(Mat4TransformAddon).getPos(pos);
        }
      }
      let playerDeath = false;

      const [bikeLeftLine, bikeRightLine, bikeFrontLine] =
        this.getLightcycleLines(sceneGraph, vec3Allocator, lightcycleEntity, lightcycle);

      ecs.iterateComponents([ArenaWallComponent], (_, arenaWall) => {
        if (playerDeath) return;
        const leftCollision = LineSegmentUtils.getCollision(bikeLeftLine, arenaWall.LineSegment);
        const rightCollision = LineSegmentUtils.getCollision(bikeRightLine, arenaWall.LineSegment);

        const actions: CollisionAction[] = [];
        if (leftCollision) {
          actions.push(LightcycleUtils.getArenaWallCollisionAction(leftCollision, -1));
        }
        if (rightCollision) {
          actions.push(LightcycleUtils.getArenaWallCollisionAction(rightCollision, 1));
        }

        let angleAdjustment = 0;
        const depthAdjustment = [0, 0];

        let vitalityLost = 0;
        actions.forEach(action => {
          angleAdjustment += action.bikeSteeringAdjustment
          vitalityLost += action.vitalityLost
          depthAdjustment[0] += action.depth[0] * 1.1;
          depthAdjustment[1] += action.depth[1] * 1.1;
        });
        vitalityLost *= 0.015;

        if (actions.length > 0) {
          depthAdjustment[0] /= actions.length;
          depthAdjustment[1] /= actions.length;
        }

        const frontWheelMat4Addon = lightcycle.FrontWheelSceneNode.getAddon(Mat4TransformAddon);
        const bodyMat4Addon = lightcycle.BodySceneNode.getAddon(Mat4TransformAddon);
        const newOrientation = MathUtils.clampAngle(
          frontWheelMat4Addon.getSelfRotAngle() + angleAdjustment);
        vec3Allocator.get(1, posAdjust => {
          bodyMat4Addon.getPos(posAdjust);
          posAdjust[0] -= depthAdjustment[0];
          posAdjust[2] -= depthAdjustment[1];
          bodyMat4Addon.update({pos: posAdjust});
        });
        frontWheelMat4Addon.update({rot: { angle: newOrientation }});
        lightcycle.Vitality -= vitalityLost;

        if (vitalityLost > 0 && lightcycleEntity.hasComponent(MainPlayerComponent)) {
          uiEventEmitter.fireEvent(
            'playerhealth', { CurrentHealth: lightcycle.Vitality, MaxHealth: 100 });
        }

        if (lightcycle.Vitality <= 0) {
          playerDeath = true;
          if (lightcycleEntity.hasComponent(MainPlayerComponent)) {
            uiEventEmitter.fireEvent('player-death', true);
          }
          lightcycleEntity.destroy();
        }
      });

      ecs.iterateComponents([WallComponent2], (wallEntity, wall) => {
        if (playerDeath) return;
        const wallLine = {
          x0: wall.Corner1.Value[0], y0: wall.Corner1.Value[1],
          x1: wall.Corner2.Value[0], y1: wall.Corner2.Value[1],
        };
        const leftCollision = LineSegmentUtils.getCollision(bikeLeftLine, wallLine);
        const rightCollision = LineSegmentUtils.getCollision(bikeRightLine, wallLine);
        const frontCollision = LineSegmentUtils.getCollision(bikeFrontLine, wallLine);

        const actions: CollisionAction[] = [];
        if (leftCollision) {
          actions.push(LightcycleUtils.getSideCollisionAction(leftCollision, -1, randomFn));
        }
        if (rightCollision) {
          actions.push(LightcycleUtils.getSideCollisionAction(rightCollision, 1, randomFn));
        }
        if (frontCollision) {
          actions.push(LightcycleUtils.getFrontalCollisionAction(randomFn));
        }

        let angleAdjustment = 0;
        actions.forEach(action => angleAdjustment += action.bikeSteeringAdjustment);
        let vitalityLost = 0;
        actions.forEach(action => vitalityLost += action.vitalityLost);

        const frontWheelMat4Addon = lightcycle.FrontWheelSceneNode.getAddon(Mat4TransformAddon);
        const newOrientation = MathUtils.clampAngle(
          frontWheelMat4Addon.getSelfRotAngle() + angleAdjustment);
          frontWheelMat4Addon.update({rot: { angle: newOrientation }});
        LightcycleUtils.applyCollisionDamage2(vitalityLost, wall, lightcycle);

        if (wall.Vitality <= 0) {
          wallEntity.destroy();
        }

        if (vitalityLost > 0 && lightcycleEntity.hasComponent(MainPlayerComponent)) {
          uiEventEmitter.fireEvent(
            'playerhealth', { CurrentHealth: lightcycle.Vitality, MaxHealth: 100 });
        }

        if (lightcycle.Vitality <= 0) {
          playerDeath = true;
          if (lightcycleEntity.hasComponent(MainPlayerComponent)) {
            uiEventEmitter.fireEvent('player-death', true);
          }
          SceneModeUtil.killPlayer(ecs, lightcycleEntity);
        }
      });
    });
  }

  private getLightcycleLines(
      sceneGraph: SceneGraph2, vec3Allocator: TempGroupAllocator<vec3>,
      entity: Entity, lightcycleComponent: LightcycleComponent2): LineSegment2D[] {
    let collisionBoundsComponent = entity.getComponent(LightcycleCollisionBoundsComponent);
    if (!collisionBoundsComponent) {
      const flNode = sceneGraph.createSceneNode();
      const frNode = sceneGraph.createSceneNode();
      const blNode = sceneGraph.createSceneNode();
      const brNode = sceneGraph.createSceneNode();
      vec3Allocator.get(1, (tmp) => {
        flNode.getAddon(Mat4TransformAddon).update({ pos: vec3.set(tmp, 0.5, 0, 1.5) });
        frNode.getAddon(Mat4TransformAddon).update({ pos: vec3.set(tmp, -0.5, 0, 1.5) });
        blNode.getAddon(Mat4TransformAddon).update({ pos: vec3.set(tmp, 0.5, 0, -1.5) });
        brNode.getAddon(Mat4TransformAddon).update({ pos: vec3.set(tmp, -0.5, 0, -1.5) });
      });
      flNode.setParent(lightcycleComponent.FrontWheelSceneNode);
      frNode.setParent(lightcycleComponent.FrontWheelSceneNode);
      blNode.setParent(lightcycleComponent.RearWheelSceneNode);
      brNode.setParent(lightcycleComponent.RearWheelSceneNode);
      entity.addListener('destroy', () => {
        flNode.destroy(); frNode.destroy(); blNode.destroy(); brNode.destroy();
      });
      collisionBoundsComponent =
        entity.addComponent(LightcycleCollisionBoundsComponent, flNode, frNode, blNode, brNode);
    }
    return vec3Allocator.get(4, (fl, fr, bl, br) => {
      collisionBoundsComponent!.FrontLeftPoint.getAddon(Mat4TransformAddon).getPos(fl);
      collisionBoundsComponent!.FrontRightPoint.getAddon(Mat4TransformAddon).getPos(fr);
      collisionBoundsComponent!.BackLeftPoint.getAddon(Mat4TransformAddon).getPos(bl);
      collisionBoundsComponent!.BackRightPoint.getAddon(Mat4TransformAddon).getPos(br);
      const leftLine = {
        x0: bl[0], y0: bl[2],
        x1: fl[0], y1: fl[2],
      };
      const rightLine = {
        x0: br[0], y0: br[2],
        x1: fr[0], y1: fr[2],
      };
      const frontLine = {
        x0: fl[0], y0: fl[2],
        x1: fr[0], y1: fr[2],
      };
      return [leftLine, rightLine, frontLine];
    });
  }
}
