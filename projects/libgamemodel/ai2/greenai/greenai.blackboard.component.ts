import { OwnedResource } from "@libutil/allocator";
import { vec2 } from "gl-matrix";
import { Blackboard } from "../blackboard";
import { Entity } from "@libecs/entity";

export interface GreenAiBlackboardTypes {
  'WanderGoal': OwnedResource<vec2>,
  'WallScanDistance': number,
  'WanderBounds': { minX: number, maxX: number, minZ: number, maxZ: number, },
  'OversteerTimeRemaining': number,
  'OversteerTimeTotal': number,
  'OversteerDirection': 'right'|'left',
}

export type GreenAiBlackboard = Blackboard<GreenAiBlackboardTypes>;

export class GreenAiBlackboardComponent {
  constructor(public Blackboard: GreenAiBlackboard) {}

  static get(entity: Entity) {
    let blackboard = entity.getComponent(GreenAiBlackboardComponent);
    if (!blackboard) {
      blackboard = entity.addComponent(
        GreenAiBlackboardComponent, new Blackboard<GreenAiBlackboardTypes>());
      entity.addListener('destroy', () => {
        blackboard?.Blackboard.get('WanderGoal')?.ReleaseFn();

        blackboard?.Blackboard.clear();
      });
    }
    return blackboard;
  }
}
