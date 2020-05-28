import { ECSManager } from "@libecs/ecsmanager";
import { PauseStateComponent, GameEndStateComponent, MainPlayerComponent, PlayerDeadTag } from "@libgamemodel/components/commoncomponents";
import { LightcycleColorComponent, LightcycleColor } from "@libgamemodel/lightcycle/lightcyclecolor.component";
import { LightcycleComponent2 } from "@libgamemodel/lightcycle/lightcycle.component";
import { Entity } from "@libecs/entity";
import { LightcycleUtils } from "@libgamemodel/lightcycle/lightcycleutils";
import { WallComponent2 } from "@libgamemodel/wall/wallcomponent";
import { CameraRig5Util } from "@libgamemodel/camera/camerarig5.util";

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

  static getWinningPlayerColor(ecs: ECSManager) {
    let highScore = 0;
    let highColor: LightcycleColor = 'blue';
    ecs.iterateComponents([LightcycleComponent2, LightcycleColorComponent], (_, lc, color) => {
      if (lc.Vitality > highScore) {
        highScore = lc.Vitality;
        highColor = color.Color;
      }
    });
    return highColor;
  }

  static killPlayer(ecs: ECSManager, player: Entity) {
    // Destroy all walls the killed player had spawned
    const playerColorComponent = player.getComponent(LightcycleColorComponent);
    const playerColor = playerColorComponent && playerColorComponent.Color;
    ecs.iterateComponents([WallComponent2, LightcycleColorComponent], (e, wall, color) => {
      if (color.Color === playerColor) {
        e.destroy();
      }
    });

    // Enumerate the remaining players
    let remainingPlayers: Entity[] = [];
    ecs.iterateComponents([LightcycleComponent2, LightcycleColorComponent], (entity) => {
      if (entity !== player) {
        remainingPlayers.push(entity);
      }
    });

    // If everyone is dead (somehow), exit early. This should be impossible, but isn't.
    // TODO (sessamekesh): Consider this case more carefully
    if (remainingPlayers.length === 0) return;

    // On main player death, start following another player with the camera
    if (player.hasComponent(MainPlayerComponent)) {
      const nextPlayer = remainingPlayers[Math.floor(Math.random() * remainingPlayers.length)];

      if (nextPlayer) {
        CameraRig5Util.moveCameraRig(ecs, player, nextPlayer);
      }
    }

    // Game end condition - only one player remains
    if (remainingPlayers.length === 1) {
      const gameEndEntity = ecs.createEntity();
      gameEndEntity.addComponent(
        GameEndStateComponent,
        player.getComponent(LightcycleColorComponent)!.Color,
        player);

      if (player.hasComponent(MainPlayerComponent)) {
        // TODO (sessamekesh): Create the victory condition here! Bike slows to a halt, and
        //  fireworks appear around the player.
      } else {
        // TODO (sessamekesh): Show a computer victory state, something real skynet-y
      }

      return;
    }

    // Finally, once everything has been considered, destroy the player themselves.
    player.destroy();
  }
}
