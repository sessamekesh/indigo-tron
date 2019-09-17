import { ECSManager } from './ecsmanager';

export abstract class ECSSystem {
  abstract start(ecs: ECSManager): boolean;
  abstract update(ecs: ECSManager, msDt: number): void;
}
