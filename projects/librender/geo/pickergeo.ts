
export type PickerVertexData = {
  PosAttribLocation: number,
  UuidAttribLocation: number,

  PositionData: Float32Array|ArrayBuffer,
  UuidData: Uint32Array|ArrayBuffer,
};

export class PickerGeo {
  // TODO (sessamekesh): Fill out this class!
  // Create geo and a shader that populate uuid onto a color canvas, draw in a small area
  //  around the mouse each frame to an offscreen buffer, and sample the color at that spot!
  // - Only render when the (1) mouse moves, (2) view/world buffers update (do an invalidate)
}
