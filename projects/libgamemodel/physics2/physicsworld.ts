import { CollisionLine } from "./collisionline";

/**
 * TODO (sessamekesh): Continue writing the physics subsystem.
 * You have: rigid body and collideable box.
 * You need: physics objects (a rigid body with collideables) (or, alternatively, attach collidables to a body)
 * You need: a force that applies torque to the front wheel based on player steering
 * You need: a force that applies at the front wheel in the direction of the front wheel
 * You need: a force that applies air resistance to the lightcycle
 *
 * Basic idea (it's midnight writing this and I'm out of juice, so sorry):
 * - Apply forces to the lightcycle bodies
 *   - Driving force, air resistance force.
 * - Integrate lightcycle bodies
 * - In a loop...
 *   - for each collision between a lightcycle and a wall or other lightcycle...
 *     - resolve position / velocity constraint
 *     - based on velocity constraint adjustment, send a damage signal to the engine
 * - ... until there are either no more collisions, or some number of iterations have passed.
 *
 * There are two ways this has to interact with the rest of the engine:
 * - Input: What is the direction of the front wheel steering?
 * - Output: What is the position and rotation of each lightcycle?
 * - Output: What were all the resolved collisions (lightcycles and walls, velocity adjustments)
 */
export class PhysicsWorld {
  private walls: CollisionLine[] = [];

  addWall(wall: CollisionLine) {
    this.walls.push(wall);
  }

  // Expensive delete - this should still be okay
  removeWall(wall: CollisionLine) {
    // It is unlikely that two walls are removed on the same frame
    this.walls = this.walls.filter(w => w !== wall);
  }

  update(dt: number) {

  }
}
