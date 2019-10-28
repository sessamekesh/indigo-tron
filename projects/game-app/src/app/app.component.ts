import { Component, ViewChild, ElementRef, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { GameAppService } from '../services/gameappservice';
import { GameAppUIEvents } from '../services/gameappuieventmanager';
import { CachingEventManager } from '@libutil/cachingeventmanager';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('gameCanvas') canvasElement: ElementRef<HTMLCanvasElement>|undefined;
  private gl_: WebGL2RenderingContext|undefined;
  private gameService_: GameAppService|undefined;
  gameAppUiEventManager = new CachingEventManager<GameAppUIEvents>();

  async ngOnInit() {
    if (!this.canvasElement || !this.canvasElement.nativeElement) {
      throw new Error('Failed to initialize, canvas element is not found!');
    }

    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('webgl2', {alpha: false});
    if (!context) {
      throw new Error('Failed to initialize WebGL2 context, device/browser does not support WebGL 2');
    }

    this.gl_ = context;
    this.gameService_ = await GameAppService.create(context, this.gameAppUiEventManager);
    this.gameService_.start();
  }

  ngOnDestroy() {
    if (this.gameService_) {
      this.gameService_.destroy();
    }

    if (this.gameAppUiEventManager) {
      this.gameAppUiEventManager.destroy();
    }
  }
}
