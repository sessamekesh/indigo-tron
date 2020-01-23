import { vec2 } from 'gl-matrix';
import { OwnedResource } from '@libutil/allocator';

export class WallComponent {
  constructor(
    public Corner1: vec2,
    public Corner2: vec2,
    public Vitality: number,
  ) {}
}

export class WallComponent2 {
  constructor(
    public Corner1: OwnedResource<vec2>,
    public Corner2: OwnedResource<vec2>,
    public Vitality: number) {}
}
