import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Select, InputLabel, MenuItem, TextField } from '@material-ui/core';
import { SketchPicker } from 'react-color';
import { glMatrix } from 'gl-matrix';
import { canvasRGBA } from 'stackblur-canvas';

type Color = {r: number, g: number, b: number, a?: number};

export interface State {
  TextureWidth: number,
  HexesPerTexture: number,
  LineWidth: number,
  BlurWidth: number,
  FillColor: Color,
  LineColor: Color,
}

export class HexTileGeneratorApp extends React.Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = {
      TextureWidth: 1024,
      HexesPerTexture: 11,
      LineWidth: 12,
      BlurWidth: 4,
      FillColor: {r: 0, g: 0, b: 0, a: 0,},
      LineColor: {r: 0, g: 0, b: 0, a: 1,},
    };
  }

  componentDidMount() {
    if (!this.canvas) {
      throw new Error('Could not get canvas');
    }

    this.ctx = this.canvas.getContext('2d');
    this.draw();
  }

  private canvas: HTMLCanvasElement|null = null;
  private ctx: CanvasRenderingContext2D|null = null;
  render() {
    return <div style={{display: 'flex', flexDirection: 'row'}}>
      <canvas width={this.state.TextureWidth} height={this.state.TextureWidth} style={{width: '512px', height: '512px', margin: '4px'}}
              ref={c=>this.canvas = c}></canvas>
      <div style={{display: 'flex', flexDirection: 'column', backgroundColor: '#ddd'}}>
        <InputLabel id="texture-size">Texture Size</InputLabel>
        <Select id="texture-size" value={this.state.TextureWidth}
                onChange={(e) => this.setState({...this.state, TextureWidth: e.target.value as number})}>
          <MenuItem value={256}>256</MenuItem>
          <MenuItem value={512}>512</MenuItem>
          <MenuItem value={1024}>1024</MenuItem>
        </Select>
        <InputLabel id="num-hexes">Num Hexes</InputLabel>
        <Select id="num-hexes" value={this.state.HexesPerTexture}
                onChange={(e) => this.setState({...this.state, HexesPerTexture: e.target.value as number})}>
          <MenuItem value={1}>1</MenuItem>
          <MenuItem value={3}>3</MenuItem>
          <MenuItem value={5}>5</MenuItem>
          <MenuItem value={7}>7</MenuItem>
          <MenuItem value={9}>9</MenuItem>
          <MenuItem value={11}>11</MenuItem>
          <MenuItem value={13}>13</MenuItem>
          <MenuItem value={15}>15</MenuItem>
          <MenuItem value={17}>17</MenuItem>
          <MenuItem value={19}>19</MenuItem>
        </Select>
        <TextField label={"Line Width"} value={this.state.LineWidth}
                  onChange={(e) => this.setState({...this.state, LineWidth: +e.target.value})}>
        </TextField>
        <TextField label={"Blur Width"} value={this.state.BlurWidth}
                  onChange={(e) => this.setState({...this.state, BlurWidth: +e.target.value})}>
        </TextField>
        <span>Fill Color</span>
        <SketchPicker color={this.state.FillColor} onChangeComplete={(color) => this.setState({...this.state, FillColor: color.rgb})} />
        <span>Line Color</span>
        <SketchPicker color={this.state.LineColor} onChangeComplete={(color) => this.setState({...this.state, LineColor: color.rgb})} />
      </div>
    </div>;
  }

  componentDidUpdate() {
    this.draw();
  }

  private draw() {
    if (!this.ctx || !this.canvas) {
      console.error('Do not have a 2D context, cannot draw');
      return;
    }

    this.ctx.canvas.width = this.state.TextureWidth;
    this.ctx.canvas.height = this.state.TextureWidth;

    this.ctx.clearRect(0, 0, this.state.TextureWidth, this.state.TextureWidth);

    this.ctx.fillStyle = this.toRgbaString(this.state.FillColor);
    this.ctx.fillRect(0, 0, this.state.TextureWidth, this.state.TextureWidth);
    this.ctx.fill();

    this.ctx.strokeStyle = this.toRgbaString(this.state.LineColor);
    this.ctx.lineWidth = this.state.LineWidth;
    this.ctx.filter = `blur(${this.state.BlurWidth})`;
    const radiusX = this.state.TextureWidth / this.state.HexesPerTexture;
    const radiusY = this.state.TextureWidth / (this.state.HexesPerTexture + 1);
    const circleRadiusX = radiusX / Math.cos(glMatrix.toRadian(30));
    const circleRadiusY = radiusY / Math.cos(glMatrix.toRadian(30));
    let doOffset = false;
    for (let y = 0; y < this.state.TextureWidth + radiusY; y += radiusY) {
      doOffset = !doOffset;
      for (let x = 0; x < this.state.TextureWidth + radiusX; x += radiusX * 7/2) {
        this.ctx.beginPath();
        let x00 = x + circleRadiusX * Math.sin(glMatrix.toRadian(-30));
        let y00 = y + circleRadiusY * Math.cos(glMatrix.toRadian(30));
        if (doOffset) {
          x00 += radiusX * 7 / 4;
        }
        this.ctx.moveTo(x00, y00);
        for (let angle1 = 30; angle1 < 360; angle1 += 60) {
          let x1 = x + circleRadiusX * Math.sin(glMatrix.toRadian(angle1));
          let y1 = y + circleRadiusY * Math.cos(glMatrix.toRadian(angle1));
          if (doOffset) {
            x1 += radiusX * 7 / 4;
          }
          this.ctx.lineTo(x1, y1);
        }
        this.ctx.stroke();
      }
    }

    canvasRGBA(
      this.canvas,
      /* x */ -this.state.BlurWidth,
      /* y */ -this.state.BlurWidth,
      /* w */ this.state.TextureWidth + this.state.BlurWidth * 2,
      /* h */ this.state.TextureWidth + this.state.BlurWidth * 2,
      /* radius */ this.state.BlurWidth);
  }

  private toRgbaString(color: Color) {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a != null ? color.a : 1})`;
  }
}

ReactDOM.render(<div />, document.getElementById('root'));
