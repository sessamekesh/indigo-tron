import { ECSSystem } from "@libecs/ecssystem";
import { ECSManager } from "@libecs/ecsmanager";
import { GreenAiComponent } from "@libgamemodel/ai/greenai.component";
import { GreenAiGoalDebugComponent, GreenAiGoalMarkerComponent } from "./greenaigoal.debugcomponent";
import { OwnedMathAllocatorsComponent } from "@libgamemodel/components/commoncomponents";

export class GreenAiGoalDebugSystem extends ECSSystem {
  start() { return true; }
  update(ecs: ECSManager, msDt: number) {
    const { Vec3: vec3Allocator } = ecs.getSingletonComponentOrThrow(OwnedMathAllocatorsComponent);

    ecs.iterateComponents([GreenAiComponent], (entity, greenAiComponent) => {
      let existingComponent = entity.getComponent(GreenAiGoalMarkerComponent);
      const action = greenAiComponent.CurrentAction;

      if (action.action !== 'APPROACH_LOCATION' && existingComponent) {
        existingComponent.GoalMarkerEntity.destroy();
        entity.removeComponent(GreenAiGoalMarkerComponent);
        return;
      }

      if (action.action === 'APPROACH_LOCATION') {
        if (!existingComponent) {
          const markerEntity = ecs.createEntity();
          existingComponent = entity.addComponent(GreenAiGoalMarkerComponent, markerEntity);
        }

        let existingDebugComponent = existingComponent.GoalMarkerEntity.getComponent(
          GreenAiGoalDebugComponent);
        if (!existingDebugComponent) {
          const newPos = vec3Allocator.get();
          newPos.Value[0] = greenAiComponent.CurrentGoalLocation[0];
          newPos.Value[1] = 1.5; // Constant, because debug
          newPos.Value[2] = greenAiComponent.CurrentGoalLocation[1];
          existingDebugComponent = existingComponent.GoalMarkerEntity.addComponent(
            GreenAiGoalDebugComponent, newPos);
          existingComponent.GoalMarkerEntity.addListener('destroy', () => newPos.ReleaseFn());
        }

        existingDebugComponent.GoalLocation.Value[0] = greenAiComponent.CurrentGoalLocation[0];
        existingDebugComponent.GoalLocation.Value[2] = greenAiComponent.CurrentGoalLocation[1];
      }
    });
  }
}
