import { BMFont } from '@librender/text/bmfont';
import { ECSManager } from '@libecs/ecsmanager';

export class OpenSansFontSingleton {
  constructor(public OpenSans: BMFont) {}

  static attach(ecs: ECSManager, bmFont: BMFont) {
    ecs.iterateComponents2({}, {OpenSansFontSingleton}, e => e.destroy());
    const e = ecs.createEntity();
    e.addComponent(OpenSansFontSingleton, bmFont);
  }
}
