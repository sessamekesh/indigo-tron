import { IEventManager } from "@libutil/eventmanager";

type PlayerHealthEvent = {
  CurrentHealth: number,
  MaxHealth: number,
};

type BikeTiltEvent = {
  MinTilt: number,
  CenterTilt: number,
  MaxTilt: number,
  CurrentTilt: number,
};

export interface GameAppUIEvents {
  "showloadingscreen": boolean,
  "playerhealth": PlayerHealthEvent,
  "biketilt": BikeTiltEvent,
  "uipresspause": null,
  "apppaused": boolean,
  "player-death": boolean,
}

export class UIEventEmitterComponent {
  constructor(public EventEmitter: IEventManager<GameAppUIEvents>) {}
}
