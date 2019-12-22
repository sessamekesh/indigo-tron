import { LambertShader } from '@librender/shader/lambertshader';
import { ArenaFloorShader } from '@librender/shader/arenafloorshader';

export class ShaderSingletonTag {}

export class LambertShaderComponent {
  constructor(public readonly LambertShader: LambertShader) {}
}

export class ArenaFloorShaderComponent {
  constructor(public readonly ArenaFloorShader: ArenaFloorShader) {}
}
