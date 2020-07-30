import { MsdfStringRenderable2 } from '@librender/text/msdfstring.renderable2';
import { SolidColorUiRenderable2 } from '@librender/ui/solidcolorui.renderable2';

export class PlayerHealthUiComponent {
  constructor(
    public TextRenderable: MsdfStringRenderable2,
    public OutlineLeftHalfCircle: SolidColorUiRenderable2,
    public OutlineRightHalfCircle: SolidColorUiRenderable2,
    public OutlineRect: SolidColorUiRenderable2,
    public GreenRect: SolidColorUiRenderable2,
    public RedRect: SolidColorUiRenderable2) {}
}
