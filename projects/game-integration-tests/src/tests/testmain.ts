import { Injectable, NgModule } from "@angular/core";
import { SampleTest } from './sampletest';
import { TestHarness } from '@libintegrationtest/testharness';

@Injectable()
export class AllTests {
  constructor(private sampleTests: SampleTest) {}

  install(harness: TestHarness) {
    this.sampleTests.install(harness);
  }
}

@NgModule({
  providers: [
    SampleTest,
    AllTests,
  ]
})
export class TestsModule {}
