import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { ArenaWallComponent } from '@libgamemodel/arena/arenawall.component';
import { Entity } from '@libecs/entity';
import { SceneGraphComponent, OwnedMathAllocatorsComponent, MathAllocatorsComponent } from '@libgamemodel/components/commoncomponents';
import { ArenaWall2RenderResourcesSingleton } from './arenawall2renderresources.singleton';
import { SceneGraph2 } from '@libscenegraph/scenegraph2';
import { ArenaWallShader2Renderable2 } from '@libgamerender/shaders/arenawallshader2.renderable';
import { LifecycleOwnedAllocator, TempGroupAllocator } from '@libutil/allocator';
import { vec3, vec2, vec4 } from 'gl-matrix';
import { Renderable2SceneNodeAddon } from '@librender/renderable/renderable2.scenenodeaddon';
import { Mat4TransformAddon } from '@libscenegraph/scenenodeaddons/mat4transformaddon';
import { ArenaWall2RenderComponent2 } from './arenawall2.rendercomponent2';
import { ColorUtil } from '@libutil/colorutil';

export class ArenaWall2RenderSystem extends ECSSystem {
  start() { return true; }

  update(ecs: ECSManager, msDt: number) {
    const dt = msDt / 1000;

    const singletonQuery = {
      sceneGraph: SceneGraphComponent,
      renderResources: ArenaWall2RenderResourcesSingleton,
      allocators: OwnedMathAllocatorsComponent,
      tempAllocators: MathAllocatorsComponent,
    };
    const componentQuery = {
      arenaWall: ArenaWallComponent,
    };

    ecs.iterateComponents2(singletonQuery, componentQuery, (e, s, c) => {
      const sceneGraph = s.sceneGraph.SceneGraph;
      const vec4Allocator = s.allocators.Vec4;
      const vec3Allocator = s.allocators.Vec3;
      const vec2Allocator = s.allocators.Vec2;
      const tempVec3 = s.tempAllocators.Vec3;
      const tempVec2 = s.tempAllocators.Vec2;

      const renderComponent = this.getOrCreateRenderComponent(
        e, c.arenaWall, sceneGraph, s.renderResources, vec4Allocator, vec3Allocator, vec2Allocator,
        tempVec3, tempVec2);
      vec2.scaleAndAdd(
        renderComponent.Renderable.perObjectData.wispMovement1.Value,
        renderComponent.Renderable.perObjectData.wispMovement1.Value,
        s.renderResources.WispVelocity1,
        dt);
      vec2.scaleAndAdd(
        renderComponent.Renderable.perObjectData.wispMovement2.Value,
        renderComponent.Renderable.perObjectData.wispMovement2.Value,
        s.renderResources.WispVelocity2,
        dt);
    });
  }

  private getOrCreateRenderComponent(
      entity: Entity,
      wallComponent: ArenaWallComponent,
      sceneGraph: SceneGraph2,
      renderResources: ArenaWall2RenderResourcesSingleton,
      vec4Allocator: LifecycleOwnedAllocator<vec4>,
      vec3Allocator: LifecycleOwnedAllocator<vec3>,
      vec2Allocator: LifecycleOwnedAllocator<vec2>,
      tempVec3: TempGroupAllocator<vec3>,
      tempVec2: TempGroupAllocator<vec2>) {
    let component = entity.getComponent(ArenaWall2RenderComponent2);
    if (!component) {
      const wallLength = Math.sqrt(
        (wallComponent.LineSegment.x1 - wallComponent.LineSegment.x0) ** 2
          + (wallComponent.LineSegment.y1 - wallComponent.LineSegment.y0) ** 2);
      const wallHeight = 22.5;

      const sceneNode = sceneGraph.createSceneNode();

      const baseColor = vec4Allocator.get();
      vec4.set(baseColor.Value, 0.45, 0.25, 0.88, 0.45);
      const wispColor = vec3Allocator.get();
      vec3.set(wispColor.Value, 0.35, 0.8, 0.15);
      const wispMovement1 = vec2Allocator.get();
      vec2.set(wispMovement1.Value, 0, 0);
      const wispMovement2 = vec2Allocator.get();
      vec2.set(wispMovement2.Value, 0, 0);
      const wispScale1 = vec2Allocator.get();
      const wispScale2 = vec2Allocator.get();
      tempVec2.get(1, scl => {
        // Notice: There was a bug here that was hard to catch, in copying over the scale.
        vec2.set(scl, wallLength, wallHeight);
        vec2.mul(wispScale1.Value, renderResources.WispTexture1Scale, scl);
        vec2.mul(wispScale2.Value, renderResources.WispTexture2Scale, scl);
      });
      const renderable = new ArenaWallShader2Renderable2({
        geo: renderResources.ArenaWallGeo,
        baseColor,
        wispMovement1, wispMovement2,
        cloudWispTexture1: renderResources.CloudWispTexture1,
        cloudWispTexture2: renderResources.CloudWispTexture2,
        wispColor,
        wispTexture1Scale: wispScale1,
        wispTexture2Scale: wispScale2,
        wispMaxIntensity: 0.85,
      });
      renderable.addTag(ArenaWallComponent);
      sceneNode
        .getAddon(Renderable2SceneNodeAddon)
        .addRenderable(ArenaWallShader2Renderable2, renderable);

      tempVec3.get(3, (pos, axis, scl) => {
        const rotAngle = (wallComponent.FuckIt ? -1 : 1) * Math.atan2(
          wallComponent.LineSegment.y1 - wallComponent.LineSegment.y0,
          wallComponent.LineSegment.x1 - wallComponent.LineSegment.x0);

        vec3.set(pos, wallComponent.LineSegment.x0, -0.5, wallComponent.LineSegment.y0);
        vec3.set(scl, wallLength, wallHeight, 1);
        vec3.set(axis, 0, 1, 0);
        sceneNode.getAddon(Mat4TransformAddon).update({pos, scl, rot: {angle: rotAngle, axis}});
      });

      entity.addListener('destroy', () => {
        baseColor.ReleaseFn();
        wispColor.ReleaseFn();
        wispMovement1.ReleaseFn();
        wispMovement2.ReleaseFn();
        sceneNode.destroy();
      });

      component = entity.addComponent(ArenaWall2RenderComponent2, sceneNode, renderable);
    }

    return component;
  }
}
