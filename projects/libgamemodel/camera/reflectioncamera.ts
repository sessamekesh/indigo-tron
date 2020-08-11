import { Camera } from "./camera";
import { vec3, mat4 } from "gl-matrix";
import { TempGroupAllocator } from "@libutil/allocator";

export class ReflectionCamera implements Camera {
  constructor(
    private baseCamera: Camera,
    private reflectionPoint: vec3,
    private reflectionNormal: vec3,
    private vec3Allocator: TempGroupAllocator<vec3>) {}

  setBaseCamera(camera: Camera) {
    this.baseCamera = camera;
  }

  pos(o: vec3) {
    this.vec3Allocator.get(1, (cameraPos) => {
      this.baseCamera.pos(cameraPos);
      this.reflectPoint(o, cameraPos);
    })
  }

  lookAt(o: vec3) {
    this.vec3Allocator.get(1, (cameraLookAt) => {
      this.baseCamera.lookAt(cameraLookAt);
      this.reflectPoint(o, cameraLookAt);
    });
  }

  up(o: vec3) {
    this.vec3Allocator.get(1, (cameraUp) => {
      this.baseCamera.up(cameraUp);
      this.reflectNormal(o, cameraUp);
    });
  }

  matView(o: mat4) {
    this.vec3Allocator.get(3, (pos, lookAt, up) => {
      this.pos(pos);
      this.lookAt(lookAt);
      this.up(up);
      mat4.lookAt(o, pos, lookAt, up);
    });
  }

  private reflectPoint(o: vec3, point: vec3) {
    this.vec3Allocator.get(1, (toPoint) => {
      vec3.sub(toPoint, point, this.reflectionPoint);
      const dist = vec3.dot(toPoint, this.reflectionNormal);
      vec3.scaleAndAdd(o, point, this.reflectionNormal, -2*dist);
    });
  }

  private reflectNormal(o: vec3, normal: vec3) {
    this.reflectPoint(o, normal);
    vec3.normalize(o, o);
  }
}
