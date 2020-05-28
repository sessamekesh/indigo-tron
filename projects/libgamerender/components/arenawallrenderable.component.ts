import { mat4, vec2, vec3 } from 'gl-matrix';
import { ArenaWallGeo } from '@librender/geo/arenawallgeo';
import { Texture } from '@librender/texture/texture';

export class ArenaWallRenderableComponent {
  constructor(
    public MatWorld: mat4,
    public BaseColorTilingScale: vec2,
    public IntensityTilingScale: vec2,
    public ForceFieldTilingScale: vec2,
    public IntensityDisplacement: vec2,
    public IntensityDisplacementUpdateRate: vec2,
    public DistortionOffset: vec2,
    public DistortionOffsetUpdateRate: vec2,
    public ForceFieldColor: vec3,
    public BaseColorRatio: number) {}
}

export class ArenaWallRenderingConfigComponent {
  constructor(
    public BaseColorUVPerWorldUnit: vec2,
    public IntensityUVPerWorldUnit: vec2,
    public ForceFieldUVPerWorldUnit: vec2,
    public IntensityDisplacementUpdateRateInWorldUnits: vec2,
    public DistortionOffsetUpdateRateInWorldUnits: vec2) {}
}

export class ArenaWallUnitGeoComponent {
  constructor(public Geo: ArenaWallGeo) {}
}

export class ArenaWallTexturePackComponent {
  constructor(
    public BaseColor: Texture,
    public Distortion: Texture,
    public Intensity: Texture,
    public ForceField: Texture) {}
}
