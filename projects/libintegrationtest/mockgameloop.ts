export interface MockGameLoop {
  tick(time: number): Promise<any>;
}

export class MockGameLoopWithoutRendering implements MockGameLoop {
  private accumulatedTime_ = 0;

  constructor(
    private timePerFrame: number,
    private timePerExecutionFrame: number,
    private executionFrameGapSize: number,
    private tickFn: (dt: number)=>any) {}

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
    private tickFn: (dt: number)=>any,
    private renderFn: ()=>any) {}

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
        this.renderFn();
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  }
}
