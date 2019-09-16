export class TriangleGeo {
  private constructor(private vao: WebGLVertexArrayObject) {}

  static create(gl: WebGL2RenderingContext, posAttrib: number, colorAttrib: number): TriangleGeo|null {
    const posVB = gl.createBuffer();
    const colorVB = gl.createBuffer();
    const vbo = gl.createVertexArray();

    if (!posVB || !colorVB || !vbo) {
      console.error('Could not create WebGL objects, aborting');
      return null;
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

    return new TriangleGeo(vbo);
  }

  getVAO() {
    return this.vao;
  }
}
