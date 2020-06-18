import { LambertShader } from '@librender/shader/lambertshader';
import { FlatColorLambertShader } from '@librender/shader/flatcolorlambertshader';
import { ArenaWallShader } from '@librender/shader/arenawallshader';
import { Solid2DShader } from '@librender/shader/solid2dshader';
import { ArenaFloorShader2 } from '@librender/shader/arenafloorshader2';

export class ShaderSingletonTag {}

export class LambertShaderComponent {
  constructor(public readonly LambertShader: LambertShader) {}
}

export class FlatColorLambertShaderComponent {
  constructor(public readonly FlatColorLambertShader: FlatColorLambertShader) {}
}

export class ArenaWallShaderComponent {
  constructor(public readonly ArenaWallShader: ArenaWallShader) {}
}

export class Solid2DShaderComponent {
  constructor(public readonly Solid2DShader: Solid2DShader) {}
}

export class ArenaFloor2ShaderComponent {
  constructor(public readonly ArenaFloor2Shader: ArenaFloorShader2) {}
}
