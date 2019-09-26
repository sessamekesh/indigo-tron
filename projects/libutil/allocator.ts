export class TempGroupAllocator<T extends Object> {
  private buffer_: T[] = [];
  private nextIdx_ = 0;

  constructor(private genFn: ()=>T) {}

  get<R>(ct: 1, cb: (_1: T)=>R): R;
  get<R>(ct: 2, cb: (_1: T, _2: T)=>R): R;
  get<R>(ct: 3, cb: (_1: T, _2: T, _3: T)=>R): R;
  get<R>(ct: 4, cb: (_1: T, _2: T, _3: T, _4: T)=>R): R;
  get<R>(ct: 5, cb: (_1: T, _2: T, _3: T, _4: T, _5: T)=>R): R;
  get<R>(ct: 6, cb: (_1: T, _2: T, _3: T, _4: T, _5: T, _6: T)=>R): R;
  get<R>(ct: number, cb: (...vals: T[])=>R): R {
    const allocation: T[] = [];
    for (let i = 0; i < ct; i++) {
      allocation.push(this.getOrAllocateNext());
    }
    try {
      return cb(...allocation);
    } finally {
      this.release(ct);
    }
  }

  private getOrAllocateNext() {
    while (this.buffer_.length <= this.nextIdx_) {
      this.buffer_.push(this.genFn());
    }
    return this.buffer_[this.nextIdx_++];
  }

  private release(ct: number) {
    this.nextIdx_ -= ct;
  }

  clear(size: number = 4) {
    this.nextIdx_ = size;
    this.buffer_ = this.buffer_.slice(0, size);
  }
}
