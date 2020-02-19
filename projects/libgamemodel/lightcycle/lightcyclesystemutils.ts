import { ECSManager } from "@libecs/ecsmanager";
import { MathAllocatorsComponent, OwnedMathAllocatorsComponent } from "@libgamemodel/components/commoncomponents";
import { CommonComponentUtils } from "@libgamemodel/components/commoncomponentutils";
import { LightcycleUpdateSystem2 } from "./lightcycleupdate2.system";
import { WallSpawnerSystem2 } from "@libgamemodel/wall/wallspawner2.system";

/**
 * Utility methods for creating lightcycle related modules
 */
export class LightcycleSystemUtils {
  static installLightcycleUpdateSystem(ecs: ECSManager) {
    if (!ecs.getSingletonComponent(MathAllocatorsComponent)) {
      CommonComponentUtils.getTempMathAllocatorsComponent(ecs);
    }
    ecs.addSystem2(LightcycleUpdateSystem2);
  }

  static installWallSpawnerSystem(ecs: ECSManager) {
    if (!ecs.getSingletonComponent(MathAllocatorsComponent)) {
      CommonComponentUtils.getTempMathAllocatorsComponent(ecs);
    }
    if (!ecs.getSingletonComponent(OwnedMathAllocatorsComponent)) {
      CommonComponentUtils.getOwnedMathAllocatorsComponent(ecs);
    }
    ecs.addSystem2(WallSpawnerSystem2);
  }
}
