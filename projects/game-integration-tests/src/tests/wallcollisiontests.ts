import { Injectable } from "@angular/core";
import { TestHarness, TestMethod } from '@libintegrationtest/testharness';
import { ECSManager } from '@libecs/ecsmanager';
import { SceneNodeFactory } from '@libutil/scene/scenenodefactory';
import { TempGroupAllocator } from '@libutil/allocator';
import { vec3, mat4, quat, glMatrix, vec2 } from 'gl-matrix';
import { LightcycleSpawnerSystem } from '@libgamemodel/lightcycle/lightcyclespawner.system';
import { LightcycleUpdateSystem } from '@libgamemodel/lightcycle/lightcycleupdate.system';
import { FakeBikeInputController } from '../fakes/fakebikeinputcontroller';
import { EnvironmentSystem } from '@libgamemodel/systems/environment.system';
import { MockRenderFn, MockGameLoop, MockGameLoopWithRendering, MockGameLoopWithoutRendering } from '@libintegrationtest/mockgameloop';
import { WallRenderSystem } from '@libgamerender/systems/wall.rendersystem';
import { LightcycleRenderSystem } from '@libgamerender/systems/lightcycle.rendersystem';
import { WallspawnerSystem } from '@libgamemodel/wall/wallspawner.system';
import { EnvironmentRenderSystem } from '@libgamerender/systems/environment.rendersystem';
import { FrameSettings } from '@libgamerender/framesettings';
import { BasicCamera } from '@libgamemodel/camera/basiccamera';
import { ReflectionCamera } from '@libgamemodel/camera/reflectioncamera';
import { WallComponent } from '@libgamemodel/wall/wallcomponent';
import { LightcycleComponent2 } from '@libgamemodel/lightcycle/lightcycle.component';
import { BasicExpectations } from '@libintegrationtest/basicexpectations';
import { CommonGLResource } from './commonglresource';
import { ManualVerificationStep, TestsModule } from './testmain';

@Injectable()
export class WallCollisionTests {
  install(harness: TestHarness, manualVerification: ManualVerificationStep) {
    harness.registerTest('wallcollision.shallow.AgainstFlatWall', BouncesOffAtShallowAngleFlatWall);
    harness.registerTest(
      'wallcollision.moderate.AgainstFlatWall', BouncesOffAtModerateAngleFlatWall);
    harness.registerTest('wallcollision.deep.AgainstFlatWall', BouncesOffAtDeepAngleFlatWall);
    harness.registerTest(
      'wallcollision.shallow.ConvergingWalls', ShallowAngleConvergingWalls(manualVerification));
  }
}

const setupUtilities = () => {
  const vec3Allocator = new TempGroupAllocator(vec3.create);
  const mat4Allocator = new TempGroupAllocator(mat4.create);
  const quatAllocator = new TempGroupAllocator(quat.create);
  const sceneNodeFactory = new SceneNodeFactory(mat4Allocator, quatAllocator);
  const fakeBikeInput = new FakeBikeInputController();

  return {
    vec3Allocator, sceneNodeFactory, fakeBikeInput, mat4Allocator
  };
};

const setupRenderUtilities = async (gl: WebGL2RenderingContext) => {
  const lambertShader = CommonGLResource.LambertShader.get(gl);
  const arenaFloorShader = CommonGLResource.ArenaFloorShader.get(gl);
  const floorReflectionFBO = CommonGLResource.FloorReflectionFBO.get(gl);
  const bikeTexture = await CommonGLResource.BikeTexture.get(gl);
  const bikeWheelTexture = await CommonGLResource.BikeWheelTexture.get(gl);
  const bikeLambertGeo = await CommonGLResource.BikeBodyLambertGeo.get(gl);
  const bikeWheelGeo = await CommonGLResource.BikeWheelLambertGeo.get(gl);
  const bikeStickGeo = await CommonGLResource.BikeStickLambertGeo.get(gl);
  const floorTexture = CommonGLResource.FloorReflectionTexutre.get(gl);
  const wallTexture = CommonGLResource.WallTexture.get(gl);
  const wallGeo = CommonGLResource.WallGeo.get(gl);

  return {
    lambertShader, arenaFloorShader, bikeLambertGeo, bikeWheelGeo, bikeStickGeo, bikeTexture,
    bikeWheelTexture, floorTexture, wallGeo, wallTexture, floorReflectionFBO,
  };
};

