import { ECSManager, KlassObjBase } from './ecsmanager';

export abstract class ECSSystem {
  abstract start(ecs: ECSManager): boolean;
  abstract update(ecs: ECSManager, msDt: number): void;

  protected expectSingletons<KlassObj extends KlassObjBase>(
      ecs: ECSManager,
      singletonQuery: KlassObj,
      systemName: string): boolean {
    const missingSingletons = ecs.withSingletons(singletonQuery, ()=>{});
    if (missingSingletons.length > 0) {
      console.error(`[${systemName}]: Missing singletons ${missingSingletons.join(',')}`);
      return false;
    }

    return true;
  }
}
