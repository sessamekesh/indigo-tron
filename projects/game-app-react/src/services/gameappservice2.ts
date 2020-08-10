import { IEventManager } from '@libutil/eventmanager';
import { GameAppUIEvents } from './gameappuieventmanager';
import { GameAppRenderProviders2 } from './gameapprenderproviders2';
import { SceneBase } from './scenes/scenebase';
import { MenuScene } from './scenes/menu.scene';
import { MouseStateManager } from '@io/mousestatemanager';

export class GameAppService2 {
  private constructor(private activeScene: SceneBase) {}

  static async create(
      gl: WebGL2RenderingContext,
      gameAppUiEventManager: IEventManager<GameAppUIEvents>,
      mouseStateManager: MouseStateManager) {

    const scene =
      //await MainGameScene.createFresh(gl, new GameAppRenderProviders2(), gameAppUiEventManager);
      await MenuScene.createMenu(
        gl, new GameAppRenderProviders2(), gameAppUiEventManager, mouseStateManager);

    const gameAppService = new GameAppService2(scene);
    gameAppService.listenForNewScene();

    // Bootstrap GL resources for initial play before finishing "create"
    return gameAppService;
  }

  async start() {
    this.activeScene.start();
    this.beginRendering();
  }

  private listenForNewScene() {
    const scene = this.activeScene;
    const listener = scene.addListener('switch-scene', (newScene) => {
      scene.removeListener('switch-scene', listener);
      this.activeScene = newScene;
      this.listenForNewScene();
    });
  }

  private beginRendering() {
    let lastFrame = performance.now();
    const frame = () => {
      const now = performance.now();
      const msDt = now - lastFrame;
      lastFrame = now;

      // For debugging: Skip absurdly long frames
      if (msDt < 600) {
        this.activeScene.update(msDt);
      }

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
}