const setupCommonWallCollisionTest = async (glOpt: WebGL2RenderingContext|null, speedup: number) => {
  const ecs = new ECSManager();
  const {
    vec3Allocator, sceneNodeFactory, fakeBikeInput, mat4Allocator
  } = setupUtilities();
  const lightcycleSpawnerSystem = ecs.addSystem(new LightcycleSpawnerSystem(sceneNodeFactory));
  const lightcycleUpdateSystem = ecs.addSystem(
    new LightcycleUpdateSystem(fakeBikeInput, vec3Allocator, sceneNodeFactory));
  lightcycleUpdateSystem.setRandomFn(()=>0.5);
  const environmentSystem = ecs.addSystem(new EnvironmentSystem());
  environmentSystem.spawnFloor(ecs, 400, 400);
  const wallSpawnerSystem = ecs.addSystem(new WallspawnerSystem(vec3Allocator));
  const camera = new BasicCamera(
    vec3.fromValues(13, 6, 8), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));
  const reflectionCamera = new ReflectionCamera(
    camera, vec3.fromValues(0, -0.5, 0), vec3.fromValues(0, 1, 0), vec3Allocator);

  let gameLoop: MockGameLoop;
  let renderFn: MockRenderFn|null = null;
  let renderUtilities = glOpt && await setupRenderUtilities(glOpt);
  if (glOpt && renderUtilities) {
    const {
      lambertShader, arenaFloorShader, bikeLambertGeo, bikeWheelGeo, bikeStickGeo, bikeTexture,
      bikeWheelTexture, floorTexture, wallGeo, wallTexture, floorReflectionFBO
    } = renderUtilities;
    const bikeRenderSystem = ecs.addSystem(new LightcycleRenderSystem(
      lambertShader, bikeLambertGeo, bikeWheelGeo, bikeStickGeo,
      bikeTexture, bikeWheelTexture, bikeWheelTexture, sceneNodeFactory, mat4Allocator));
    const environmentRenderSystem = ecs.addSystem(
      new EnvironmentRenderSystem(arenaFloorShader, 0.15, floorTexture));
    const wallRenderSystem = ecs.addSystem(
      new WallRenderSystem(
        lambertShader, wallGeo, sceneNodeFactory, vec3Allocator, mat4Allocator, wallTexture));

    const matProj = mat4.create();
    const matView = mat4.create();

    renderFn = (gl: WebGL2RenderingContext) => {
      // Floor reflection
      {
        floorReflectionFBO.bind(gl);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        reflectionCamera.matView(matView);
        const frameSettings: FrameSettings = {
          AmbientCoefficient: 0.5,
          LightColor: vec3.fromValues(1, 1, 1),
          LightDirection: vec3.fromValues(0, -1, 0),
          MatProj: matProj,
          MatView: matView,
        };
        bikeRenderSystem.render(gl, ecs, frameSettings);
        wallRenderSystem.render(gl, ecs, frameSettings);
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.canvas.width = (gl.canvas as HTMLCanvasElement).clientWidth * window.devicePixelRatio;
      gl.canvas.height = (gl.canvas as HTMLCanvasElement).clientHeight * window.devicePixelRatio;

      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor(0.1, 0.1, 0.1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);

      mat4.perspective(
        matProj, glMatrix.toRadian(45), gl.canvas.width / gl.canvas.height, 0.1, 1000.0);
      camera.matView(matView);
      const frameSettings: FrameSettings = {
        AmbientCoefficient: 0.5,
        LightColor: vec3.fromValues(1, 1, 1),
        LightDirection: vec3.fromValues(0, -1, 0),
        MatProj: matProj,
        MatView: matView,
      };
      bikeRenderSystem.render(gl, ecs, frameSettings);
      environmentRenderSystem.render(gl, ecs, frameSettings);
      wallRenderSystem.render(gl, ecs, frameSettings);
    };

    gameLoop = new MockGameLoopWithRendering(
      speedup, 1000 / 60, glOpt, (dt) => ecs.update(dt), renderFn);
  } else {
    gameLoop = new MockGameLoopWithoutRendering(1000 / 60, 500, 50, (dt) => ecs.update(dt));
  }
  ecs.start();

  return {
    ecs, gameLoop, lightcycleSpawnerSystem, camera, lightcycleUpdateSystem, wallSpawnerSystem,
  };
}

