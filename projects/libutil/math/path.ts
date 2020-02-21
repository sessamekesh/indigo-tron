import { vec2 } from "gl-matrix";

export interface Path2D {
  maxTime(): number;
  posAt(time: number, o_pos: vec2): void;
}

export class PointToPointRepeatPath implements Path2D {
  private a_ = vec2.create();
  private b_ = vec2.create();
  constructor(start: vec2, end: vec2, private timeToComplete: number) {
    vec2.copy(this.a_, start);
    vec2.copy(this.b_, end);
  }

  maxTime() {
    return this.timeToComplete;
  }

  posAt(time: number, o_pos: vec2) {
    vec2.lerp(o_pos, this.a_, this.b_, (time % this.timeToComplete) / this.timeToComplete);
  }
}
