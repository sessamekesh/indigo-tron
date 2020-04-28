import { ECSManager } from "@libecs/ecsmanager";
import { PauseStateComponent, GameEndStateComponent, MainPlayerComponent, PlayerDeadTag } from "@libgamemodel/components/commoncomponents";
import { LightcycleColorComponent } from "@libgamemodel/lightcycle/lightcyclecolor.component";
import { LightcycleComponent2 } from "@libgamemodel/lightcycle/lightcycle.component";
import { Entity } from "@libecs/entity";
import { LightcycleUtils } from "@libgamemodel/lightcycle/lightcycleutils";

/**
 * Scene Mode Utility
 *
 * Utility methods for dealing with the multiple modes the game can be in
 * - Start / Player Select
 * - Gameplay
 * - Game End
 */
export class SceneModeUtil {
  static isGameplayMode(ecs: ECSManager) {
    const gameEndState = ecs.getSingletonComponent(GameEndStateComponent);
    if (gameEndState) return false;

    return true;
  }

  static isPlaying(ecs: ECSManager) {
    if (!SceneModeUtil.isGameplayMode(ecs)) {
      return false;
    }

    return !SceneModeUtil.isPaused(ecs);
  }

  static isPaused(ecs: ECSManager) {
    const pauseState = ecs.getSingletonComponent(PauseStateComponent);
    return pauseState && pauseState.IsPaused;
  }

  static isGameEnd(ecs: ECSManager) {
    const gameEndState = ecs.getSingletonComponent(GameEndStateComponent);
    return !!gameEndState;
  }

  static isPlayerAlive(ecs: ECSManager) {
    const player = ecs.getSingletonComponent(MainPlayerComponent);
    return !!player;
  }

  static killPlayer(ecs: ECSManager, player: Entity) {
    let remainingPlayers: Entity[] = [];
    ecs.iterateComponents([LightcycleComponent2, LightcycleColorComponent], (entity) => {
      if (entity !== player) {
        remainingPlayers.push(entity);
      }
    });

    if (remainingPlayers.length === 0) return;

    if (remainingPlayers.length === 1) {
      const gameEndEntity = ecs.createEntity();
      // TODO (sessamekesh): Do more with this state! Show a fun screen, have the cycle stop and
      // show fireworks above it!
      gameEndEntity.addComponent(
        GameEndStateComponent,
        player.getComponent(LightcycleColorComponent)!.Color,
        player);
    }

    const nextPlayer = remainingPlayers[Math.floor(Math.random() * remainingPlayers.length)];

    if (nextPlayer) {
      LightcycleUtils.moveCameraRigToLightcycle(player, nextPlayer);
    }

    player.destroy();
  }
}
