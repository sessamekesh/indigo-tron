import { AttribBuffersType, GeoBase } from "@librender/geo/geobase";
import { ArenaFloorShader2 } from '@librender/shader/arenafloorshader2';
import { FloorComponent } from '@libgamemodel/components/floor.component';
import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { ArenaFloorRenderComponent2 } from './arenafloor2.rendercomponent';
import { Entity } from '@libecs/entity';
import { ArenaFloor2RenderableGroup } from '@librender/renderable/arenafloor2renderableutil';
import { ArenaFloorRenderResourcesSingleton } from './arenafloorrenderresources.singleton';
import { GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { ArenaFloor2RenderGroupComponent } from './arenafloor2.rendergroupcomponent';
import { ArenaFloor2ShaderComponent } from '@libgamerender/renderresourcesingletons/shadercomponents';
import { mat4, vec3 } from 'gl-matrix';

function generateFloorGeometry(
    gl: WebGL2RenderingContext,
    shader: ArenaFloorShader2,
    floorComponent: FloorComponent): GeoBase|null {
  const attribs = shader.getAttribLocations();
  const w = floorComponent.Width / 2;
  const h = floorComponent.Height / 2;
  const buffers: AttribBuffersType<typeof attribs> = {
    position: {
      data: new Float32Array([-w, 0, -h, w, 0, -h, -w, 0, h, w, 0, h]),
      dataType: 'float',
      sizePerElement: 3,
    },
    texcoord: {
      data: new Float32Array([0, 0, 1, 0, 0, 1, 1, 1].map(uv => uv * 8)),
      dataType: 'float',
      sizePerElement: 2,
    },
    normal: {
      data: new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]),
      dataType: 'float',
      sizePerElement: 3,
    },
    bitangent: {
      data: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]),
      dataType: 'float',
      sizePerElement: 3,
    },
    tangent: {
      data: new Float32Array([1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0]),
      dataType: 'float',
      sizePerElement: 3,
    },
  };
  return GeoBase.create(
    gl, attribs, buffers, {BitWidth: 8, Data: new Uint8Array([0, 1, 2, 2, 1, 3])});
}

function getRenderableComponent(
    e: Entity,
    gl: WebGL2RenderingContext,
    shader: ArenaFloorShader2,
    arenaFloorComponent: FloorComponent,
    renderGroup: ArenaFloor2RenderableGroup,
    renderSingleton: ArenaFloorRenderResourcesSingleton): ArenaFloorRenderComponent2 {
  let component = e.getComponent(ArenaFloorRenderComponent2);

  if (!component) {
    // Renderables:
    const floorRenderable = renderGroup.createRenderable({
      albedoTexture: renderSingleton.ColorMap,
      geo: generateFloorGeometry(gl, shader, arenaFloorComponent)!,
      normalTexture: renderSingleton.NormalMap,
      reflectionTexture: renderSingleton.ReflectionTexture,
      roughnessTexture: renderSingleton.RoughnessMap,
    });
    floorRenderable.addTag(FloorComponent);
    mat4.translate(
      floorRenderable.perObjectData.matWorld.Value,
      mat4.create(),
      vec3.fromValues(0, -0.5, 0));

    component = e.addComponent(ArenaFloorRenderComponent2, floorRenderable);
    e.addListener('destroy', () => {
      renderGroup.destroy(floorRenderable);
    });
  }

  return component;
}

export class EnvironmentArenaFloorSystem extends ECSSystem {
  start() { return true; }

  update(ecs: ECSManager) {
    const singletonQuery = {
      gl: GLContextComponent,
      shader: ArenaFloor2ShaderComponent,
      renderResources: ArenaFloorRenderResourcesSingleton,
      renderGroup: ArenaFloor2RenderGroupComponent,
    };
    const componentQuery = {
      floor: FloorComponent,
    };
    ecs.iterateComponents2(singletonQuery, componentQuery, (entity, s, c) => {
      getRenderableComponent(
        entity, s.gl.gl, s.shader.ArenaFloor2Shader, c.floor, s.renderGroup.RenderGroup,
        s.renderResources);
    });
  }
}
