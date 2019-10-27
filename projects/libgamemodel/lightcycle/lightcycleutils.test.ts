import { LineSegment2DCollision } from "@libutil/math/linesegment";
import { glMatrix } from "gl-matrix";
import { LightcycleUtils } from "./lightcycleutils";

const testRandomFn = () => 1;

describe('LightcycleUtils', () => {
  describe('getSideCollisionAction', () => {
    it('deflects bike on shallow (left side) angles 5deg, 10deg, 15deg', () => {
      const shallowCollision: LineSegment2DCollision = {
        isColinear: false,
        angle: glMatrix.toRadian(5),
        depth: 0.5,
      };
      const collisionAction = LightcycleUtils.getSideCollisionAction(
        shallowCollision, 1, testRandomFn);
      expect(collisionAction.vitalityLost).toBeCloseTo(0.625);
      expect(collisionAction.bikeSteeringAdjustment).toBeCloseTo(glMatrix.toRadian(10));
    });
  });
});

/**
 {isColinear: false, angle: 2.9538536756186637, depth: 0.07606887817382808}
 {x0: 3.8844540119171143, y0: -17.064237594604492, x1: 5.076068878173828, y1: -10.791794776916504}
 {x0: 5, y0: -10.218588829040527, x1: 5, y1: -11.528936386108398}
 */
