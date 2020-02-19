export interface CoreAppState {
  ArenaWidth: number,
  ArenaDepth: number,
  ArenaWallHeight: number,
}

export enum AppMode {
  WALL_EDITOR,
}

export interface WallEditorAppState extends CoreAppState {
  mode: AppMode.WALL_EDITOR,
}

export type AppState = WallEditorAppState;
