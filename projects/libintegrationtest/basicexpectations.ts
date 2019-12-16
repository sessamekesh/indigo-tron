import { Context } from './context';

class NumberExpectations {
  constructor(private context: Context, private actualValue: number) {}

  toEqual(expected: number) {
    this.context.assert(
      ()=>expected === this.actualValue, `Expected ${this.actualValue} to be ${expected}`);
  }

  toRoughlyEqual(expected: number, maximumDelta: number = 1e-6) {
    this.context.assert(
      () => Math.abs(expected - this.actualValue) < maximumDelta,
      `Expected ${this.actualValue} to roughly equal ${expected}`);
  }

  toBeGreaterThan(expected: number, message: string|null = null) {
    this.context.assert(
      () => this.actualValue > expected,
      (message != null) ? message : `Expected ${this.actualValue} to be greater than ${expected}`);
  }

  toBeLessThan(expected: number) {
    this.context.assert(
      () => this.actualValue < expected,
      `Expected ${this.actualValue} to be less than ${expected}`);
  }
}

class GenericExpectations {
  constructor(private context: Context, private value: any) {}

  toBeDefined() {
    this.context.assert(
      () => this.value != null, `Expected ${this.value} to be defined`);
  }

  toBeUndefined() {
    this.context.assert(
      () => this.value == null, `Expected ${this.value} to be undefined`);
  }
}

export class BasicExpectations {
  constructor(private context: Context) {}

  expect(value: number): NumberExpectations;
  expect(value: any): GenericExpectations;
  expect(value: any) {
    if (typeof value === 'number') {
      return new NumberExpectations(this.context, value);
    }

    return new GenericExpectations(this.context, value);
  }
}
