import { GeoBase } from '@librender/geo/geobase';
import { Solid2DShaderAttribNames } from '@librender/shader/solid2dshader';

export class LightcycleMinimapGeoSingleton {
  constructor(public Geo: GeoBase<Solid2DShaderAttribNames>) {}
}
