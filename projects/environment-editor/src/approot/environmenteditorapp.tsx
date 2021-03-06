import * as React from 'react';
import { EnvironmentEditorAppService } from 'src/logical/environmenteditorapp/environmenteditorappservice';
import { FormControl, InputLabel, Select, MenuItem } from '@material-ui/core';
import { assert } from '@libutil/loadutils';
import { KeyboardStateManager } from '@io/keyboardstatemanager';
import { MouseStateManager } from '@io/mousestatemanager';
import { BoundedNumberInput } from './input/boundednumberinput';
import { vec4 } from 'gl-matrix';
import { GameConfig, GameConfigUtil } from '@libgamemodel/config';

interface EnvironmentEditorAppProps {

}

interface EnvironmentEditorAppState {
  IsLoading: boolean,
  CameraType: 'free' | 'centered' | 'simulation',
  ArenaWidth: number, ArenaHeight: number,
  EnvironmentWidth: number, EnvironmentDepth: number,
  EnvironmentNumRows: number, EnvironmentNumCols: number,
  EnvironmentStartX: number, EnvironmentStartZ: number,
}

export class EnvironmentEditorApp
    extends React.Component<EnvironmentEditorAppProps, EnvironmentEditorAppState> {
  private canvas_: HTMLCanvasElement|null = null;
  private app_: EnvironmentEditorAppService|null = null;
  private keyboardStateManater_ = new KeyboardStateManager();
  private mouseStateManager_ = new MouseStateManager();

  state: EnvironmentEditorAppState = {
    IsLoading: true,
    CameraType: 'free',
    ArenaWidth: 500,
    ArenaHeight: 500,
    EnvironmentWidth: 1000,
    EnvironmentDepth: 1000,
    EnvironmentNumRows: 100,
    EnvironmentNumCols: 100,
    EnvironmentStartX: 0,
    EnvironmentStartZ: 0,
  };

  async componentDidMount() {
    if (!this.canvas_) {
      throw new Error('Failed to get canvas reference');
    }

    const gl = this.canvas_.getContext('webgl2');
    if (!gl) {
      throw new Error('Failed to get WebGL2 context');
    }

    this.app_ = await EnvironmentEditorAppService.create(
      gl, this.keyboardStateManater_, this.mouseStateManager_);

    try {
      const loadedConfig = await fetch('assets/gameconfig.json').then(r=>r.text());
      const config = GameConfigUtil.parseJsonString(loadedConfig);
      if (config) {
        this.app_.setConfig(config);
      }
    } catch (e) {}

    const config = this.app_.getConfig();
    if (config) {
      this.setState(this.stateFromConfig(config));
    }
    this.app_.start();
    this.setState({...this.state, IsLoading: false});
  }

  private stateFromConfig(config: GameConfig): EnvironmentEditorAppState {
    return {
      ...this.state,
      ArenaWidth: config.Arena.Width,
      ArenaHeight: config.Arena.Height,
      EnvironmentWidth: config.Environment.Width,
      EnvironmentDepth: config.Environment.Height,
      EnvironmentNumRows: config.Environment.NumRows,
      EnvironmentNumCols: config.Environment.NumCols,
      EnvironmentStartX: config.Environment.StartX,
      EnvironmentStartZ: config.Environment.StartZ,
    };
  }

  componentWillUnmount() {
    this.keyboardStateManater_.destroy();
    this.mouseStateManager_.destroy();
  }

  private settingsMenu(): JSX.Element {
    if (this.state.IsLoading) {
      return (
        <div style={this.settingsContainerInnerStyle()}>
          <span>Loading...</span>
        </div>
      );
    } else {
      // TODO (sessamekesh): Break this up into a whole bunch of component files, since it's getting huge.
      return (
        <div style={this.settingsContainerInnerStyle()}>
            <span style={{alignSelf: 'center'}}>Settings</span>
            <div style={this.horizontalDividerStyle()}></div>
            <div style={this.sectionHeaderStyle()}>Camera</div>
            <FormControl>
              <InputLabel id="camera-type-dropdown">Camera Type</InputLabel>
              <Select labelId="camera-type-dropdown" value={this.state.CameraType}
                      onChange={(e) => this.onChangeCameraType(e.target.value as string)}>
                <MenuItem value={'free'}>Free</MenuItem>
                <MenuItem value={'centered'}>Centered</MenuItem>
              </Select>
            </FormControl>
            <FormControl style={{display: 'flex', flexDirection: 'row'}}>
              <BoundedNumberInput label="Arena Width" value={this.state.ArenaWidth}
                                  minValue={1} maxValue={Number.MAX_SAFE_INTEGER}
                                  onUpdate={(e) => this.onChangeArenaDimensions(e, this.state.ArenaHeight)}
                                  numberType={'float'} sign={'positive'}></BoundedNumberInput>
              <div style={{width: '10px'}}></div>
              <BoundedNumberInput label="Arena Height" value={this.state.ArenaHeight}
                                  minValue={1} maxValue={Number.MAX_SAFE_INTEGER}
                                  onUpdate={(e) => this.onChangeArenaDimensions(this.state.ArenaWidth, e)}
                                  numberType={'float'} sign={'positive'}></BoundedNumberInput>
            </FormControl>
            <div style={this.horizontalDividerStyle()}></div>
            <div style={this.sectionHeaderStyle()}>Environment</div>
            <FormControl style={{display: 'flex', flexDirection: 'row'}}>
              <BoundedNumberInput label="Width (x)" value={this.state.EnvironmentWidth}
                                  minValue={50} maxValue={Number.MAX_SAFE_INTEGER}
                                  onUpdate={(e) => this.onChangeEnvironmentDimensions(
                                    e, this.state.EnvironmentDepth,
                                    this.state.EnvironmentNumRows, this.state.EnvironmentNumCols,
                                    this.state.EnvironmentStartX, this.state.EnvironmentStartZ)}
                                  numberType={'float'} sign={'positive'}></BoundedNumberInput>
              <div style={{width: '10px'}}></div>
              <BoundedNumberInput label="Depth (z)" value={this.state.EnvironmentDepth}
                                  minValue={50} maxValue={Number.MAX_SAFE_INTEGER}
                                  onUpdate={(e) => this.onChangeEnvironmentDimensions(
                                    this.state.EnvironmentWidth, e,
                                    this.state.EnvironmentNumRows, this.state.EnvironmentNumCols,
                                    this.state.EnvironmentStartX, this.state.EnvironmentStartZ)}
                                  numberType={'float'} sign={'positive'}></BoundedNumberInput>
            </FormControl>
            <FormControl style={{display: 'flex', flexDirection: 'row'}}>
              <BoundedNumberInput label="Rows" value={this.state.EnvironmentNumRows}
                                  minValue={5} maxValue={4096}
                                  onUpdate={(e) => this.onChangeEnvironmentDimensions(
                                    this.state.EnvironmentWidth, this.state.EnvironmentDepth,
                                    e, this.state.EnvironmentNumCols,
                                    this.state.EnvironmentStartX, this.state.EnvironmentStartZ)}
                                  numberType={'integer'} sign={'positive'}></BoundedNumberInput>
              <div style={{width: '10px'}}></div>
              <BoundedNumberInput label="Cols" value={this.state.EnvironmentNumCols}
                                  minValue={5} maxValue={4096}
                                  onUpdate={(e) => this.onChangeEnvironmentDimensions(
                                    this.state.EnvironmentWidth, this.state.EnvironmentDepth,
                                    this.state.EnvironmentNumRows, e,
                                    this.state.EnvironmentStartX, this.state.EnvironmentStartZ)}
                                  numberType={'integer'} sign={'positive'}></BoundedNumberInput>
            </FormControl>
            <FormControl style={{display: 'flex', flexDirection: 'row'}}>
              <BoundedNumberInput label="X Offset" value={this.state.EnvironmentStartX}
                                  minValue={Number.NEGATIVE_INFINITY} maxValue={Number.POSITIVE_INFINITY}
                                  onUpdate={(e) => this.onChangeEnvironmentDimensions(
                                    this.state.EnvironmentWidth, this.state.EnvironmentDepth,
                                    this.state.EnvironmentNumRows, this.state.EnvironmentNumCols,
                                    e, this.state.EnvironmentStartZ)}
                                  numberType={'float'} sign={'any'}></BoundedNumberInput>
              <div style={{width: '10px'}}></div>
              <BoundedNumberInput label="Z Offset" value={this.state.EnvironmentStartZ}
                                  minValue={Number.NEGATIVE_INFINITY} maxValue={Number.POSITIVE_INFINITY}
                                  onUpdate={(e) => this.onChangeEnvironmentDimensions(
                                    this.state.EnvironmentWidth, this.state.EnvironmentDepth,
                                    this.state.EnvironmentNumRows, this.state.EnvironmentNumCols,
                                    this.state.EnvironmentStartX, e)}
                                  numberType={'float'} sign={'any'}></BoundedNumberInput>
            </FormControl>
          </div>);
    }
  }

  render() {
    return (
      <div style={this.containerStyle()}>
        <canvas
          style={this.glCanvasStyle()}
          ref={c=>this.canvas_ = c} id="envEditorCanvas"
          tabIndex={0}
          onKeyDown={this.onKeyDown}
          onKeyUp={this.onKeyUp}
          onMouseDown={this.onMouseDown}
          onMouseMove={this.onMouseMove}
          onMouseUp={this.onMouseUp}
          onWheel={this.onMouseScroll}
        >Canvas not supported</canvas>
        <div style={this.settingsContainerStyle()}>
          {this.settingsMenu()}
        </div>
      </div>
    )
  }

  private onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    this.keyboardStateManater_.onKeyDown(e.key);
  };

  private onKeyUp = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    this.keyboardStateManater_.onKeyUp(e.key);
  };

  private onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Type safety: This should be impossible
    if (!this.canvas_) return;

    if (e.button === 0) {
      this.mouseStateManager_.onPrimaryButtonDown(
        e.clientX, e.clientY, this.canvas_.clientWidth, this.canvas_.clientHeight);
    }
  };

  private onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Type safety: This should be impossible
    if (!this.canvas_) return;

    this.mouseStateManager_.onMouseMove(
      e.clientX, e.clientY, this.canvas_.clientWidth, this.canvas_.clientHeight);
  };

  private onMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Type safety: This should be impossible
    if (!this.canvas_) return;

    if (e.button === 0) {
      this.mouseStateManager_.onPrimaryButtonUp(
        e.clientX, e.clientY, this.canvas_.clientWidth, this.canvas_.clientHeight);
    }
  };

  private onMouseScroll = (e: React.WheelEvent<HTMLCanvasElement>) => {
    // Type safety: This should be impossible
    if (!this.canvas_) return;

    this.mouseStateManager_.onMouseWheel(
      e.deltaY, e.clientX, e.clientY, this.canvas_.clientWidth, this.canvas_.clientHeight);
  };

  private containerStyle(): React.CSSProperties {
    return {
      display: 'flex',
      flexDirection: 'row',
      flexGrow: 1,
      height: '100%',
      width: '100%',
    };
  }

  private glCanvasStyle(): React.CSSProperties {
    return {
      flexGrow: 2,
      width: '100%',
      height: '100%',
      minWidth: 0,
    };
  }

  private settingsContainerStyle(): React.CSSProperties {
    return {
      borderLeft: '2px solid #cecece',
      backgroundColor: '#f1f1f1',
      height: '100%',
      margin: 0,
      padding: 0,
    };
  }

  private settingsContainerInnerStyle(): React.CSSProperties {
    return {
      width: '220px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
    };
  }

  private horizontalDividerStyle(): React.CSSProperties {
    return {
      height: 0,
      border: '0.5px solid black',
      marginTop: '8px',
    };
  }

  private sectionHeaderStyle(): React.CSSProperties {
    return {
      color: '#5e5e5e',
      fontSize: '18pt',
      padding: '8px',
      textAlign: 'center',
    };
  }

  private getApp(): EnvironmentEditorAppService {
    return assert('EnvironmentEditorAppService', this.app_);
  }

  private onChangeCameraType = (cameraType: string) => {
    switch (cameraType) {
      case 'free':
      case 'centered':
      case 'simulation':
        this.setState({...this.state, CameraType: cameraType});
        this.getApp().setCameraType(cameraType);
        return;
      default:
        console.error('Cannot set camera type to unknown value ' + cameraType);
    }
  }

  private onChangeArenaDimensions(width: number, height: number) {
    this.getApp().setArenaDimensions(width, height);
    this.setState({...this.state, ArenaWidth: width, ArenaHeight: height});
  }

  private onChangeEnvironmentDimensions(
      width: number, height: number,
      numRows: number, numCols: number,
      startX: number, startZ: number) {
    this.getApp().setEnvironmentDimensions(
      width, height, numRows, numCols,
      -3, vec4.fromValues(0.3, 0.3, 0.3, 1.0),
      startX, startZ);
    this.setState({
      ...this.state,
      EnvironmentWidth: width,
      EnvironmentDepth: height,
      EnvironmentNumRows: numRows,
      EnvironmentNumCols: numCols,
      EnvironmentStartX: startX,
      EnvironmentStartZ: startZ,
    });
  }
}