const BouncesOffAtShallowAngleFlatWall: TestMethod = async (context, glOpt, speedup) => {
  const {
    ecs, gameLoop, lightcycleSpawnerSystem, camera, lightcycleUpdateSystem,
  } = await setupCommonWallCollisionTest(glOpt, speedup);

  const basicExpectations = new BasicExpectations(context);

  camera.setPos(vec3.fromValues(8, 16, -12));
  camera.setLookAt(vec3.fromValues(0, 2, -5));

  // Spawn a lightcycle
  const mainCycle = lightcycleSpawnerSystem.spawnLightcycle(ecs, {
    Position: vec3.fromValues(0, 0, -20),
    Orientation: glMatrix.toRadian(-15),
  });
  // TODO (sessamekesh): This should be unnecessary, lightcycles should update on their own
  lightcycleUpdateSystem.setPlayerCycle(mainCycle);

  // Spawn a bunch of walls
  for (let i = 0; i < 20; i++) {
    const start = vec2.fromValues(-5, -15 + i);
    const end = vec2.fromValues(-5, -14 + i);
    const wallEntity = ecs.createEntity();
    wallEntity.addComponent(WallComponent, start, end, 15000);
  }

  // Send it flying for a second or two
  await gameLoop.tick(800);

  const lightcycleComponent = mainCycle.getComponent(LightcycleComponent2);
  basicExpectations.expect(lightcycleComponent).toBeDefined();
  if (!lightcycleComponent) return; // Type safety

  // Test deflection...
  const orientation = lightcycleComponent.BodySceneNode.getRotAngle();
  basicExpectations.expect(orientation).toRoughlyEqual(glMatrix.toRadian(15), glMatrix.toRadian(3));

  // Test vitality hit...
  basicExpectations.expect(lightcycleComponent.Vitality).toBeLessThan(100);
  basicExpectations.expect(lightcycleComponent.Vitality).toBeGreaterThan(95);
};

const BouncesOffAtModerateAngleFlatWall: TestMethod = async (context, gl, speedup) => {
  const {
    ecs, gameLoop, lightcycleSpawnerSystem, camera, lightcycleUpdateSystem,
  } = await setupCommonWallCollisionTest(gl, speedup);

  const basicExpectations = new BasicExpectations(context);

  camera.setPos(vec3.fromValues(8, 16, -12));
  camera.setLookAt(vec3.fromValues(0, 2, -5));

  // Spawn a lightcycle
  const mainCycle = lightcycleSpawnerSystem.spawnLightcycle(ecs, {
    Position: vec3.fromValues(5, 0, -20),
    Orientation: glMatrix.toRadian(-45),
  });
  // TODO (sessamekesh): This should be unnecessary, lightcycles should update on their own
  lightcycleUpdateSystem.setPlayerCycle(mainCycle);

  // Spawn a bunch of walls
  for (let i = 0; i < 20; i++) {
    const start = vec2.fromValues(-5, -15 + i);
    const end = vec2.fromValues(-5, -14 + i);
    const wallEntity = ecs.createEntity();
    wallEntity.addComponent(WallComponent, start, end, 15000);
  }

  // Send it flying for a second or two
  await gameLoop.tick(1200);

  const lightcycleComponent = mainCycle.getComponent(LightcycleComponent2);
  basicExpectations.expect(lightcycleComponent).toBeDefined();
  if (!lightcycleComponent) return; // Type safety

  // Test deflection...
  const orientation = lightcycleComponent.BodySceneNode.getRotAngle();
  basicExpectations.expect(orientation)
      .toRoughlyEqual(glMatrix.toRadian(21.5), glMatrix.toRadian(3));

  // Test vitality hit...
  basicExpectations.expect(lightcycleComponent.Vitality).toBeLessThan(100);
  basicExpectations.expect(lightcycleComponent.Vitality).toBeGreaterThan(0);
};

