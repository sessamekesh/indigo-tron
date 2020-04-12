import { vec4, vec3 } from "gl-matrix";

/**
 * The ground for a scene, defined as a tiled heightmap. The ground is defined as an MxN grid of
 *  points, separated in intervals of (X, Z) world units along the X and Z axis. Each individual
 *  point has (1) a Y coordinate (height), as well as any render properties that are needed.
 */

export class GroundTileHeightMap<VertexPropType, TilePropType> {
  private constructor(
    public readonly numRows: number,
    public readonly numCols: number,
    public readonly xGridSize: number,
    public readonly zGridSize: number,
    private pointHeights: Float32Array,
    private vertexProps: VertexPropType[],
    private tileProps: TilePropType[]) {}

  static create<VertexPropType, TilePropType>(
      numRows: number,
      numCols: number,
      xGridSize: number,
      zGridSize: number,
      pointHeights: Float32Array,
      vertexProps: VertexPropType[],
      tileProps: TilePropType[]): GroundTileHeightMap<VertexPropType, TilePropType>|null {
    if (pointHeights.length < (numRows * numCols)) {
      return null;
    }
    if (vertexProps.length < (numRows * numCols)) {
      return null;
    }
    if (tileProps.length < ((numRows - 1) * (numCols - 1))) {
      return null;
    }
    if (numRows <= 1 || numCols <= 1) {
      return null;
    }
    return new GroundTileHeightMap(
      numRows, numCols, xGridSize, zGridSize, pointHeights, vertexProps, tileProps);
  }

  static generateFlat<VertexPropType, TilePropType>(
      numRows: number,
      numCols: number,
      xGridSize: number,
      zGridSize: number,
      yPosition: number,
      defaultRenderProp: ()=>VertexPropType,
      defaultTileProp: ()=>TilePropType) {
    let pointHeights = new Float32Array(numRows * numCols);
    let vertexProps = new Array<VertexPropType>(numRows * numCols);
    let tileProps = new Array<TilePropType>((numRows - 1) * (numCols - 1));
    for (let i = 0; i < numRows * numCols; i++) {
      pointHeights[i] = yPosition;
      vertexProps[i] = defaultRenderProp();
    }
    for (let i = 0; i < ((numRows - 1) * (numCols - 1)); i++) {
      tileProps[i] = defaultTileProp();
    }
    return GroundTileHeightMap.create(
      numRows, numCols, xGridSize, zGridSize, pointHeights, vertexProps, tileProps);
  }

  /**
   * Because surface normals are tricky, there has to be a unique vertex for each corner of each
   *  triangle. A potential space optimization would be to only store 4 vertices for a flat square
   *  instead of the full six, since they will be sharing all render properties of the 2 shared
   *  corner vertices.
   * Each tile will have two triangles forming a quad, and there are 2(numRows-1)(numCols-1)
   *  tiles. For an example with 4 cols and 3 rows:
   * 0--1--2--3
   * |\ |\ |\ |
   * | \| \| \|
   * 4--5--6--7
   * |\ |\ |\ |
   * | \| \| \|
   * 8--9--A--B
   * The positions would be laid out as such:
   * 0-5-1,  0-4-5,
   * 1-6-2,  1-5-6,
   * 2-7-3,  2-6-7,
   * 4-9-5,  4-8-9,
   * ...
   * Each tile has a total of 6 vertices, with 3 values in each, for a total of 18 buffer elements.
   */
  getPositionBuffer(): Float32Array {
    const numTriangles = (this.numRows - 1) * (this.numCols - 1) * 2;
    const numVertices = numTriangles * 3;
    const tr = new Float32Array(numVertices * 3);
    const width = this.xGridSize * this.numCols;
    const depth = this.zGridSize * this.numRows;
    const startX = -width / 2;
    const startZ = -depth / 2;
    for (let tileStartRow = 0; tileStartRow < this.numRows - 1; tileStartRow++) {
      for (let tileStartCol = 0; tileStartCol < this.numCols - 1; tileStartCol++) {
        const xUL = startX + tileStartCol * this.xGridSize;
        const xLL = xUL + this.xGridSize;
        const [xUR, xLR] = [xUL, xLL];
        const zUL = startZ + tileStartRow * this.zGridSize;
        const zUR = zUL + this.zGridSize;
        const [zLL, zLR] = [zUL, zUR];

        const yUL = this.pointHeights[tileStartRow * this.numCols + tileStartCol];
        const yUR = this.pointHeights[tileStartRow * this.numCols + tileStartCol + 1];
        const yLL = this.pointHeights[(tileStartRow + 1) * this.numCols + tileStartCol];
        const yLR = this.pointHeights[(tileStartRow + 1) * this.numCols + tileStartCol + 1];

        const idxStart = ((tileStartRow) * (this.numCols - 1) + tileStartCol) * 18;
        // Triangle 1 (UL, UR, LR)
        tr[idxStart] = xUL;
        tr[idxStart + 1] = yUL;
        tr[idxStart + 2] = zUL;
        tr[idxStart + 3] = xUR;
        tr[idxStart + 4] = yUR;
        tr[idxStart + 5] = zUR;
        tr[idxStart + 6] = xLR;
        tr[idxStart + 7] = yLR;
        tr[idxStart + 8] = zLR;
        // Triangle 2 (UL, LL, LR)
        tr[idxStart + 9] = xUL;
        tr[idxStart + 10] = yUL;
        tr[idxStart + 11] = zUL;
        tr[idxStart + 12] = xLL;
        tr[idxStart + 13] = yLL;
        tr[idxStart + 14] = zLL;
        tr[idxStart + 15] = xLR;
        tr[idxStart + 16] = yLR;
        tr[idxStart + 17] = zLR;
      }
    }
    return tr;
  }

