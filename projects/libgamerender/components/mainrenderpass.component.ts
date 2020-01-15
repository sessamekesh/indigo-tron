import { LambertRenderCall2 } from '@librender/shader/lambertshader';
import { FrameSettings } from '@libgamerender/framesettings';

export class MainRenderPassComponent {
  constructor(
    public LambertCalls: LambertRenderCall2[],
    public FrameSettings: FrameSettings,
  ) {}
}
