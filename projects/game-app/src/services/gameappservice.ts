import { mat4, glMatrix, vec3 } from 'gl-matrix';

// Order of teaching this one:
// - Introduce gl-matrix
// - Introduce ortho projection (show: it is the same, except now you can put Z-values anywhere)
// - Introduce camera (show: moving it in front of and behind triangles)
// - Change ortho to perspective (show: triangles show in wrong order, but you can see perspective)
// - Introduce clearing the depth layer and depth test
// - Show a couple different UP, POS, LOOK_AT values to demonstrate what each does
// - Introduce world transform
const VS_TEXT = `#version 300 es
precision mediump float;
uniform mat4 matPerspectiveProjection;
uniform mat4 matCamera;
uniform mat4 matWorld;
in vec3 pos;
in vec3 color;
out vec3 fColor;
void main() {
  fColor = color;
  gl_Position = matPerspectiveProjection * matCamera * matWorld * vec4(pos, 1.0);
}`;

const FS_TEXT = `#version 300 es
precision mediump float;
in vec3 fColor;
out vec4 color;
void main() {
  color = vec4(fColor, 1.0);
}`;

export class GameAppService {
  private clearColor_ = [0, 0, 1];
  private constructor(private gl: WebGL2RenderingContext) {}

  static async create(gl: WebGL2RenderingContext) {
    return new GameAppService(gl);
  }

  start() {
    let lastFrame = performance.now();
    const frame = () => {
      const now = performance.now();
      const millisecondsElapsed = now - lastFrame;
      lastFrame = now;

      this.drawFrame(millisecondsElapsed);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  drawFrame(millisecondsElapsed: number) {
    const gl = this.gl;

    gl.canvas.width = gl.canvas.clientWidth * window.devicePixelRatio;
    gl.canvas.height = gl.canvas.clientHeight * window.devicePixelRatio;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(this.clearColor_[0], this.clearColor_[1], this.clearColor_[2], 1);
    // REMEMBER: Demonstrate this _after_ switching to perspective projection
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    const shader = this.getTriangleShader();
    const triangleVBO = this.getTriangleVBO();

    gl.useProgram(shader);
    gl.bindVertexArray(triangleVBO);

    const perspectiveUniform = this.getPerspectiveProjectionMatrixUniform();
    const perspectiveProjectionValue = this.getPerspectiveProjectionMatrixValue();
    gl.uniformMatrix4fv(perspectiveUniform, false, perspectiveProjectionValue);

    const cameraUniform = this.getCameraMatrixUniform();
    const cameraValue = this.getCameraMatrixValue();
    gl.uniformMatrix4fv(cameraUniform, false, cameraValue);

    const worldUniform = this.getWorldMatrixUniform();
    this.getTriangleOffsetValue(millisecondsElapsed);
    const worldValue = this.getWorldMatrixValue(millisecondsElapsed);
    gl.uniformMatrix4fv(worldUniform, false, worldValue);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  changeClearColor() {
    this.clearColor_[0] = 1 - this.clearColor_[0];
    this.clearColor_[2] = 1 - this.clearColor_[2];
  }

  private triangleShader_: WebGLProgram|null = null;
  private getTriangleShader(): WebGLProgram {
    if (!this.triangleShader_) {
      const gl = this.gl;
      const vs = gl.createShader(gl.VERTEX_SHADER);
      const fs = gl.createShader(gl.FRAGMENT_SHADER);
      const program = gl.createProgram();

      if (!vs || !fs || !program) {
        throw new Error('Cannot create shader program - could not create shader objects');
      }

      gl.shaderSource(vs, VS_TEXT);
      gl.shaderSource(fs, FS_TEXT);

      gl.compileShader(vs);
      if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        throw new Error(`Failed to compile vertex shader: ${gl.getShaderInfoLog(vs)}`);
      }

      gl.compileShader(fs);
      if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        throw new Error(`Failed to compile fragment shader: ${gl.getShaderInfoLog(fs)}`);
      }

      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`Failed to link shader program: ${gl.getProgramInfoLog(program)}`);
      }

      gl.deleteShader(vs);
      gl.deleteShader(fs);
      this.triangleShader_ = program;
    }

