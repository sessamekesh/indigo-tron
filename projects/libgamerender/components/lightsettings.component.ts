import { vec3 } from 'gl-matrix';

export class LightSettingsComponent {
  constructor(public Direction: vec3, public Color: vec3, public AmbientCoefficient: number) {}
}
