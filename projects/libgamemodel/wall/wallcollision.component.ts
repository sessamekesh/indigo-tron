import { CollisionLine } from "@libgamemodel/physics4/collisionline";

export class WallCollisionComponent {
  constructor(public CollisionLine: CollisionLine, public TimeToActivation: number) {}
}
