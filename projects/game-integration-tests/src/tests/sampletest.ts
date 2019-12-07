import { Injectable } from '@angular/core';
import { TestMethod, TestHarness } from '@libintegrationtest/testharness';

const Test1: TestMethod = async (context) => {
  context.assert(() => true, 'This passes');
};

const Test2: TestMethod = async (context) => {
  context.assert(() => false, 'This fails');
};

@Injectable()
export class SampleTest {
  install(harness: TestHarness) {
    harness.registerTest('test1', Test1);
    harness.registerTest('test2', Test2);
  }
}
