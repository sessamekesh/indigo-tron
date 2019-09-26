declare module jasmine {
  interface Matchers {
    toAlmostEqualMat4(expected: any): boolean;
    toAlmostEqualVec3(expected: any): boolean;
  }
}
