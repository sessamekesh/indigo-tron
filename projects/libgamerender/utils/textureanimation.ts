import { Texture } from '@librender/texture/texture';

interface TextureAnimationKeyframe {
  Texture: Texture;
  DisplayTime: number;
};

interface InternalAnimationKeyframe {
  Texture: Texture,
  StartTime: number,
  EndTime: number,
};

export class TextureAnimation {
  private readonly keyframes_: InternalAnimationKeyframe[];

  constructor(keyframes: TextureAnimationKeyframe[]) {
    let startTime = 0;
    const internalKeyframes: InternalAnimationKeyframe[] = [];
    for (let i = 0; i < keyframes.length; i++) {
      internalKeyframes.push({
        StartTime: startTime,
        EndTime: startTime + keyframes[i].DisplayTime,
        Texture: keyframes[i].Texture,
      });
      startTime += keyframes[i].DisplayTime;
    }

    this.keyframes_ = internalKeyframes;
  }

  textureAt(t: number, loop: boolean): Texture {
    // This could be a binary search instead, for a speed boost. I don't think that will ever
    // be necessary - n<20 in all cases I can think of as I write this.
    if (loop) {
      t = t % this.keyframes_[this.keyframes_.length - 1].EndTime;
    }

    for (let i = 0; i < this.keyframes_.length; i++) {
      if (this.keyframes_[i].StartTime <= i && this.keyframes_[i].EndTime >= i) {
        return this.keyframes_[i].Texture;
      }
    }

    return (t < 0)
      ? this.keyframes_[0].Texture
      : this.keyframes_[this.keyframes_.length - 1].Texture;
  }

  totalTime(): number {
    return this.keyframes_[this.keyframes_.length - 1].EndTime;
  }
}
