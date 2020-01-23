import { LambertRenderCall2 } from '@librender/shader/lambertshader';
import { FrameSettings } from '@libgamerender/framesettings';
import { ArenaFloorRenderCall2 } from '@librender/shader/arenafloorshader';

export class FloorReflectionRenderPassComponent {
  constructor(
    public LambertCalls: LambertRenderCall2[],
    public FrameSettings: FrameSettings) {}
}

export class MainRenderPassComponent {
  constructor(
    public LambertCalls: LambertRenderCall2[],
    public FloorReflectionCalls: ArenaFloorRenderCall2[],
    public FrameSettings: FrameSettings) {}
}
