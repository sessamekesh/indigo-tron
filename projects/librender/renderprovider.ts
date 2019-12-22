export class Provider<T> {
  private val_: T|null|undefined = undefined;
  constructor(private genFn: () => T) {}

  get() {
    if (!this.val_) {
      this.val_ = this.genFn();
    }
    return this.val_;
  }
}

export class RenderProvider<T> {
  private val_: T|null|undefined = undefined;
  constructor(private genFn: (gl: WebGL2RenderingContext)=>(T|null)) {}

  get(gl: WebGL2RenderingContext): T|null {
    if (this.val_ === undefined) {
      this.val_ = this.genFn(gl);
    }
    return this.val_;
  }

  getOrThrow(gl: WebGL2RenderingContext): T {
    const toReturn = this.get(gl);
    if (!toReturn) {
      throw new Error('Value missing for render provider');
    }
    return toReturn;
  }
}

export class AsyncRenderProvider<T> {
  private val_: T|null|undefined = undefined;
  private alreadyLoading_: Promise<T|null>|undefined = undefined;
  constructor(private genFn: (gl: WebGL2RenderingContext)=>Promise<T|null>) {}

  private async gen(gl: WebGL2RenderingContext): Promise<T|null> {
    if (!this.alreadyLoading_) {
      this.alreadyLoading_ = this.genFn(gl);
      this.alreadyLoading_.finally(() => this.alreadyLoading_ = undefined);
    }
    return this.alreadyLoading_;
  }

  async get(gl: WebGL2RenderingContext): Promise<T|null> {
    if (this.val_ === undefined) {
      this.val_ = await this.gen(gl);
    }
    return this.val_;
  }

  async getOrThrow(gl: WebGL2RenderingContext): Promise<T> {
    const val = await this.get(gl);
    if (!val) {
      throw new Error('Value missing for async render provider');
    }
    return val;
  }

  getSync(): T|null {
    return this.val_ || null;
  }

  getSyncOrThrow(): T {
    if (!this.val_) {
      throw new Error('Value missing for async render provider (sync)');
    }
    return this.val_;
  }
}
