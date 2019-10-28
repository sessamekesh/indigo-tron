import { Component, ViewChild, ElementRef, OnInit, Input, ChangeDetectionStrategy, OnDestroy } from "@angular/core";
import { EventManager } from '@libutil/eventmanager';
import { GameAppUIEvents } from '../../services/gameappuieventmanager';

@Component({
  selector: 'game-hud',
  templateUrl: './hud.component.html',
  styleUrls: ['./hud.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HudComponent implements OnInit, OnDestroy {
  @ViewChild('redHealthBar') redHealthBar: ElementRef<HTMLDivElement>|undefined;
  @ViewChild('greenHealthBar') greenHealthBar: ElementRef<HTMLDivElement>|undefined;
  @ViewChild('healthBarText') healthBarText: ElementRef<HTMLDivElement>|undefined;

  @Input('uiEventManager') uiEventManager: EventManager<GameAppUIEvents>|undefined;

  private playerHealthListener_: ((playerHealthEvent: any)=>void)|undefined;

  ngOnInit() {
    if (!this.redHealthBar || !this.greenHealthBar || !this.healthBarText) {
      throw new Error('Could not get all UI elements for the HUD');
    }

    if (!this.uiEventManager) {
      throw new Error('Failed to inject UI event manager, cannot construct UI');
    }

    this.playerHealthListener_ =
      this.uiEventManager.addListener('playerhealth', (playerHealthEvent) => {
        this.healthBarText!.nativeElement.innerText =
            `${Math.round(playerHealthEvent.CurrentHealth)} / ${playerHealthEvent.MaxHealth}`;
      // TODO (sessamekesh): Animate the bar smaller
      const healthAmt = playerHealthEvent.CurrentHealth / playerHealthEvent.MaxHealth;
      const width = Math.round(healthAmt * 500);
      this.redHealthBar!.nativeElement.style.width = `${width}px`;
      this.greenHealthBar!.nativeElement.style.width = `${width}px`;
    });
  }

  ngOnDestroy() {
    if (this.playerHealthListener_ && this.uiEventManager) {
      this.uiEventManager.removeListener('playerhealth', this.playerHealthListener_);
    }
  }
}
