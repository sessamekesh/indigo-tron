export interface MockGameLoop {
  tick(time: number): Promise<any>;
}

export type MockTickFn = (dt: number) => any;
export type MockRenderFn = (gl: WebGL2RenderingContext) => any;

export class MockGameLoopWithoutRendering implements MockGameLoop {
  private accumulatedTime_ = 0;

  constructor(
    private timePerFrame: number,
    private timePerExecutionFrame: number,
    private executionFrameGapSize: number,
    private tickFn: MockTickFn) {}

  async tick(time: number) {
    this.accumulatedTime_ += time;
    let frameEnd = performance.now() + this.timePerExecutionFrame;
    while (this.accumulatedTime_ > this.timePerFrame) {
      this.tickFn(this.timePerFrame);
      this.accumulatedTime_ -= this.timePerFrame;

      if (performance.now() > frameEnd) {
        await this.wait();
        frameEnd = performance.now() + this.timePerExecutionFrame;
      }
    }
  }

  private async wait() {
    await new Promise(resolve => setTimeout(resolve, this.executionFrameGapSize));
  }
}

export class MockGameLoopWithRendering implements MockGameLoop {
  private accumulatedTime_ = 0;

  constructor(
    private framesPerRender: number,
    private timePerFrame: number,
    private gl: WebGL2RenderingContext,
    private tickFn: MockTickFn,
    private renderFn: MockRenderFn) {}

  async tick(time: number) {
    this.accumulatedTime_ += time;
    await new Promise(resolve => {
      const frame = () => {
        for (let i = 0; i < this.framesPerRender; i++) {
          if (this.accumulatedTime_ <= this.timePerFrame) {
            resolve();
            return;
          }
          this.tickFn(this.timePerFrame);
          this.accumulatedTime_ -= this.timePerFrame;
        }
        this.renderFn(this.gl);
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  }
}
