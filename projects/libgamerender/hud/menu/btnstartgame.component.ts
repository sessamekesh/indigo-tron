import { MouseMoveEvent, MousePointEvent } from '@io/mousestatemanager';
import { OwnedResource } from '@libutil/allocator';
import { vec2, vec4 } from 'gl-matrix';
import { MsdfStringRenderable2 } from '@librender/text/msdfstring.renderable2';
import { SolidColorUiRenderable2 } from '@librender/ui/solidcolorui.renderable2';

export class StandardButtonComponent {
  constructor(
    public Text: string,
    public Width: number,
    public Height: number,
    public Origin: OwnedResource<vec2>,
    public BtnColor: OwnedResource<vec4>,
    public HoverColor: OwnedResource<vec4>,
    public PressedColor: OwnedResource<vec4>,
    public OnPress: ()=>void) {}
}

export class StandardButtonRenderComponent {
  constructor(
    public TextRenderable: MsdfStringRenderable2,
    public Background: SolidColorUiRenderable2) {}
}

export class StandardButtonListenersComponent {
  constructor(
    public MouseDownInside: boolean,
    public MouseHoveredInside: boolean,
    public MouseMoveListener: (evt: MouseMoveEvent)=>void,
    public MouseDownListener: (evt: MousePointEvent)=>void,
    public MouseUpListener: (evt: MousePointEvent)=>void) {}
}

export class MenuButtonRenderTag {}
