import { ECSManager } from "@libecs/ecsmanager";
import { GameAppRenderProviders2 } from "../gameapprenderproviders2";
import { RenderResourcesSingletonTag } from "@libgamerender/renderresourcesingletons/renderresourcessingletontag";
import { GLContextComponent, LightcycleLambertRenderResourcesComponent, ArenaFloorReflectionFramebufferComponent, ArenaFloorReflectionTextureComponent } from "@libgamerender/components/renderresourcecomponents";
import { ShaderBuilderUtil } from "@libgamerender/utils/shaderbuilder.util";
import { LambertShader } from "@librender/shader/lambertshader";
import { Solid2DShader } from "@librender/shader/solid2dshader";
import { ArenaFloorShader3 } from "@librender/shader/arenafloorshader3";
import { SolidColorUiShader } from "@librender/ui/solidcolorui.shader";
import { MsdfGlyphShader } from "@librender/text/msdfglyphshader";
import { ArenaWallShader2 } from "@librender/shader/arenawallshader2";
import { GeoRenderResourcesSingletonTag } from "@libgamerender/renderresourcesingletons/georenderresourcessingletontag";
import { DracoDecoderComponent } from "@libgamerender/renderresourcesingletons/dracodecodercomponent";
import { ArenaWall2RenderResourcesSingleton } from "@libgamerender/arena/arenawall2renderresources.singleton";
import { ArenaWall2GeoGenerator } from "@librender/geo/generators/arenawall2geogenerator";
import { ArenaWallShader2Singleton } from "@libgamerender/renderresourcesingletons/shadercomponents";
import { assert } from "@libutil/loadutils";
import { vec2 } from "gl-matrix";
import { BasicWallGeometryGenerator } from "@libgamerender/wall/basicwallgeometry.generator";
import { ArenaFloor3GeometrySingleton } from "@libgamerender/arena/arenafloor3geometry.singleton";
import { ArenaFloor3GlResourcesSingleton } from "@libgamerender/arena/arenafloor3glresources.singleton";
import { OpenSansFontSingleton } from "@libgamerender/components/opensansfont.singleton";
import { MathAllocatorsComponent, OwnedMathAllocatorsComponent, SceneGraphComponent } from "@libgamemodel/components/commoncomponents";
import { SceneGraph2 } from "@libscenegraph/scenegraph2";
import { Mat4TransformModule } from "@libscenegraph/scenenodeaddons/mat4transformmodule";
import { Renderable2SceneGraphModule } from "@librender/renderable/renderable2.scenegraphmodule";
import { LightcycleCollisionsListSingleton } from "@libgamemodel/components/lightcyclecollisionslist.singleton";
import { HudViewportSingleton } from "@libgamerender/hud/hudviewport.singleton";

export class BaseArenaLoadUtil {
  static PopulateUtilitySingletons(
      ecs: ECSManager, gl: WebGL2RenderingContext, rp: GameAppRenderProviders2) {
    // Global Resources
    ecs.iterateComponents([RenderResourcesSingletonTag], (entity) => entity.destroy());
    const glGlobalsEntity = ecs.createEntity();
    glGlobalsEntity.addComponent(RenderResourcesSingletonTag);
    glGlobalsEntity.addComponent(GLContextComponent, gl);

    ShaderBuilderUtil.createShaders(
      ecs, gl, [
        LambertShader, Solid2DShader, ArenaFloorShader3,
        ArenaWallShader2, MsdfGlyphShader, SolidColorUiShader
      ]);

    const utilitiesEntity = ecs.createEntity();
    utilitiesEntity.addComponent(
      MathAllocatorsComponent,
      rp.Vec2Allocator.get(),
      rp.Vec3Allocator.get(),
      rp.Mat4Allocator.get(),
      rp.QuatAllocator.get(),
      rp.CircleAllocator.get());
    utilitiesEntity.addComponent(
      OwnedMathAllocatorsComponent,
      rp.OwnedVec2Allocator.get(),
      rp.OwnedVec3Allocator.get(),
      rp.OwnedVec4Allocator.get(),
      rp.OwnedMat4Allocator.get(),
      rp.OwnedQuatAllocator.get(),
      rp.PlaneAllocator.get());
    utilitiesEntity.addComponent(
      SceneGraphComponent,
      new SceneGraph2()
        .addModule(
          Mat4TransformModule,
          new Mat4TransformModule(
            rp.OwnedMat4Allocator.get(),
            rp.OwnedVec3Allocator.get(),
            rp.Mat4Allocator.get(),
            rp.QuatAllocator.get()))
        .addModule(
          Renderable2SceneGraphModule,
          new Renderable2SceneGraphModule()));

    LightcycleCollisionsListSingleton.upsert(ecs);

    HudViewportSingleton.attach(ecs);
  }

  static async LoadGameGeometryObjects(
      ecs: ECSManager, gl: WebGL2RenderingContext, rp: GameAppRenderProviders2) {
    ecs.iterateComponents([GeoRenderResourcesSingletonTag], (entity) => entity.destroy());
    const geoEntity = ecs.createEntity();
    geoEntity.addComponent(GeoRenderResourcesSingletonTag);
    geoEntity.addComponent(DracoDecoderComponent, await rp.DracoProvider.getOrThrow(gl));
    geoEntity.addComponent(
      LightcycleLambertRenderResourcesComponent,
      await rp.BikeBodyLambertGeo.getOrThrow(gl),
      await rp.BikeWheelLambertGeo.getOrThrow(gl),
      await rp.BikeStickLambertGeo.getOrThrow(gl),
      await rp.BikeBodyTexture.getOrThrow(gl),
      await rp.BikeWheelTexture.getOrThrow(gl),
      await rp.BikeBodyTexture.getOrThrow(gl));
    geoEntity.addComponent(
      ArenaWall2RenderResourcesSingleton,
      assert(
        'ArenaWall2UnitGeo',
        ArenaWall2GeoGenerator.createUnitWall(
          gl, ecs.getSingletonComponentOrThrow(ArenaWallShader2Singleton).ArenaWallShader2)),
      await rp.CloudWispTexture1.getOrThrow(gl),
      await rp.CloudWispTexture2.getOrThrow(gl),
      /* Wisp2Scale */ vec2.fromValues(1/25, 1/25),
      /* Wisp2Scale */ vec2.fromValues(1/15, 1/20),
      /* Wisp1Velocity */ vec2.fromValues(0.15, -0.4),
      /* Wisp2Velocity */ vec2.fromValues(-0.15, -0.15));
    BasicWallGeometryGenerator.attachGeoSingleton(ecs);

    OpenSansFontSingleton.attach(ecs, await rp.OpenSansBMFont.getOrThrow(gl));
  }

  static async LoadArenaFloorResources(
      ecs: ECSManager, gl: WebGL2RenderingContext, rp: GameAppRenderProviders2) {
    ArenaFloor3GeometrySingleton.generate(ecs);
    ArenaFloor3GlResourcesSingleton.attach(ecs, rp.FloorReflectionTexture.getOrThrow(gl));
    const framebuffersEntity = ecs.createEntity();
    framebuffersEntity.addComponent(RenderResourcesSingletonTag);
    framebuffersEntity.addComponent(
      ArenaFloorReflectionFramebufferComponent, rp.FloorReflectionFramebuffer.getOrThrow(gl));

    const texturesEntity = ecs.createEntity();
    texturesEntity.addComponent(RenderResourcesSingletonTag);
    texturesEntity.addComponent(
      ArenaFloorReflectionTextureComponent,
      rp.FloorReflectionTexture.getOrThrow(gl));
  }
}
