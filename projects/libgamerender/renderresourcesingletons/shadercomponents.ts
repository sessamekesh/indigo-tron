import { LambertShader } from '@librender/shader/lambertshader';
import { FlatColorLambertShader } from '@librender/shader/flatcolorlambertshader';
import { Solid2DShader } from '@librender/shader/solid2dshader';
import { ArenaFloorShader2 } from '@librender/shader/arenafloorshader2';
import { ArenaFloorShader3 } from '@librender/shader/arenafloorshader3';
import { ArenaWallShader2 } from '@librender/shader/arenawallshader2';

export class ShaderSingletonTag {}

export class LambertShaderComponent {
  constructor(public readonly LambertShader: LambertShader) {}
}

export class FlatColorLambertShaderComponent {
  constructor(public readonly FlatColorLambertShader: FlatColorLambertShader) {}
}

export class Solid2DShaderComponent {
  constructor(public readonly Solid2DShader: Solid2DShader) {}
}

export class ArenaFloor2ShaderComponent {
  constructor(public readonly ArenaFloor2Shader: ArenaFloorShader2) {}
}

export class ArenaFloor3ShaderSingleton {
  constructor(public readonly ArenaFloor3Shader: ArenaFloorShader3) {}
}

export class ArenaWallShader2Singleton {
  constructor(public readonly ArenaWallShader2: ArenaWallShader2) {}
}
