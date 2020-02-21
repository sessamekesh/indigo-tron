import { DracoDecoderCreationOptions, BufferDesc, BufferData, AttributeNameType } from './decoderconfig';
import { loadScript } from '@libutil/loadutils';
import { IBData } from '../ibdesc';

export class DracoDecoder {
  private constructor(private dracoModule: any) {}

  static async create(createOptions: DracoDecoderCreationOptions) {
    const wasmBinary = (typeof window['WebAssembly'] === 'object')
        && await fetch(createOptions.wasmBinaryURL).then(r=>r.arrayBuffer());

    const jsUrl = (wasmBinary && createOptions.wasmLoaderURL) || createOptions.jsFallbackURL;
    const DracoModuleCtor = (window as any)['DracoDecoderModule']
        || (await loadScript(jsUrl) && (window as any)['DracoDecoderModule']);
    if (typeof DracoModuleCtor !== 'function') {
      throw new Error('Could not create Draco decoder - DracoDecoderModule not found');
    }

    const dracoModule = await new Promise<{module: any}>((resolve) => {
      DracoModuleCtor({'wasmBinary': wasmBinary}).then((module: any) => {
        resolve({module});
      });
    });

    return new DracoDecoder(dracoModule.module);
  }

  decodeMesh(data: ArrayBuffer, bufferEntries: BufferDesc[]): {VertexData: BufferData[], IndexData: IBData} {
    const dataView = new Uint8Array(data);
    const decoderModule = this.dracoModule;

    // https://github.com/BabylonJS/Babylon.js/blob/c74e75c1402995a8b7fa8317607baec7fe0e2175/src/Meshes/Compression/dracoCompression.ts
    const buffer = new decoderModule['DecoderBuffer']();
    buffer['Init'](dataView, dataView.byteLength);

    const decoder = new decoderModule['Decoder']();
    let geometry: any;
    let status: any;

    const outs: BufferData[] = [];
    let indices: IBData|undefined = undefined;

    try {
      const type = decoder['GetEncodedGeometryType'](buffer);
      switch (type) {
        case decoderModule['TRIANGULAR_MESH']:
          geometry = new decoderModule['Mesh']();
          status = decoder['DecodeBufferToMesh'](buffer, geometry);
          break;
        default:
          throw new Error(`Invalid geometry type ${type}`);
      }

      if (!status['ok']() || !geometry['ptr']) {
        throw new Error(status['error_msg']());
      }

      const numVertices = geometry['num_points']();
      const numFaces = geometry['num_faces']();
      const faceIndices = new decoderModule['DracoInt32Array']();
      try {
        indices = ((): IBData => {
          if (numVertices < 0xFF) {
            return {
              Data: new Uint8Array(numFaces * 3),
              BitWidth: 8,
            };
          } else if (numVertices < 0xFFFF) {
            return {
              Data: new Uint16Array(numFaces * 3),
              BitWidth: 16,
            };
          } else {
            return {
              Data: new Uint32Array(numFaces * 3),
              BitWidth: 32,
            };
          }
        })();
        for (let i = 0; i < numFaces; i++) {
          decoder['GetFaceFromMesh'](geometry, i, faceIndices);
          const offset = i * 3;
          indices.Data[offset + 0] = faceIndices['GetValue'](0);
          indices.Data[offset + 1] = faceIndices['GetValue'](1);
          indices.Data[offset + 2] = faceIndices['GetValue'](2);
        }
      } finally {
        decoderModule['destroy'](faceIndices);
      }

      // CUSTOM CODE
      for (let i = 0; i < bufferEntries.length; i++) {
        const attribId = this.getAttribIndex(decoderModule, decoder, geometry, bufferEntries[i].AttributeName);
        const attribute = decoder['GetAttributeByUniqueId'](geometry, attribId);
        const numComponents = attribute['num_components']();
        const rslBuffer = new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT * numComponents * numVertices);
        const f32 = new Float32Array(rslBuffer);
        const u32 = new Uint32Array(rslBuffer);

        const dracoData = bufferEntries[i].DataType === 'float32'
          ? new decoderModule['DracoFloat32Array']()
          : new decoderModule['DracoUInt32Array']();
        try {
          if (bufferEntries[i].DataType === 'float32') {
            decoder['GetAttributeFloatForAllPoints'](geometry, attribute, dracoData);
          } else {
            decoder['GetAttributeUInt32ForAllPoints'](geometry, attribute, dracoData);
          }

          for (let j = 0; j < numVertices * numComponents; j++) {
            if (bufferEntries[i].DataType === 'float32') {
              f32[j] = dracoData['GetValue'](j);
            } else {
              u32[j] = dracoData['GetValue'](j);
            }
          }
        } finally {
          decoderModule['destroy'](dracoData);
        }
        outs.push({Desc: bufferEntries[i], Data: rslBuffer});
      }
      // END CUSTOM CODE
    } finally {
      if (geometry) {
        decoderModule['destroy'](geometry);
      }
      decoderModule['destroy'](decoder);
      decoderModule['destroy'](buffer);
    }

    if (outs.length > 0 && indices) {
      return {
        VertexData: outs,
        IndexData: indices,
      };
    }

    throw new Error('Failed to decode mesh for an unknown reason - vertices/indices not present');
  }

  private getAttribIndex(
      emModule: any, emDecoder: any, emMesh: any, attribName: AttributeNameType): number {
    switch (attribName) {
      case 'position': return emDecoder['GetAttributeId'](emMesh, emModule['POSITION']);
      case 'normal': return emDecoder['GetAttributeId'](emMesh, emModule['NORMAL']);
      case 'texcoord': return emDecoder['GetAttributeId'](emMesh, emModule['TEX_COORD']);
      case 'boneidx':
        return emDecoder['GetAttributeIdByMetadataEntry'](emMesh, 'attrib_type', 'bone_idx_attrib');
      case 'boneweight':
        return emDecoder['GetAttributeIdByMetadataEntry'](emMesh, 'attrib_type', 'bone_weight_attrib');
      default: return -1;
    }
  }
}
