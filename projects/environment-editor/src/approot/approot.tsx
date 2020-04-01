import * as React from 'react';
import { AppState, WallEditorAppState, AppMode } from '../logical/appstate';
import { WallEditorApp } from './walleditorapp';
import { EnvironmentEditorApp } from './environmenteditorapp';

interface AppRootProps {}

function createInitialAppState(): AppState {
  // return {
  //   mode: AppMode.WALL_EDITOR,
  //   ArenaDepth: 50,
  //   ArenaWallHeight: 10,
  //   ArenaWidth: 50,
  // };
  return {
    mode: AppMode.ENVIRONMENT_EDITOR,
  };
}

export class AppRoot extends React.Component<AppRootProps, AppState> {
  readonly state: AppState = createInitialAppState();

  constructor(props: AppRootProps) {
    super(props);
  }

  render() {
    switch (this.state.mode) {
      case AppMode.WALL_EDITOR:
        return <WallEditorApp initialState={this.state} />;
      case AppMode.ENVIRONMENT_EDITOR:
        return <EnvironmentEditorApp />
      default:
        return null;
    }
  }
}
