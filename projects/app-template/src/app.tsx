import * as React from 'react';
import { AppService } from './appservice';

export class App extends React.Component<{}, {}> {
  private canvas_: HTMLCanvasElement|null = null;
  private appService_: AppService|null = null;

  async componentDidMount() {
    if (!this.canvas_) return;

    const gl = this.canvas_.getContext('webgl2');
    if (!gl) return;

    this.appService_ = await AppService.create(gl);
    this.appService_.start();
  }

  render() {
    return <div style={this.fullStyle}>
      <canvas id="game-canvas" ref={(e)=>{this.canvas_ = e}} style={this.fullStyle}>
        HTML5 Canvas not available
      </canvas>
    </div>;
  }

  private fullStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  };
}
