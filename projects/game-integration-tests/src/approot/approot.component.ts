import { Component, ChangeDetectionStrategy, ViewChild, ElementRef, ChangeDetectorRef, OnInit } from "@angular/core";
import { Ng2Harness } from './ng2harness';
import { AllTests } from '../tests/testmain';

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

  VisualizationEnabled = true;
  TestsRunning = false;
  CurrentTestName = '';
  SpeedupRate = '1';

  constructor(
      private cdr: ChangeDetectorRef,
      private tests: AllTests,
      private harness: Ng2Harness) {
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
    if (!this.canvasElement) {
      this.VisualizationEnabled = false;
    }
    this.CurrentTestName = '';
  }

  async runTests() {
    this.harness.resetTests();
    this.cdr.markForCheck();
    if (this.VisualizationEnabled && this.canvasElement) {
      const gl2 =
          this.canvasElement.nativeElement.getContext('webgl2')
            || this.canvasElement.nativeElement.getContext('experimental-webgl2');
      this.harness.setGl(gl2);
    }

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
