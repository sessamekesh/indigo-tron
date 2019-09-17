import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { GameAppService } from '../services/gameappservice';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @ViewChild('gameCanvas') canvasElement: ElementRef<HTMLCanvasElement>|undefined;
  private gl_: WebGL2RenderingContext|undefined;
  private gameService_: GameAppService|undefined;

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
    this.gameService_ = await GameAppService.create(context);
    this.gameService_.start();
  }

  clickButton() {
    if (!this.gameService_) return;
    this.gameService_.changeClearColor();
  }
}
