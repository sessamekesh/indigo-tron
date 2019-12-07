import { Context, AbortTestError } from './context';

export type FailResult = {
  Result: 'fail',
  Reason: string,
};

export type PassResult = {
  Result: 'pass',
};

export type PendingResult = {
  Result: 'pending',
};

export type DisabledResult = {
  Result: 'disabled',
};

export type TestResult = PassResult | FailResult | PendingResult | DisabledResult;

export type TestMethod = (context: Context, gl: WebGL2RenderingContext|null, vizSpeedup: number)=>Promise<any>;

export type Test = {
  Name: string,
  TestMethod: TestMethod,
  ParentGroup: TestGroup,
} & TestResult;

export type TestGroup = {
  Name: string,
  Tests: Map<string, Test>,
  Groups: Map<string, TestGroup>,
  ParentGroup: TestGroup|null,
};

export type UiFriendlyTest = {
  Name: string,
  FullName: string,
  Indentation: number,
} & TestResult;

export class TestHarness {
  constructor(private gl: WebGL2RenderingContext|null) {}

  setGl(gl: WebGL2RenderingContext|null) {
    this.gl = gl;
  }

  topLevelGroup_: TestGroup = { Name: '', Tests: new Map(), Groups: new Map(), ParentGroup: null, };
  context_ = new Context();

  resetTests() {
    this.resetGroup(this.topLevelGroup_);
  }
  private resetGroup(group: TestGroup) {
    group.Tests.forEach(test => test.ParentGroup.Tests.set(test.Name, {
      Name: test.Name,
      ParentGroup: test.ParentGroup,
      Result: 'pending',
      TestMethod: test.TestMethod,
    }));
    group.Groups.forEach(g => this.resetGroup(g));
  }

  registerTest(name: string, method: TestMethod) {
    const fullPath = name.split('.');
    const path = fullPath.slice(0, fullPath.length - 1);
    const testName = fullPath[fullPath.length - 1];
    let nextGroup = this.topLevelGroup_;
    for (let i = 0; i < path.length; i++) {
      const nodeName = path[i];
      const child = nextGroup.Groups.get(nodeName);
      if (child) {
        nextGroup = child;
      } else {
        const newGroup: TestGroup = {
          Name: nodeName,
          Tests: new Map(),
          Groups: new Map(),
          ParentGroup: nextGroup,
        };
        nextGroup.Groups.set(nodeName, newGroup);
        nextGroup = newGroup;
      }
    }
    if (nextGroup.Tests.has(testName)) {
      throw new Error(`Cannot create duplicate test ${name}`);
    }
    nextGroup.Tests.set(testName, {
      Name: testName,
      TestMethod: method,
      Result: 'pending',
      ParentGroup: nextGroup,
    });
  }

  disableTest(name: string) {
    const test = this.findTest(name);
    const testName = name.split('.')[name.split('.').length - 1];
    if (test) {
      test.ParentGroup.Tests.set(testName, {
        Name: testName,
        TestMethod: test.TestMethod,
        Result: 'disabled',
        ParentGroup: test.ParentGroup,
      });
    }
  }

  enableTest(name: string) {
    const test = this.findTest(name);
    const testName = name.split('.')[name.split('.').length - 1];
    if (test) {
      test.ParentGroup.Tests.set(testName, {
        Name: testName,
        TestMethod: test.TestMethod,
        Result: 'pending',
        ParentGroup: test.ParentGroup,
      });
    }
  }

  async runTests(vizSpeedup: number = 8, randomOrder: boolean = true) {
    let testsToRun: Test[] = [];
    this.addGroupTests(this.topLevelGroup_, testsToRun);
    if (randomOrder) {
      testsToRun = testsToRun.sort(() => (Math.random() < 0.5) ? -1 : 1);
    }

    for (let i = 0; i < testsToRun.length; i++) {
      const test = testsToRun[i];
      try {
        await test.TestMethod(this.context_, this.gl, vizSpeedup);
      } catch (e) {
        if (e instanceof AbortTestError) {
          test.ParentGroup.Tests.set(test.Name, {
            Name: test.Name,
            TestMethod: test.TestMethod,
            ParentGroup: test.ParentGroup,
            Result: 'fail',
            Reason: e.Reason,
          });
          continue;
        }
      }

      if (test.Result === 'pending') {
        test.ParentGroup.Tests.set(test.Name, {
          Name: test.Name,
          TestMethod: test.TestMethod,
          ParentGroup: test.ParentGroup,
          Result: 'pass',
        });
      }
    }
  }

