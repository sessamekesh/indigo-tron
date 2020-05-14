import { vec2 } from "gl-matrix";
import { Entity } from "@libecs/entity";
import { OwnedResource } from "@libutil/allocator";
import { LineSegment2D } from "@libutil/math/linesegment";

export class GreenAiComponent {
  constructor(
    public CurrentGoalLocation: vec2,
    public ReactionTimeDelay: number,
    public ScanRadius: number,
    public CurrentAction: GreenAiStrategy,
    public NextStrategy: GreenAiStrategyTransition|null,
    public RandFn: ()=>number) {}
}

export type GreenAiStrategy = {
  action: 'AVOID_WALL',
  wall: LineSegment2D,
} | {
  action: 'AVOID_PLAYER',
  playerEntity: Entity,
} | {
  action: 'CUT_OFF_PLAYER',
  playerEntity: Entity,
} | {
  action: 'APPROACH_LOCATION',
  location: OwnedResource<vec2>,
} | {
  action: 'COAST',
};

export type GreenAiStrategyTransition = {
  reactionTimeRemaining: number,
  nextStrategy: GreenAiStrategy,
};
