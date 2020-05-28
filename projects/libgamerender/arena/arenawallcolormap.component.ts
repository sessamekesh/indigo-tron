import { LightcycleColor } from '@libgamemodel/lightcycle/lightcyclecolor.component';
import { vec3 } from 'gl-matrix';

export class ArenaWallColorMapComponent {
  constructor(
    public ColorMap: Map<LightcycleColor, vec3>,
    public DefaultColor: vec3) {}
}
