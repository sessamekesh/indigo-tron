import * as React from 'react';
import { AppState, WallEditorAppState, AppMode } from '../logical/appstate';
import { WallEditorApp } from './walleditorapp';

interface AppRootProps {}

function createInitialAppState(): WallEditorAppState {
  return {
    mode: AppMode.WALL_EDITOR,
    ArenaDepth: 50,
    ArenaWallHeight: 10,
    ArenaWidth: 50,
  };
}

export class AppRoot extends React.Component<AppRootProps, AppState> {
  readonly state: AppState = createInitialAppState();

  constructor(props: AppRootProps) {
    super(props);
  }

  render() {
    const { mode } = this.state;

    switch (mode) {
      case AppMode.WALL_EDITOR:
        return <WallEditorApp initialState={this.state} />;
      default:
        return null;
    }
  }
}
