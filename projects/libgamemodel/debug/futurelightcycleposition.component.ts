import { OwnedResource } from "@libutil/allocator";
import { vec3 } from "gl-matrix";

export class FutureLightcyclePositionComponent {
  constructor(public Position: OwnedResource<vec3>) {}
}