  /**
   * The tile positions are evaluated as above, but the normal is taken as the (normalized) cross
   *  product of the vertices
   */
  getNormalBuffer(): Float32Array {
    const numTriangles = (this.numRows - 1) * (this.numCols - 1) * 2;
    const numVertices = numTriangles * 3;
    const tr = new Float32Array(numVertices * 3);
    const width = this.xGridSize * this.numCols;
    const depth = this.zGridSize * this.numRows;
    const startX = -width / 2;
    const startZ = -depth / 2;
    // OK to allocate vecs since this is initialization-time operation (do not do per-frame)
    const v1 = vec3.create();
    const v2 = vec3.create();
    const v3 = vec3.create();
    const e1 = vec3.create();
    const e2 = vec3.create();
    const ecross = vec3.create();
    const norm = vec3.create();
    for (let tileStartRow = 0; tileStartRow < this.numRows - 1; tileStartRow++) {
      for (let tileStartCol = 0; tileStartCol < this.numCols - 1; tileStartCol++) {
        const xUL = startX + tileStartCol * this.xGridSize;
        const xLL = xUL + this.xGridSize;
        const [xUR, xLR] = [xUL, xLL];
        const zUL = startZ + tileStartRow * this.zGridSize;
        const zUR = zUL + this.zGridSize;
        const [zLL, zLR] = [zUL, zUR];

        const yUL = this.pointHeights[tileStartRow * this.numCols + tileStartCol];
        const yUR = this.pointHeights[tileStartRow * this.numCols + tileStartCol + 1];
        const yLL = this.pointHeights[(tileStartRow + 1) * this.numCols + tileStartCol];
        const yLR = this.pointHeights[(tileStartRow + 1) * this.numCols + tileStartCol + 1];

        const idxStart = ((tileStartRow) * (this.numCols - 1) + tileStartCol) * 18;
        // Triangle 1 (UL, UR, LR)
        vec3.set(v1, xUL, yUL, zUL);
        vec3.set(v2, xUR, yUR, zUR);
        vec3.set(v3, xLR, yLR, zLR);
        vec3.sub(e1, v2, v1);
        vec3.sub(e2, v3, v1);
        vec3.cross(ecross, e1, e2);
        vec3.normalize(norm, ecross);
        tr[idxStart] = norm[0];
        tr[idxStart + 1] = norm[1];
        tr[idxStart + 2] = norm[2];
        tr[idxStart + 3] = norm[0];
        tr[idxStart + 4] = norm[1];
        tr[idxStart + 5] = norm[2];
        tr[idxStart + 6] = norm[0];
        tr[idxStart + 7] = norm[1];
        tr[idxStart + 8] = norm[2];
        // Triangle 2 (UL, LL, LR)
        vec3.set(v1, xUL, yUL, zUL);
        vec3.set(v2, xLL, yLL, zLL);
        vec3.set(v3, xLR, yLR, zLR);
        vec3.sub(e1, v2, v1);
        vec3.sub(e2, v1, v3);
        vec3.cross(ecross, e1, e2);
        vec3.normalize(norm, ecross);
        tr[idxStart + 9] = norm[0];
        tr[idxStart + 10] = norm[1];
        tr[idxStart + 11] = norm[2];
        tr[idxStart + 12] = norm[0];
        tr[idxStart + 13] = norm[1];
        tr[idxStart + 14] = norm[2];
        tr[idxStart + 15] = norm[0];
        tr[idxStart + 16] = norm[1];
        tr[idxStart + 17] = norm[2];
      }
    }
    return tr;
  }

