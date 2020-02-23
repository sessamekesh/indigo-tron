import * as React from 'react';
import { WallEditorAppState } from "../logical/appstate";
import { WallEditorAppService } from '../logical/walleditorappservice';
import { timingSafeEqual } from 'crypto';

interface WallEditorProps {
  initialState: WallEditorAppState
}

interface AppState {}

export class WallEditorApp extends React.Component<WallEditorProps, AppState> {
  private canvas_: HTMLCanvasElement|null = null;

  async componentDidMount() {
    if (!this.canvas_) {
      throw new Error('Failed to get canvas reference');
    }

    const gl = this.canvas_.getContext('webgl2');
    if (!gl) {
      throw new Error('Failed to get WebGL2 context');
    }

    const app = await WallEditorAppService.create(gl);
    await app.start();
  }

  render() {
    return (
      <div style={this.containerStyle()}>
        <div style={this.leftPanelStyle()}>
          <canvas
              style={this.glCanvasStyle()}
              ref={(c) => this.canvas_ = c}
              id="editorCanvas">Canvas not supported</canvas>
          <div style={this.playbackControlsOuterStyle()}>
            <div style={this.playbackControlsInnerStyle()}>
              Playback Controls Here
            </div>
          </div>
        </div>
        <div style={this.settingsBarOuterStyle()}>
          <div style={this.settingsBarInnerStyle()}>
            Settings Bar Here
          </div>
        </div>
      </div>
    );
  }

  private containerStyle(): React.CSSProperties {
    return {
      display: 'flex',
      flexDirection: 'row',
      flexGrow: 1,
      height: '100%',
    };
  }

  private leftPanelStyle(): React.CSSProperties {
    return {
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 2,
      alignItems: 'stretch',
    };
  }

  private settingsBarOuterStyle(): React.CSSProperties {
    return {
      borderLeft: '2px solid #cecece',
      backgroundColor: '#f1f1f1',
      height: '100%',
      margin: 0,
      padding: 0,
    };
  }

  private settingsBarInnerStyle(): React.CSSProperties {
    return {
      padding: '20px',
    };
  }

  private glCanvasStyle(): React.CSSProperties {
    return {
      flexGrow: 2,
      width: '100%',
      height: '100%',
    };
  }

  private playbackControlsOuterStyle(): React.CSSProperties {
    return {
      borderTop: '2px solid #aaaaaa',
      backgroundColor: '#d9d9d9',
      margin: 0,
      padding: 0,
    };
  }

  private playbackControlsInnerStyle(): React.CSSProperties {
    return {
      padding: '20px',
    };
  }
}
