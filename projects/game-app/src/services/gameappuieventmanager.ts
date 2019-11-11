import { EventManager } from '@libutil/eventmanager';

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
  "playerhealth": PlayerHealthEvent,
  "biketilt": BikeTiltEvent,
  "uipresspause": null,
  "apppaused": boolean,
  "player-death": boolean,
}
