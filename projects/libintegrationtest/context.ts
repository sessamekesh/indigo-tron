export class AbortTestError {
  constructor(public Reason: string) {}
}

export class Context {
  assert(testFn: ()=>boolean, message: string) {
    let rsl = false;
    try {
      rsl = testFn();
    } catch (e) {
      if (e instanceof AbortTestError) {
        throw e;
      }
      throw new AbortTestError(`Unhandled Exception in assertion "${message}"`);
    }

    if (!rsl) {
      throw new AbortTestError(message);
    }
  }

  async assertAsync(testFn: ()=>Promise<boolean>, message: string) {
    let rsl = false;
    try {
      rsl = await testFn();
    } catch (e) {
      if (e instanceof AbortTestError) {
        throw e;
      }
      throw new AbortTestError(`Unhandled Exception in assertion "${message}"`);
    }

    if (!rsl) {
      throw new AbortTestError(message);
    }
  }

  fail(msg: string) {
    throw new AbortTestError(msg);
  }
}