  getUiFriendlyResults(): UiFriendlyTest[] {
    let testsToRun: Test[] = [];
    this.addGroupTests(this.topLevelGroup_, testsToRun);
    testsToRun = testsToRun.sort((a, b) => {
      const asplit = a.Name.split('.');
      const bsplit = b.Name.split('.');
      for (let i = 0; i < Math.min(asplit.length, bsplit.length); i++) {
        if (asplit[i] < bsplit[i]) {
          return -1;
        }
        if (asplit[i] > bsplit[i]) {
          return 1;
        }
      }
      if (asplit.length > bsplit.length) {
        return 1;
      }
      if (asplit.length < bsplit.length) {
        return -1;
      }
      return 0;
    });

    return testsToRun.map((test) => {
      let name = test.Name;
      let node = test.ParentGroup;
      let indentation = 0;
      while (node && node.ParentGroup) {
        indentation++;
        name = node.Name + '.' + name;
        node = node.ParentGroup;
      }
      const result: UiFriendlyTest = (test.Result === 'fail') ? {
        FullName: name,
        Name: test.Name,
        Indentation: indentation,
        Result: test.Result,
        Reason: test.Reason,
      } : {
        FullName: name,
        Name: test.Name,
        Indentation: indentation,
        Result: test.Result,
      } as UiFriendlyTest;
      return result;
    });
  }

  private addGroupTests(group: TestGroup, o_testList: Test[]) {
    group.Tests.forEach(test => o_testList.push(test));
    group.Groups.forEach(group => this.addGroupTests(group, o_testList));
  }

  private findTest(name: string) {
    const fullPath = name.split('.');
    const path = fullPath.slice(0, fullPath.length - 1);
    const testName = fullPath[fullPath.length - 1];
    let nextGroup = this.topLevelGroup_;
    for (let i = 0; i < path.length; i++) {
      const nodeName = path[i];
      const child = nextGroup.Groups.get(nodeName);
      if (child) {
        nextGroup = child;
      } else {
        const newGroup: TestGroup = {
          Name: nodeName,
          Tests: new Map(),
          Groups: new Map(),
          ParentGroup: nextGroup,
        };
        nextGroup.Groups.set(nodeName, newGroup);
        nextGroup = newGroup;
      }
    }
    return nextGroup.Tests.get(testName);
  }

  private getGroupStatus(
      group: TestGroup, known: Map<TestGroup, 'pass'|'fail'|'pending'|'disabled'> = new Map()):
      'pass'|'fail'|'pending'|'disabled' {
    const existing = known.get(group);
    if (existing) return existing;

    let hasFailures = false;
    let hasPending = false;
    let hasEnabled = false;
    group.Tests.forEach(test => {
      if (test.Result !== 'disabled') {
        hasEnabled = true;
      }
      if (test.Result === 'fail') {
        hasFailures = true;
      }
      if (test.Result === 'pending') {
        hasPending = true;
      }
    });

    group.Groups.forEach(childGroup => {
      const status = this.getGroupStatus(childGroup, known);
      if (status !== 'disabled') {
        hasEnabled = true;
      }
      if (status === 'fail') {
        hasFailures = true;
      }
      if (status === 'pending') {
        hasPending = true;
      }
    });

    if (hasFailures) {
      known.set(group, 'fail');
      return 'fail';
    }
    if (hasPending) {
      known.set(group, 'pending');
      return 'pending';
    }
    if (hasEnabled) {
      known.set(group, 'pass');
      return 'pass';
    }
    known.set(group, 'disabled');
    return 'disabled';
  }
}
