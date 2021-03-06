import { Texture } from './texture';
import { mat4 } from 'gl-matrix';

export type FramebufferState = {
  ColorAttachment: number,
  AttachedTexture: Texture,
  DepthEnabled: boolean,
};

type FramebufferExtras = {
  DepthTexture: Texture|null,
};

export class Framebuffer {
  constructor(
    public readonly fbo: WebGLFramebuffer,
    private state: FramebufferState,
    private extras: FramebufferExtras) {}

  private static getAttachmentPointGL(colorAttachment: number) {
    return WebGL2RenderingContext.COLOR_ATTACHMENT0 + colorAttachment;
  }

  static create(gl: WebGL2RenderingContext, state: FramebufferState): Framebuffer|null {
    const fbo = gl.createFramebuffer();
    if (!fbo) {
      console.error('Failed to create GL framebuffer object');
      return null;
    }

    let depthTexture: Texture|null = null;
    if (state.DepthEnabled) {
      depthTexture = Texture.createEmptyTexture(
        gl, state.AttachedTexture.Width, state.AttachedTexture.Height, 'depth24');
      // const depthRenderBuffer = gl.createRenderbuffer();
      if (!depthTexture) {
        console.error('Failed to create depth texture for framebuffer');
        return null;
      }
      // gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);
      // gl.renderbufferStorage(
      //   gl.RENDERBUFFER,
      //   gl.DEPTH_COMPONENT,
      //   state.AttachedTexture.Width,
      //   state.AttachedTexture.Height);
      // gl.framebufferRenderbuffer(
      //   gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);
      // gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      Framebuffer.getAttachmentPointGL(state.ColorAttachment),
      gl.TEXTURE_2D /* target */,
      state.AttachedTexture.tex,
      0 /* level */);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture && depthTexture.tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return new Framebuffer(
      fbo,
      state,
      { DepthTexture: depthTexture });
  }

  bind(gl: WebGL2RenderingContext) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, this.state.AttachedTexture.Width, this.state.AttachedTexture.Height);
  }
}
