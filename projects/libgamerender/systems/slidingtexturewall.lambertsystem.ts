import { LambertGeo } from '@librender/geo/lambertgeo';
import { TextureAnimation } from '@libgamerender/utils/textureanimation';
import { SlidingTextureLookup, SegmentUV } from '@libutil/scene/slidingtexturelookup';
import { Texture } from '@librender/texture/texture';
import { ECSSystem } from '@libecs/ecssystem';
import { ECSManager } from '@libecs/ecsmanager';
import { LifecycleOwnedAllocator, TempGroupAllocator } from '@libutil/allocator';
import { Entity } from '@libecs/entity';
import { vec3, mat4, vec2 } from 'gl-matrix';
import { WallComponent2 } from '@libgamemodel/wall/wallcomponent';
import { SceneNodeFactory } from '@libutil/scene/scenenodefactory';
import { Y_UNIT_DIR } from '@libutil/helpfulconstants';
import { LambertRenderableComponent } from '@libgamerender/components/lambertrenderable.component';
import { OverrideAmbientCoefficientComponent } from '@libgamerender/components/lightsettings.component';
import { MathAllocatorsComponent, SceneNodeFactoryComponent, OwnedMathAllocatorsComponent } from '@libgamemodel/components/commoncomponents';
import { GLContextComponent } from '@libgamerender/components/renderresourcecomponents';
import { WallRenderUtils } from './wallrenderutils';
import { LambertShaderComponent } from '@libgamerender/renderresourcesingletons/shadercomponents';

export class SlidingWallConstantsComponent {
  constructor(
    public PhaseOneWallAnimation: TextureAnimation,
    public PhaseTwoTexture: Texture,
    public TextureLookup: SlidingTextureLookup,
    public GeoGenerator: LifecycleOwnedAllocator<LambertGeo>) {}
}

export class SlidingWallRenderComponent {
  constructor(
    public Geo: LambertGeo,
    public PhaseOneWallAnimation: TextureAnimation,
    public TextureLookup: SlidingTextureLookup,
    public PhaseTwoTexture: Texture,
    public TimeElapsed: number,
    public SegmentUVCache: SegmentUV,
    public SegmentLength: number,
    public IsPhaseTwo: boolean = false,
    public UVBufferCache = new Float32Array(24)) {}
}

export class SlidingTextureWallSystem extends ECSSystem {
  static createGeoGenerator(ecs: ECSManager): LifecycleOwnedAllocator<LambertGeo> {
    return new LifecycleOwnedAllocator(() => {
      // TODO (sessamekesh): This does not consider WebGL context loss / change! Consider that!
      // You'll most likely have to (1) get a reference to the owning entity, (2) register a delete
      //  listener that clears the LifecycleOwnedAllocator when it is deleted.
      const { gl } = ecs.getSingletonComponentOrThrow(GLContextComponent);
      const { LambertShader } = ecs.getSingletonComponentOrThrow(LambertShaderComponent);

      return WallRenderUtils.generateWallGeo(gl, LambertShader, 1, 1);
    });
  }

  start() { return true; }

