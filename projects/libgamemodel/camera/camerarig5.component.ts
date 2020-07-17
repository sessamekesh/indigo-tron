import { Entity } from "@libecs/entity";
import { BasicCamera } from "./basiccamera";

export class CameraRig5Component {
  constructor(
    public Camera: BasicCamera,
    public CameraHeight: number,
    public LookAtHeight: number,
    public WallCollisionRadius: number,
    public FollowDistance: number,
    public LeadDistance: number,
    public FollowCurveTime: number,
    public LeadCurveTime: number,
    public CarEntity: Entity,
    public GoalApproachMinVelocity: number,
    public GoalApproachMaxVelocity: number,
    public GoalApproachMaxDistance: number) {}
}

export class CameraRig5TargetTag {}
