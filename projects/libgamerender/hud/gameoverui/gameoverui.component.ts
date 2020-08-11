import { vec2, vec4 } from 'gl-matrix';
import { StandardButtonComponent } from '../menu/btnstartgame.component';
import { Entity } from '@libecs/entity';

export class GameOverUiSettingsSingleton {
  constructor(
    public VictoryText: string,
    public DefeatText: string,
    public BoxWidth: number,
    public BoxHeight: number,
    public BoxOrigin: vec2,
    public BoxColor: vec4,
    public TextYOfset: number,

    public StartOverButton: StandardButtonComponent,
    public StartOverButtonInstace: Entity|null) {}
}
