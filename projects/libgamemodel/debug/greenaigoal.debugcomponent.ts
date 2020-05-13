import { OwnedResource } from "@libutil/allocator";
import { vec3 } from "gl-matrix";
import { Entity } from "@libecs/entity";

export class GreenAiGoalMarkerComponent {
  constructor(public GoalMarkerEntity: Entity) {}
}

export class GreenAiGoalDebugComponent {
  constructor(public GoalLocation: OwnedResource<vec3>) {}
}
