import { GeoBase } from '@librender/geo/geobase';
import { Texture } from '@librender/texture/texture';
import { vec2 } from 'gl-matrix';
import { ArenaWall2AttribType } from '@librender/shader/arenawallshader2';

export class ArenaWall2RenderResourcesSingleton {
  constructor(
    public readonly ArenaWallGeo: GeoBase<ArenaWall2AttribType>,
    public readonly CloudWispTexture1: Texture,
    public readonly CloudWispTexture2: Texture,
    public readonly WispTexture1Scale: vec2,
    public readonly WispTexture2Scale: vec2,
    public readonly WispVelocity1: vec2,
    public readonly WispVelocity2: vec2) {}
}
