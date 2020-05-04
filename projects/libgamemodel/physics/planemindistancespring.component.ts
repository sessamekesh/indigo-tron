import { OwnedResource } from "@libutil/allocator";
import { Plane } from "./plane";

export class PlaneMinDistanceSpringComponent {
  constructor(
    public Plane: OwnedResource<Plane>,
    public MinDistance: number,
    public SpringConstant: number, // in Newtons per meter
  ) {}
}