  /**
   * No vertices are shared, so the index buffer is easy - 0, 1, 2, 3, 4, 5, 6, etc...
   */
  getIndexBuffer(): Uint32Array {
    const tr = new Uint32Array(6 * (this.numRows - 1) * (this.numCols - 1));
    for (let i = 0; i < tr.length; i++) {
      tr[i] = i;
    }
    return tr;
  }

  getVec4RenderPropBuffer(
      transformer: (renderProp: VertexPropType, tileProp: TilePropType, o: vec4)=>void) {
    const numTriangles = (this.numRows - 1) * (this.numCols - 1) * 2;
    const numVertices = numTriangles * 3;
    const tr = new Float32Array(numVertices * 4);
    const oUL = vec4.create(); // Initialization-time use ok
    const oUR = vec4.create(); // Initialization-time use ok
    const oLL = vec4.create(); // Initialization-time use ok
    const oLR = vec4.create(); // Initialization-time use ok
    for (let tileStartRow = 0; tileStartRow < this.numRows - 1; tileStartRow++) {
      for (let tileStartCol = 0; tileStartCol < this.numCols - 1; tileStartCol++) {
        const rpUL = this.vertexProps[tileStartRow * this.numCols + tileStartCol];
        const rpUR = this.vertexProps[tileStartRow * this.numCols + tileStartCol + 1];
        const rpLL = this.vertexProps[(tileStartRow + 1) * this.numCols + tileStartCol];
        const rpLR = this.vertexProps[(tileStartRow + 1) * this.numCols + tileStartCol + 1];

        const tp = this.tileProps[tileStartRow * (this.numCols - 1) + tileStartCol];

        transformer(rpUL, tp, oUL);
        transformer(rpUR, tp, oUR);
        transformer(rpLL, tp, oLL);
        transformer(rpLR, tp, oLR);

        const idxStart = ((tileStartRow) * (this.numCols - 1) + tileStartCol) * 24;
        // Triangle 1 (UL, UR, LR)
        tr[idxStart] = oUL[0];
        tr[idxStart + 1] = oUL[1];
        tr[idxStart + 2] = oUL[2];
        tr[idxStart + 3] = oUL[3];
        tr[idxStart + 4] = oUR[0];
        tr[idxStart + 5] = oUR[1];
        tr[idxStart + 6] = oUR[2];
        tr[idxStart + 7] = oUR[3];
        tr[idxStart + 8] = oLR[0];
        tr[idxStart + 9] = oLR[1];
        tr[idxStart + 10] = oLR[2];
        tr[idxStart + 11] = oLR[3];
        // Triangle 2 (UL, LL, LR)
        tr[idxStart + 12] = oLR[0];
        tr[idxStart + 13] = oLR[1];
        tr[idxStart + 14] = oLR[2];
        tr[idxStart + 15] = oLR[3];
        tr[idxStart + 16] = oLL[0];
        tr[idxStart + 17] = oLL[1];
        tr[idxStart + 18] = oLL[2];
        tr[idxStart + 19] = oLL[3];
        tr[idxStart + 20] = oLR[0];
        tr[idxStart + 21] = oLR[1];
        tr[idxStart + 22] = oLR[2];
        tr[idxStart + 23] = oLR[3];
      }
    }
    return tr;
  }
}
