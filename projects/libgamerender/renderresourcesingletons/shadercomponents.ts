import { LambertShader } from '@librender/shader/lambertshader';
import { ArenaFloorShader } from '@librender/shader/arenafloorshader';
import { FlatColorLambertShader } from '@librender/shader/flatcolorlambertshader';
import { ArenaWallShader } from '@librender/shader/arenawallshader';
import { Solid2DShader } from '@librender/shader/solid2dshader';

export class ShaderSingletonTag {}

export class LambertShaderComponent {
  constructor(public readonly LambertShader: LambertShader) {}
}

export class ArenaFloorShaderComponent {
  constructor(public readonly ArenaFloorShader: ArenaFloorShader) {}
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