  update(ecs: ECSManager, msDt: number) {
    const slidingWallConstants = ecs.getSingletonComponentOrThrow(SlidingWallConstantsComponent);
    const { gl } = ecs.getSingletonComponentOrThrow(GLContextComponent);
    const {
      Vec3: vec3Allocator,
    } = ecs.getSingletonComponentOrThrow(MathAllocatorsComponent);
    const {
      SceneNodeFactory: sceneNodeFactory,
    } = ecs.getSingletonComponentOrThrow(SceneNodeFactoryComponent);
    const {
      Vec2: ownedVec2,
    } = ecs.getSingletonComponentOrThrow(OwnedMathAllocatorsComponent);

    ecs.iterateComponents([WallComponent2], (entity, wallComponent) => {
      const renderComponent = this.getRenderComponent(
        entity, wallComponent, slidingWallConstants, ownedVec2);
      const lambertComponent = this.getLambertRenderComponent(
        vec3Allocator,
        sceneNodeFactory,
        entity,
        wallComponent,
        renderComponent.Geo,
        renderComponent.PhaseOneWallAnimation.textureAt(0, false));

      // Update the lambert component: update the UVs (appropriate to the phase) and texture used
      if (renderComponent.TimeElapsed <= renderComponent.PhaseOneWallAnimation.totalTime()) {
        lambertComponent.DiffuseTexture = renderComponent.PhaseOneWallAnimation.textureAt(
          renderComponent.TimeElapsed, false);
        const segmentStart =
          (renderComponent.TimeElapsed / renderComponent.PhaseOneWallAnimation.totalTime())
          * (renderComponent.TextureLookup.stripLength - renderComponent.SegmentLength);
        const lookupRsl = renderComponent.TextureLookup.lookupSegmentUV(
          segmentStart,
          renderComponent.SegmentLength,
          renderComponent.SegmentUVCache);
        if (lookupRsl) {
          console.warn('[SlidingTextureWallSystem] Bad lookup: ' + lookupRsl);
        } else {
          WallRenderUtils.setUVs(
            gl,
            lambertComponent.Geometry,
            renderComponent.SegmentUVCache,
            renderComponent.UVBufferCache);
        }
      } else {
        lambertComponent.DiffuseTexture = renderComponent.PhaseTwoTexture;
        if (!renderComponent.IsPhaseTwo) {
          WallRenderUtils.setFullUvs(gl, lambertComponent.Geometry, renderComponent.UVBufferCache);
          renderComponent.IsPhaseTwo = true;
        }
      }

      renderComponent.TimeElapsed += msDt / 1000;
    });
  }

  private getRenderComponent(
      entity: Entity,
      wallComponent: WallComponent2,
      constants: SlidingWallConstantsComponent,
      ownedVec2: LifecycleOwnedAllocator<vec2>): SlidingWallRenderComponent {
    let component = entity.getComponent(SlidingWallRenderComponent);
    if (!component) {
      const len = vec2.dist(wallComponent.Corner1.Value, wallComponent.Corner2.Value)
      const geo = constants.GeoGenerator.get();
      const ul = ownedVec2.get();
      const ur = ownedVec2.get();
      const ll = ownedVec2.get();
      const lr = ownedVec2.get();
      component = entity.addComponent(
        SlidingWallRenderComponent,
        geo.Value,
        constants.PhaseOneWallAnimation,
        constants.TextureLookup,
        constants.PhaseTwoTexture,
        0, {
          BottomLeft: ll.Value,
          BottomRight: lr.Value,
          TopLeft: ul.Value,
          TopRight: ur.Value,
        },
        len);
      entity.addListener('destroy', () => geo.ReleaseFn());
      entity.addListener('destroy', () => ul.ReleaseFn());
      entity.addListener('destroy', () => ur.ReleaseFn());
      entity.addListener('destroy', () => ll.ReleaseFn());
      entity.addListener('destroy', () => lr.ReleaseFn());
    }
    return component;
  }

  private getLambertRenderComponent(
      vec3Allocator: TempGroupAllocator<vec3>,
      sceneNodeFactory: SceneNodeFactory,
      entity: Entity,
      wallComponent: WallComponent2,
      geo: LambertGeo,
      texture: Texture) {
    let component = entity.getComponent(LambertRenderableComponent);
    if (!component) {
      const matWorld = mat4.create();

      vec3Allocator.get(5, (midpoint, start, end, scl, startToEnd) => {
        vec3.set(start, wallComponent.Corner1.Value[0], 0, wallComponent.Corner1.Value[1]);
        vec3.set(end, wallComponent.Corner2.Value[0], 0, wallComponent.Corner2.Value[1]);
        vec3.sub(startToEnd, end, start);
        const len = vec3.len(startToEnd);
        vec3.lerp(midpoint, start, end, 0.5);
        vec3.set(scl, 0.5 * len, 1, 1);

        const angle = Math.atan2(
          -wallComponent.Corner2.Value[1] + wallComponent.Corner1.Value[1],
          wallComponent.Corner2.Value[0] - wallComponent.Corner1.Value[0]);

        // Lazy hack, use a scene node because we have the position and rotation. Don't do this.

        const sceneNode = sceneNodeFactory.createSceneNode();
        sceneNode.update({
          pos: midpoint,
          rot: {
            axis: Y_UNIT_DIR,
            angle,
          },
          scl,
        });
        sceneNode.getMatWorld(matWorld);
        sceneNode.detach();
      });

      component = entity.addComponent(LambertRenderableComponent, matWorld, geo, texture);
      entity.addComponent(OverrideAmbientCoefficientComponent, 0.9);
    }

    return component;
  }
}
