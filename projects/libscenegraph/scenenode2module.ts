import { SceneGraph2 } from './scenegraph2';
import { SceneNode2 } from './scenenode2';

export type SceneGraph2ModuleKey<ModuleType extends SceneGraph2Module> = new (...args: any[])=>ModuleType;

export abstract class SceneGraph2Module {
  abstract __extendSceneNode(sceneNode: SceneNode2): void;
}
