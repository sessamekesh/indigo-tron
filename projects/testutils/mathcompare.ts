import { mat4, vec3 } from 'gl-matrix';

/**
 * This file contains custom matchers for math comparisons. To read more about making these, check
 *  out https://medium.com/angularid/jasmine-custom-matcher-in-angular-fd46684a06c
 */

function isMat4(input: any): input is mat4 {
  return (input instanceof Float32Array) && input.length === 16;
}

function isVec3(input: any): input is vec3 {
  return (input instanceof Float32Array) && input.length === 3;
}

function stringifyMat4(input: mat4) {
  return `[[${input[0].toFixed(3)}, ${input[1].toFixed(3)}, ${input[2].toFixed(3)}, ${input[3].toFixed(3)}], `
      + `[${input[4].toFixed(3)}, ${input[5].toFixed(3)}, ${input[6].toFixed(3)}, ${input[7].toFixed(3)}], `
      + `[${input[8].toFixed(3)}, ${input[9].toFixed(3)}, ${input[10].toFixed(3)}, ${input[11].toFixed(3)}], `
      + `[${input[12].toFixed(3)}, ${input[13].toFixed(3)}, ${input[14].toFixed(3)}, ${input[15].toFixed(3)}]]`;
}

function stringifyVec3(input: vec3) {
  return `(${input[0]}, ${input[1]}, ${input[2]})`;
}

function stringifyArray(input: number[]) {
  if (input.length === 0) return '()';
  let out = `(${input[0]}`;
  for (let i = 1; i < input.length; i++) {
    out += `, ${input[i]}`;
  }
  return out + ')';
}

function getPercentDiff(a: number, b: number) {
  return Math.abs(a - b) / (Math.abs(a + b) / 2);
}

function fail(msg: string): jasmine.CustomMatcherResult {
  return {
    pass: false,
    message: msg,
  };
}

function pass(msg: string = ''): jasmine.CustomMatcherResult {
  return { pass: true, message: msg };
}

export const GLMatrixMatchers: jasmine.CustomMatcherFactories = {
  toAlmostEqualMat4: (util: jasmine.MatchersUtil, customEqualityTesters: Array<jasmine.CustomEqualityTester>): jasmine.CustomMatcher => {
    return {
      compare: (actual: any, expected: any): jasmine.CustomMatcherResult => {
        if (!isMat4(actual)) {
          return fail('Test value was not an instance of mat4');
        }

        if (!isMat4(expected)) {
          return fail('Expected value was not an instance of mat4');
        }

        const failingIndices: number[] = [];
        for (let i = 0; i < 16; i++) {
          const percentDiff = getPercentDiff(expected[i], actual[i]);
          if (percentDiff > 0.001) {
            failingIndices.push(i);
          }
        }

        if (failingIndices.length > 0) {
          return fail(`Actual value ${stringifyMat4(actual)} is mismatched from expected value ${stringifyMat4(expected)} at indices ${stringifyArray(failingIndices)}`);
        }

        return pass(`Actual value ${stringifyMat4(actual)} matches expected value ${stringifyMat4(expected)}`);
      },
    }
  },
  toAlmostEqualVec3: (util: jasmine.MatchersUtil, customEqualityTesters: Array<jasmine.CustomEqualityTester>): jasmine.CustomMatcher => {
    return {
      compare: (actual: any, expected: any): jasmine.CustomMatcherResult => {
        if (!isVec3(actual)) {
          return fail('Test value is not a vec3');
        }

        if (!isVec3(expected)) {
          return fail('Expected value is not a vec3');
        }

        for (let i = 0; i < 3; i++) {
          if (getPercentDiff(expected[i], actual[i]) > 0.001) {
            return fail(`Actual value ${stringifyVec3(actual)} does not match expected ${stringifyVec3(expected)}`);
          }
        }

        return pass(`Actual value ${stringifyVec3(actual)} does matches expected ${stringifyVec3(expected)}`);
      },
    };
  },
};
