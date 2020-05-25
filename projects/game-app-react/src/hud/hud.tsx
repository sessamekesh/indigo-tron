import * as React from 'react';
import './hud.scss';

import { GameAppUIEvents } from '../services/gameappuieventmanager';
import { CachingEventManager } from '@libutil/cachingeventmanager';

interface Props {
  uiEventManager: CachingEventManager<GameAppUIEvents>,
}

interface State {}

export class HUD extends React.Component<Props, State> {
  readonly state: State = {};

  private redHealthBar: HTMLDivElement|null = null;
  private greenHealthBar: HTMLDivElement|null = null;
  private healthBarText: HTMLDivElement|null = null;

  private onDestroy: (()=>void)[] = [];

  componentDidMount() {
    if (!this.redHealthBar || !this.greenHealthBar || !this.healthBarText) {
      throw new Error('Could not get all UI elements for the HUD');
    }

    const playerHealthListener = this.props.uiEventManager.addListener('playerhealth', (health) => {
      if (!this.healthBarText || !this.redHealthBar || !this.greenHealthBar) return;
      this.healthBarText.innerText = `${Math.round(health.CurrentHealth)} / ${health.MaxHealth}`;

      const healthAmt = health.CurrentHealth / health.MaxHealth;
      const width = Math.round(healthAmt * 500);

      this.redHealthBar.style.width = `${width}px`;
      this.greenHealthBar.style.width = `${width}px`;
    });
    this.onDestroy.push(
      ()=>this.props.uiEventManager.removeListener('playerhealth', playerHealthListener));
  }

  componentWillUnmount() {
    this.onDestroy.forEach(e=>e());
  }

  render() {
    return <div className="hud-outer">
      <div className="row">
        Bike Health:
        <div className="health-bar">
          <div className="health-bar-red" ref={(r)=>this.redHealthBar=r} />
          <div className="health-bar-green" ref={(r)=>this.greenHealthBar=r} />
          <div className="health-bar-text" ref={(r)=>this.healthBarText=r} />
        </div>
      </div>
    </div>
  }
}
