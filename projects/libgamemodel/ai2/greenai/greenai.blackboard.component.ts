import { OwnedResource } from "@libutil/allocator";
import { vec2 } from "gl-matrix";
import { Blackboard } from "../blackboard";
import { Entity } from "@libecs/entity";

export interface GreenAiBlackboardTypes {
  'WanderGoal': OwnedResource<vec2>,
  'WanderBounds': { minX: number, maxX: number, minZ: number, maxZ: number, }
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
        blackboard?.Blackboard.clear();
      });
    }
    return blackboard;
  }
}
