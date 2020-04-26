import { LineSegment2D } from "@libutil/math/linesegment";
import { vec3 } from "gl-matrix";

export class ArenaWallComponent {
  constructor(public LineSegment: LineSegment2D, public FuckIt: boolean) {}
}

export class ArenaWallImpactComponent {
  constructor(public Location: vec3) {}
}
