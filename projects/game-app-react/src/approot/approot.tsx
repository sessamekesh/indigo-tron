import * as React from 'react';
import './approot.scss';

import { GameAppService2 } from 'src/services/gameappservice2';
import { CachingEventManager } from '@libutil/cachingeventmanager';
import { GameAppUIEvents } from '../services/gameappuieventmanager';
import { HUD } from '../hud/hud';

interface State {
  isLoaded: boolean,
  showDeathMessage: boolean,
  isPaused: boolean,
}
interface Props {}

export class AppRoot extends React.Component<Props, State> {
  readonly state: State = {
    isLoaded: false,
    showDeathMessage: false,
    isPaused: false,
  };

  private canvas_: HTMLCanvasElement|null = null;
  private gameService: GameAppService2|null = null;
  private gameAppUiEventManager = new CachingEventManager<GameAppUIEvents>();

  private onDestroy: (()=>void)[] = [];

  async componentDidMount() {
    if (!this.canvas_) {
      throw new Error('Failed to get canvas reference');
    }

    const gl = this.canvas_.getContext('webgl2');
    if (!gl) {
      throw new Error('Failed to get WebGL2 context');
    }

    this.gameService = await GameAppService2.create(gl, this.gameAppUiEventManager);

    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('loading-finished');
      setTimeout(() => loadingScreen.remove(), 550);
    }

    this.setState({...this.state, isLoaded: true});

    const deathListener = this.gameAppUiEventManager.addListener('player-death', (isDead) => {
      this.setState({...this.state, showDeathMessage: isDead});
    });
    this.onDestroy.push(
      () => this.gameAppUiEventManager.removeListener('player-death', deathListener));

    const pausedListener = this.gameAppUiEventManager.addListener('apppaused', (paused) => {
      this.setState({...this.state, isPaused: paused});
    });
    this.onDestroy.push(
      () => this.gameAppUiEventManager.removeListener('player-death', deathListener));

    this.gameService.start();
  }

  componentWillUnmount() {
    this.onDestroy.forEach(e=>e());
  }

  render() {
    let viewContainerClassName = 'view-container';
    if (!this.state.isLoaded) viewContainerClassName += ' hidden';

    let pauseIconClassName = 'pause-icon';
    if (this.state.isPaused) pauseIconClassName += ' paused';

    return <div className={viewContainerClassName}>
      {this.maybeDeathMessage()}
      <canvas id="game-canvas" ref={(e)=>{this.canvas_ = e}}>
        HTML5 Canvas is not available. Please get a better browser.
      </canvas>
      <div className={pauseIconClassName} onClick={this.onPause}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g className="" transform="translate(0,0)" style={{touchAction: 'none'}}><path d="M120.16 45A20.162 20.162 0 0 0 100 65.16v381.68A20.162 20.162 0 0 0 120.16 467h65.68A20.162 20.162 0 0 0 206 446.84V65.16A20.162 20.162 0 0 0 185.84 45h-65.68zm206 0A20.162 20.162 0 0 0 306 65.16v381.68A20.162 20.162 0 0 0 326.16 467h65.68A20.162 20.162 0 0 0 412 446.84V65.16A20.162 20.162 0 0 0 391.84 45h-65.68z"></path></g></svg>
      </div>
      <div className={'hud'}>
        <HUD uiEventManager={this.gameAppUiEventManager!}></HUD>
      </div>
    </div>;
  }

  maybeDeathMessage() {
    if (this.state.showDeathMessage) {
      return <div className='death-message-container'>
        <p>Oh dear, you are dead!</p>
        <div className='restart-button' onClick={this.onRestartGame}>Restart Game</div>
      </div>;
    }

    return null;
  }

  private onPause = () => {
    this.gameService?.pause();
  };

  private onRestartGame = () => {
    this.gameService?.restart();
  };
}