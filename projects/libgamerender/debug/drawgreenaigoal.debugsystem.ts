import { ECSManager } from '@libecs/ecsmanager';
import { GreenAiGoalDebugComponent } from '@libgamemodel/debug/greenaigoal.debugcomponent';
import { ECSSystem } from '@libecs/ecssystem';
import { Entity } from '@libecs/entity';
import { DrawGreenAiGoalDebugComponent } from './drawgreenaigoal.debugcomponent';
import { SceneNodeFactory } from '@libutil/scene/scenenodefactory';
import { SceneNodeFactoryComponent } from '@libgamemodel/components/commoncomponents';
import { DebugRenderTag } from '@libgamemodel/debug/debugrendertag';
import { LambertRenderableComponent } from '@libgamerender/components/lambertrenderable.component';
import { vec4 } from 'gl-matrix';
import { DebugMarkerUtil } from './debugmarker.util';
import { LambertShader } from '@librender/shader/lambertshader';
import { GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { LambertShaderComponent } from '@libgamerender/renderresourcesingletons/shadercomponents';

export class DrawGreenAiGoalDebugSystem extends ECSSystem {
  start() { return true; }

  update(ecs: ECSManager) {
    const { SceneNodeFactory } = ecs.getSingletonComponentOrThrow(SceneNodeFactoryComponent);
    const { gl } = ecs.getSingletonComponentOrThrow(GLContextComponent);
    const { LambertShader: lambertShader } = ecs.getSingletonComponentOrThrow(LambertShaderComponent);

    ecs.iterateComponents([GreenAiGoalDebugComponent], (entity, greenAiGoalDebugComponent) => {
      const renderComponent = this.getRenderComponent(entity, SceneNodeFactory);
      renderComponent.SceneNode.update({ pos: greenAiGoalDebugComponent.GoalLocation.Value });

      if (!entity.hasComponent(DebugRenderTag)) {
        entity.addComponent(DebugRenderTag);
      }

      const lambertComponent = this.getLambertComponent(entity, gl, lambertShader);
      if (lambertComponent) {
        renderComponent.SceneNode.getMatWorld(lambertComponent.MatWorld);
      }
    });
  }

  private getRenderComponent(entity: Entity, sceneNodeFactory: SceneNodeFactory) {
    let component = entity.getComponent(DrawGreenAiGoalDebugComponent);
    if (!component) {
      const sceneNode = sceneNodeFactory.createSceneNode();
      entity.addListener('destroy', () => sceneNode.detach());
      component = entity.addComponent(DrawGreenAiGoalDebugComponent, sceneNode);
    }
    return component;
  }

  private getLambertComponent(
      entity: Entity, gl: WebGL2RenderingContext, lambertShader: LambertShader) {
    let component = entity.getComponent(LambertRenderableComponent);
    if (component) return component;

    const c = vec4.fromValues(0.1, 1, 0.1, 1);
    return DebugMarkerUtil.attachDebugMarker(entity, gl, lambertShader, c);
  }
}
