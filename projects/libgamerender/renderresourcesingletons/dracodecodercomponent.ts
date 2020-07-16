import { DracoDecoder } from '@librender/geo/draco/decoder';
import { ECSManager } from '@libecs/ecsmanager';
import { DracoDecoderCreationOptions } from '@librender/geo/draco/decoderconfig';

export class DracoDecoderComponent {
  constructor(public readonly DracoDecoder: DracoDecoder) {}

  static async upsertSingleton(ecs: ECSManager, createOptions: DracoDecoderCreationOptions) {
    const existing = ecs.getSingletonComponent(DracoDecoderComponent);
    if (existing) return existing;

    const decoder = await DracoDecoder.create(createOptions);
    const e = ecs.createEntity();
    return e.addComponent(DracoDecoderComponent, decoder);
  }
}
