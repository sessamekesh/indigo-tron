import { Component, ChangeDetectionStrategy, ViewChild, ElementRef, ChangeDetectorRef, OnInit } from "@angular/core";
import { Ng2Harness } from './ng2harness';
import { AllTests, ManualVerificationStep } from '../tests/testmain';
import { UiFriendlyTest } from '@libintegrationtest/testharness';

@Component({
  selector: 'app-root',
  templateUrl: './approot.component.html',
  styleUrls: ['./approot.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppRootComponent implements OnInit {
  @ViewChild('gameCanvas') canvasElement: ElementRef<HTMLCanvasElement>|undefined;

  readonly WebGL2Supported = (() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('experimental-webgl2');
    return !!gl;
  })();

  // TODO (kamaron): Ability to enable/disable tests by clicking on a checkbox by the name
  VisualizationEnabled = true;
  TestsRunning = false;
  CurrentTestName = '';
  SpeedupRate = '1';
  EnableManualVerification = false;

  constructor(
      private cdr: ChangeDetectorRef,
      private tests: AllTests,
      private harness: Ng2Harness,
      private manualVerificationStep: ManualVerificationStep) {
    this.tests.install(harness);
  }

  ngOnInit() {
    this.SpeedupRate = '8';
    this.buildTestsList();
    this.cdr.markForCheck();
  }

  getAllSuites() {
    return this.harness.getUiFriendlyResults();
  }

  buildTestsList() {
    if (!this.WebGL2Supported) {
      this.VisualizationEnabled = false;
    }
    this.CurrentTestName = '';
  }

  private maybeSetupGl() {
    this.manualVerificationStep.setTestFn(async () => true);
    if (this.VisualizationEnabled && this.canvasElement) {
      const gl2 =
          this.canvasElement.nativeElement.getContext('webgl2')
            || this.canvasElement.nativeElement.getContext('experimental-webgl2');
      this.harness.setGl(gl2);
      if (gl2 && this.EnableManualVerification) {
        // TODO (kamaron): Make a better manual verification flow
        this.manualVerificationStep.setTestFn(async (message: string) => {
          return confirm(`Verify: ${message}`);
        });
      }
    }
  }

  async runTest(entry: UiFriendlyTest) {
    this.harness.clearResultForTest(entry.FullName);
    this.cdr.markForCheck();
    this.maybeSetupGl();
    await this.harness.runIndividualTest(entry.FullName, parseInt(this.SpeedupRate));
    this.cdr.markForCheck();
  }

  async runTests() {
    this.harness.resetTests();
    this.cdr.markForCheck();
    this.maybeSetupGl();

    const testInterval = setInterval(() => this.cdr.markForCheck(), 500);
    this.TestsRunning = true;
    try {
      await this.harness.runTests(parseInt(this.SpeedupRate), false);
    } finally {
      this.CurrentTestName = '';
      this.TestsRunning = false;
      clearInterval(testInterval);
      this.cdr.markForCheck();
    }
  }
}
