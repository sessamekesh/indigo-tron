import { vec2 } from 'gl-matrix';
import { SceneNode2 } from '@libscenegraph/scenenode2';

export class WallGeneratorComponent {
  constructor(
    public PositionSceneNode: SceneNode2,
    public VitalityAtSpawn: number,
    public DistanceBetweenSpawns: number,
    public LastSpawnPoint: vec2,
  ) {}
}
