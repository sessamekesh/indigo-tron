import { Component, ViewChild, ElementRef, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { GameAppUIEvents } from '../services/gameappuieventmanager';
import { CachingEventManager } from '@libutil/cachingeventmanager';
import { GameAppService2 } from '../services/gameappservice2';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('gameCanvas') canvasElement: ElementRef<HTMLCanvasElement>|undefined;
  private gl_: WebGL2RenderingContext|undefined;
  //private gameService_: GameAppService|undefined;
  private gameService_: GameAppService2|undefined;
  gameAppUiEventManager = new CachingEventManager<GameAppUIEvents>();
  isLoaded = false;
  isDead = false;
  isPaused = false;

  constructor(private cdr: ChangeDetectorRef) {}

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
    // this.gameService_ = await GameAppService.create(context, this.gameAppUiEventManager);
    this.gameService_ = await GameAppService2.create(context, this.gameAppUiEventManager);

    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('loading-finished');
      setTimeout(() => loadingScreen.remove(), 550);
    }

    this.isLoaded = true;
    this.cdr.markForCheck();

    this.gameAppUiEventManager.addListener('player-death', (isDead) => {
      this.isDead = isDead;
      this.cdr.markForCheck();
    });

    this.gameAppUiEventManager.addListener('apppaused', (paused) => {
      this.isPaused = paused;
      this.cdr.markForCheck();
    });

    this.gameService_.start();
  }

  pause() {
    if (this.gameService_) {
      this.gameService_.pause();
    }
  }

  ngOnDestroy() {
    if (this.gameService_) {
      // this.gameService_.destroy();
    }

    if (this.gameAppUiEventManager) {
      this.gameAppUiEventManager.destroy();
    }
  }

  restartGame() {
    if (this.gameService_) {
      this.gameService_.restart();
    }
  }
}
