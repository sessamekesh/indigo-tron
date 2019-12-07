import { TestHarness } from '@libintegrationtest/testharness';
import { Injectable } from '@angular/core';

@Injectable()
export class Ng2Harness extends TestHarness {
  constructor() {
    super(null);
  }
}
