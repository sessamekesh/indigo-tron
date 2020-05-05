import { BasicCamera } from "./basiccamera";
import { Entity } from "@libecs/entity";
import { SceneNode } from "@libutil/scene/scenenode";

export class CameraRig4Component {
  constructor(
    public Camera: BasicCamera,
    public LookAtLightcycleDistance: number,
    public CameraPositionFollowDistance: number,
    public LookAtScale: number,
    public FollowScale: number,
    public CameraHeight: number,
    public FollowedEntity: Entity,
    public PositionEntity: Entity,
    public LookAtEntity: Entity,
    public GoalPosition: SceneNode,
    public GoalLookAt: SceneNode) {}
}
