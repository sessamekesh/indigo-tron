import { vec2 } from 'gl-matrix';
import { SceneNode } from '@libutil/scene/scenenode';

export class WallGeneratorComponent {
  constructor(
    public PositionSceneNode: SceneNode,
    public VitalityAtSpawn: number,
    public DistanceBetweenSpawns: number,
    public LastSpawnPoint: vec2,
  ) {}
}
