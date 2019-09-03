import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @ViewChild('gameCanvas') canvasElement: ElementRef<HTMLCanvasElement>|undefined;
  private gl_: WebGL2RenderingContext|undefined;

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
    this.drawFrame();
  }

  private color = [0, 0, 1];
  private drawFrame() {
    if (!this.gl_) return;
    const gl = this.gl_;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(this.color[0], this.color[1], this.color[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  clickButton() {
    this.color[0] = 1 - this.color[0];
    this.color[2] = 1 - this.color[2];
    this.drawFrame();
  }
}
