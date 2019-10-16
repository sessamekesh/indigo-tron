import { vec2 } from 'gl-matrix';

export class WallComponent {
  constructor(
    public Corner1: vec2,
    public Corner2: vec2,
    public Vitality: number,
  ) {}
}
