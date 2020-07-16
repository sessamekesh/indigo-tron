declare namespace jasmine {
  interface Matchers<T> {
    toAlmostEqualMat4(expected: any): boolean;
    toAlmostEqualVec3(expected: any): boolean;
    toAlmostEqualVec2(expected: any): boolean;
  }
}
