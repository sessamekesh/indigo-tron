import { OwnedResource } from "@libutil/allocator";
import { vec2 } from "gl-matrix";

export class LightcycleComponent3 {
  constructor(
    public FrontWheelPosition: OwnedResource<vec2>,
    public RearWheelPosition: OwnedResource<vec2>,
    public FrontWheelRotation: number) {}
}
