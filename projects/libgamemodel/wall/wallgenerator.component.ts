import { vec2 } from 'gl-matrix';

export class WallGeneratorComponent {
  constructor(
    public VitalityAtSpawn: number,
    public DistanceSinceLastSpawn: number,
    public DistanceBetweenSpawns: number,
    public LastSpawnPoint: vec2,
  ) {}
}