const BouncesOffAtDeepAngleFlatWall: TestMethod = async (context, gl, speedup) => {
  const {
    ecs, gameLoop, lightcycleSpawnerSystem, camera, lightcycleUpdateSystem,
  } = await setupCommonWallCollisionTest(gl, speedup);

  const basicExpectations = new BasicExpectations(context);

  camera.setPos(vec3.fromValues(8, 16, -12));
  camera.setLookAt(vec3.fromValues(0, 2, -5));

  // Spawn a lightcycle
  const mainCycle = lightcycleSpawnerSystem.spawnLightcycle(ecs, {
    Position: vec3.fromValues(5, 0, -10),
    Orientation: glMatrix.toRadian(275),
  });
  // TODO (sessamekesh): This should be unnecessary, lightcycles should update on their own
  lightcycleUpdateSystem.setPlayerCycle(mainCycle);

  // Spawn a bunch of walls
  for (let i = 0; i < 20; i++) {
    const start = vec2.fromValues(-5, -15 + i);
    const end = vec2.fromValues(-5, -14 + i);
    const wallEntity = ecs.createEntity();
    wallEntity.addComponent(WallComponent, start, end, 50);
  }

  // Send it flying for a second or two
  await gameLoop.tick(1200);

  const lightcycleComponent = mainCycle.getComponent(LightcycleComponent2);
  basicExpectations.expect(lightcycleComponent).toBeDefined();
  if (!lightcycleComponent) return; // Type safety

  // Test deflection...
  const orientation = lightcycleComponent.BodySceneNode.getRotAngle();
  basicExpectations.expect(orientation)
      .toRoughlyEqual(glMatrix.toRadian(275), glMatrix.toRadian(0.5));

  // Test vitality hit...
  basicExpectations.expect(lightcycleComponent.Vitality).toBeLessThan(5);
  basicExpectations.expect(lightcycleComponent.Vitality).toBeGreaterThan(0);
};

const ShallowAngleConvergingWalls: (m: ManualVerificationStep)=>TestMethod = (manualVerification: ManualVerificationStep) => {
  return async (context, gl, speedup) => {
    const {
      ecs, gameLoop, lightcycleSpawnerSystem, camera, lightcycleUpdateSystem,
    } = await setupCommonWallCollisionTest(gl, speedup);

    const basicExpectations = new BasicExpectations(context);

    camera.setPos(vec3.fromValues(0, 10, 0));
    camera.setLookAt(vec3.fromValues(0, 0, 20));

    // Spawn a lightcycle
    const mainCycle = lightcycleSpawnerSystem.spawnLightcycle(ecs, {
      Position: vec3.fromValues(0, 0, 10),
      Orientation: glMatrix.toRadian(0),
    });
    // TODO (sessamekesh): This should be unnecessary
    lightcycleUpdateSystem.setPlayerCycle(mainCycle);

    // Setup walls on either side
    const wallSet1 = [vec2.fromValues(2, 10), vec2.fromValues(-11, 60)];
    const wallSet2 = [vec2.fromValues(-4, 10), vec2.fromValues(-11, 60)];
    const numSegments = 50;
    for (let i = 0; i < numSegments; i++) {
      const wallEntity = ecs.createEntity();
      wallEntity.addComponent(
        WallComponent,
        vec2.lerp(vec2.create(), wallSet1[0], wallSet1[1], i / numSegments),
        vec2.lerp(vec2.create(), wallSet1[0], wallSet1[1], (i + 1) / numSegments),
        10);
      const wallEntity2 = ecs.createEntity();
      wallEntity2.addComponent(
        WallComponent,
        vec2.lerp(vec2.create(), wallSet2[0], wallSet2[1], i / numSegments),
        vec2.lerp(vec2.create(), wallSet2[0], wallSet2[1], (i + 1) / numSegments),
        10);
    }

    let playerHealthChangeEventCount = 0;
    const healthChangeListener = lightcycleUpdateSystem.addListener('playerhealthchange', (e) => {
      playerHealthChangeEventCount++;
    });

    await gameLoop.tick(2500);

    lightcycleUpdateSystem.removeListener('playerhealthchange', healthChangeListener);

    basicExpectations
      .expect(playerHealthChangeEventCount)
      .toBeGreaterThan(5, 'Expected player to have hit at least 5 walls bouncing around');

    await manualVerification.verify(context, 'Does this bounce pattern look good?');
  };
};
