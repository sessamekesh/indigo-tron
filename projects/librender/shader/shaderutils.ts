export class ShaderUtils {
  static createShaderFromSource(
      gl: WebGL2RenderingContext, programName: string, vsText: string, fsText: string): WebGLProgram|null {
    const vs = gl.createShader(gl.VERTEX_SHADER);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    const program = gl.createProgram();

    if (!vs || !fs || !program) {
      console.error(`Cannot create shader program ${programName} - could not create shader objects`)
      return null;
    }

    gl.shaderSource(vs, vsText);
    gl.shaderSource(fs, fsText);

    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.error(`Failed to compile vertex shader for ${programName}: ${gl.getShaderInfoLog(vs)}`);
    }

    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error(`Failed to compile fragment shader for ${programName}: ${gl.getShaderInfoLog(fs)}`);
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(`Failed to link shader program ${programName}: ${gl.getProgramInfoLog(program)}`);
    }

    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return program;
  }
}