    return this.triangleShader_;
  }

  private posAttrib_: number = -1;
  private getPosAttrib() {
    if (this.posAttrib_ < 0) {
      const shader = this.getTriangleShader();
      this.posAttrib_ = this.gl.getAttribLocation(shader, 'pos');
    }
    return this.posAttrib_;
  }

  private colorAttrib_: number = -1;
  private getColorAttrib() {
    if (this.colorAttrib_ < 0) {
      const shader = this.getTriangleShader();
      this.colorAttrib_ = this.gl.getAttribLocation(shader, 'color');
    }
    return this.colorAttrib_;
  }

  private triangleVbo_: WebGLVertexArrayObject|null = null;
  private getTriangleVBO(): WebGLVertexArrayObject {
    if (!this.triangleVbo_) {
      const gl = this.gl;
      const posVB = gl.createBuffer();
      const colorVB = gl.createBuffer();
      const vbo = gl.createVertexArray();

      const posAttrib = this.getPosAttrib();
      const colorAttrib = this.getColorAttrib();

      if (!posVB || !vbo || !colorVB) {
        throw new Error('Failed to create WebGL objects for triangle');
      }

      const posData = new Float32Array([
        0, 0.5, 0,
        -0.5, -0.5, 0,
        0.5, -0.5, 0,

        0, 0.75, 1,
        -0.25, 0.51, 1,
        0.25, 0.51, 1,
      ]);
      gl.bindBuffer(gl.ARRAY_BUFFER, posVB);
      gl.bufferData(gl.ARRAY_BUFFER, posData, gl.STATIC_DRAW);

      const colorData = new Float32Array([
        1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 0.0, 1.0,

        1.0, 0.2, 0.2,
        0.2, 1.0, 0.2,
        0.2, 0.2, 1.0,
      ]);
      gl.bindBuffer(gl.ARRAY_BUFFER, colorVB);
      gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);

      gl.bindVertexArray(vbo);
      gl.enableVertexAttribArray(posAttrib);
      gl.bindBuffer(gl.ARRAY_BUFFER, posVB);
      gl.vertexAttribPointer(posAttrib, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(colorAttrib);
      gl.bindBuffer(gl.ARRAY_BUFFER, colorVB);
      gl.vertexAttribPointer(colorAttrib, 3, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);
      this.triangleVbo_ = vbo;
    }
    return this.triangleVbo_;
  }

  private triangleOffsetUniform_: WebGLUniformLocation|null = null;
  private getTriangleOffsetUniform(): WebGLUniformLocation {
    if (!this.triangleOffsetUniform_) {
      const gl = this.gl;
      const shader = this.getTriangleShader();
      const uniform = gl.getUniformLocation(shader, 'offset');
      if (!uniform) {
        throw new Error('Could not find offset uniform for triangle shader');
      }
      this.triangleOffsetUniform_ = uniform;
    }
    return this.triangleOffsetUniform_;
  }

  private triangleOffset_ = [0.3, 0];
  private goalTriangleOffset_ = [0.3, 0];
  private velocity_ = 0.35;
  private getTriangleOffsetValue(millisecondsElapsed: number) {
    if (this.triangleOffset_[0] !== this.goalTriangleOffset_[0]) {
      const dist = this.goalTriangleOffset_[0] - this.triangleOffset_[0];
      const max = this.velocity_ * millisecondsElapsed/1000;
      if (Math.abs(dist) <= max) {
        this.triangleOffset_[0] = this.goalTriangleOffset_[0];
      } else {
        this.triangleOffset_[0] += dist * (max / Math.abs(dist));
      }
    }

    if (this.triangleOffset_[1] !== this.goalTriangleOffset_[1]) {
      const dist = this.goalTriangleOffset_[1] - this.triangleOffset_[1];
      const max = this.velocity_ * millisecondsElapsed/1000;
      if (Math.abs(dist) <= max) {
        this.triangleOffset_[1] = this.goalTriangleOffset_[1];
      } else {
        this.triangleOffset_[1] += dist * (max / Math.abs(dist));
      }
    }

    if (this.triangleOffset_[2] !== this.goalTriangleOffset_[2]) {
      const dist = this.goalTriangleOffset_[2] - this.triangleOffset_[2];
      const max = this.velocity_ * millisecondsElapsed;
      if (Math.abs(dist) <= max) {
        this.triangleOffset_[2] = this.goalTriangleOffset_[2];
      } else {
        this.triangleOffset_[2] += dist * (max / Math.abs(dist));
      }
    }
    return this.triangleOffset_;
  }

  private perspectiveProjectionMatrixUniform_: WebGLUniformLocation|null = null;
  private perspectiveProjectionMatrixValue_ = mat4.create();
  private getPerspectiveProjectionMatrixUniform(): WebGLUniformLocation {
    if (!this.perspectiveProjectionMatrixUniform_) {
      const shader = this.getTriangleShader();
      const gl = this.gl;
      const uniform = gl.getUniformLocation(shader, 'matPerspectiveProjection');
      if (!uniform) {
        throw new Error('Cannot get uniform for perspective projection');
      }
      this.perspectiveProjectionMatrixUniform_ = uniform;
    }

    return this.perspectiveProjectionMatrixUniform_;
  }

  private getPerspectiveProjectionMatrixValue(): mat4 {
    // Teaching note: Use this first (to demonstrate an ortho projection identical to using no projection at all)
    // Then, teach cameras, and THEN implement perspective
    // mat4.ortho(
    //   this.perspectiveProjectionMatrixValue_,
    //   -1, 1,
    //   -1, 1,
    //   -1, 1);
    mat4.perspective(
      this.perspectiveProjectionMatrixValue_,
      glMatrix.toRadian(45),
      this.gl.canvas.width / this.gl.canvas.height,
      0.01, 100.0);
    return this.perspectiveProjectionMatrixValue_;
  }

  private cameraMatrixUniform_: WebGLUniformLocation|null = null;
  private cameraMatrixValue_ = mat4.create();
  private getCameraMatrixUniform(): WebGLUniformLocation {
    if (!this.cameraMatrixUniform_) {
      const shader = this.getTriangleShader();
      const gl = this.gl;
      const uniform = gl.getUniformLocation(shader, 'matCamera');
      if (!uniform) {
        throw new Error('Cannot get uniform for camera transformation');
      }
      this.cameraMatrixUniform_ = uniform;
    }

    return this.cameraMatrixUniform_;
  }

  private getCameraMatrixValue(): mat4 {
    mat4.lookAt(
      this.cameraMatrixValue_,
      vec3.fromValues(2, 0, -2.5),
      vec3.fromValues(0, 0, 0),
      vec3.fromValues(0, 1, 0));
    return this.cameraMatrixValue_;
  }

  moveTriangles() {
    this.goalTriangleOffset_[0] *= -1;
  }

  private worldMatrixUniform_: WebGLUniformLocation|null = null;
  private worldMatrixValue_ = mat4.create();
  private getWorldMatrixUniform(): WebGLUniformLocation {
    if (!this.worldMatrixUniform_) {
      const shader = this.getTriangleShader();
      const gl = this.gl;
      const uniform = gl.getUniformLocation(shader, 'matWorld');
      if (!uniform) {
        throw new Error('Cannot get uniform for world transformation');
      }
      this.worldMatrixUniform_ = uniform;
    }

    return this.worldMatrixUniform_;
  }

  private zOffsetTicks = 0;
  private getWorldMatrixValue(millisecondsElapsed): mat4 {
    this.zOffsetTicks += millisecondsElapsed * 0.001;
    mat4.fromTranslation(this.worldMatrixValue_, vec3.fromValues(this.triangleOffset_[0], this.triangleOffset_[1], Math.sin(this.zOffsetTicks)));
    return this.worldMatrixValue_;
  }
}
