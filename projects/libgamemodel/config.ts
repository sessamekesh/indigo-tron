export type ArenaConfigObject = {
  Width: number,
  Height: number,
};

export type EnvironmentConfigObject = {
  Width: number,
  Height: number,
  NumRows: number,
  NumCols: number,
  StartX: number,
  StartZ: number,
};

export type GameConfig = {
  Arena: ArenaConfigObject,
  Environment: EnvironmentConfigObject,
};

export class GameConfigUtil {
  static toJsonString(gameConfig: GameConfig): string {
    return JSON.stringify({
      'Arena':  {
        'Width': gameConfig.Arena.Width,
        'Height': gameConfig.Arena.Height,
      },
      'Environment': {
        'Width': gameConfig.Environment.Width,
        'Height': gameConfig.Environment.Height,
        'NumRows': gameConfig.Environment.NumRows,
        'NumCols': gameConfig.Environment.NumCols,
        'StartX': gameConfig.Environment.StartX,
        'StartZ': gameConfig.Environment.StartZ,
      },
    })
  }

  static parseJsonString(jsonString: string): GameConfig|null {
    let jsonObject: any;
    try {
      jsonObject = JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse JSON string, cannot parse game config');
      return null;
    }

    const Arena = GameConfigUtil.parseArenaConfig(jsonObject['Arena']);
    if (!Arena) return null;
    const Environment = GameConfigUtil.parseEnvironmentConfig(jsonObject['Environment']);
    if (!Environment) return null;

    return {
      Arena, Environment,
    };
  }

  private static parseArenaConfig(arenaObject: any): ArenaConfigObject|null {
    if (!arenaObject) return null;
    const Width = +arenaObject['Width'];
    const Height = +arenaObject['Height'];
    if (typeof Width !== 'number' || isNaN(Width)) {
      return null;
    }
    if (typeof Height !== 'number' || isNaN(Height)) {
      return null;
    }
    return {
      Width, Height,
    };
  }

  private static parseEnvironmentConfig(environmentConfig: any): EnvironmentConfigObject|null {
    if (!environmentConfig) return null;
    const Width = +environmentConfig['Width'];
    const Height = +environmentConfig['Height'];
    const StartX = +environmentConfig['StartX'];
    const StartZ = +environmentConfig['StartZ'];
    const NumRows = +environmentConfig['NumRows'];
    const NumCols = +environmentConfig['NumCols'];
    if (typeof Width !== 'number' || isNaN(Width)) {
      return null;
    }
    if (typeof Height !== 'number' || isNaN(Height)) {
      return null;
    }
    if (typeof StartX !== 'number' || isNaN(StartX)) {
      return null;
    }
    if (typeof StartZ !== 'number' || isNaN(StartZ)) {
      return null;
    }
    if (typeof NumRows !== 'number' || isNaN(NumRows)) {
      return null;
    }
    if (typeof NumCols !== 'number' || isNaN(NumCols)) {
      return null;
    }
    return {
      Width, Height, NumRows, NumCols, StartX, StartZ,
    };
  }
}
