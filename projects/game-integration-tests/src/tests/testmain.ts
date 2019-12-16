import { Injectable, NgModule } from "@angular/core";
import { TestHarness } from '@libintegrationtest/testharness';
import { WallCollisionTests } from './wallcollisiontests';
import { Context } from '@libintegrationtest/context';

@Injectable()
export class ManualVerificationStep {
  private testFn_: ((message: string)=>Promise<boolean>)|null = null;

  setTestFn(fn: (message: string)=>Promise<boolean>) {
    this.testFn_ = fn;
  }
  async verify(context: Context, message: string) {
    if (!this.testFn_) {
      throw new Error(`Missing either testFn ${this.testFn_}`);
    }
    await context.assertAsync(()=>this.testFn_!(message), message);
  }
}

@Injectable()
export class AllTests {
  constructor(
    private wallCollisionTests: WallCollisionTests,
    private manualVerification: ManualVerificationStep) {}

  install(harness: TestHarness) {
    this.wallCollisionTests.install(harness, this.manualVerification);
  }
}

@NgModule({
  providers: [
    WallCollisionTests,
    AllTests,
    ManualVerificationStep,
  ]
})
export class TestsModule {}
