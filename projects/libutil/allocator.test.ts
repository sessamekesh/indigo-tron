import { TempGroupAllocator, LifecycleOwnedAllocator } from "./allocator";

describe('TempGroupAllocator', () => {
  function getNewSpyCtor(): {ctor: ()=>number, invocationCount: ()=>number} {
    let timesInvoked = 0;
    return {
      ctor: () => { return timesInvoked++; },
      invocationCount: ()=>timesInvoked,
    };
  }

  it('returns distinct entities on individual call', () => {
    const spy = getNewSpyCtor();
    const allocator = new TempGroupAllocator(spy.ctor);

    allocator.get(6, (a, b, c, d, e, f) => {
      // There should be six distinct values here - a unique set should have six entries.
      const seen = new Set([a, b, c, d, e, f]);
      expect(seen.size).toBe(6);
    });
  });

  it('re-uses existing values between calls', () => {
    const spy = getNewSpyCtor();
    const allocator = new TempGroupAllocator(spy.ctor);

    const seen = new Set<number>();
    allocator.get(4, (a, b, c, d) => {
      // There should be four distinct values here - a unique set should have six entries.
      seen.add(a);
      seen.add(b);
      seen.add(c);
      seen.add(d);
      expect(seen.size).toBe(4);
    });

    allocator.get(4, (a, b, c, d) => {
      // The three values here should already be existing from the last call, and re-used
      seen.add(a);
      seen.add(b);
      seen.add(c);
      seen.add(d);
      expect(seen.size).toBe(4);
    });

    expect(spy.invocationCount()).toBe(4);
  });

  it('expands as necessary between calls', () => {
    const spy = getNewSpyCtor();
    const allocator = new TempGroupAllocator(spy.ctor);

    const seen = new Set<number>();
    allocator.get(3, (a, b, c) => {
      seen.add(a);
      seen.add(b);
      seen.add(c);
      expect(seen.size).toBe(3);
    });

    allocator.get(4, (a, b, c, d) => {
      // The three values here should already be existing from the last call, and re-used
      // But the fourth will have to be new.
      seen.add(a);
      seen.add(b);
      seen.add(c);
      seen.add(d);
      expect(seen.size).toBe(4);
    });

    expect(spy.invocationCount()).toBe(4);
  });

  it('supports nested calls', () => {
    const spy = getNewSpyCtor();
    const allocator = new TempGroupAllocator(spy.ctor);

    const seen = new Set<number>();
    allocator.get(2, (a, b) => {
      seen.add(a);
      seen.add(b);
      expect(seen.size).toBe(2);
      expect(spy.invocationCount()).toBe(2);

      allocator.get(2, (c, d) => {
        seen.add(c);
        seen.add(d);
        expect(seen.size).toBe(4);
        expect(spy.invocationCount()).toBe(4);
      });
    });

    allocator.get(4, (a, b, c, d) => {
      seen.add(a);
      seen.add(b);
      seen.add(c);
      seen.add(d);
      expect(seen.size).toBe(4);
      expect(spy.invocationCount()).toBe(4);
    });
  });
});

describe('LifecycleOwnedAllocator', () => {
  function getNewSpyCtor(): {ctor: ()=>number, invocationCount: ()=>number} {
    let timesInvoked = 0;
    return {
      ctor: () => { return timesInvoked++; },
      invocationCount: ()=>timesInvoked,
    };
  }

  it('allocates new resources on first use', () => {
    const spy = getNewSpyCtor();
    const allocator = new LifecycleOwnedAllocator(spy.ctor);

    const first = allocator.get();
    const second = allocator.get();

    expect(first.Value).toBe(0);
    expect(second.Value).toBe(1);
    expect(spy.invocationCount()).toBe(2);
  });

  describe('resource re-use', () => {
    it('re-uses old resources at the end', () => {
      const spy = getNewSpyCtor();
      const allocator = new LifecycleOwnedAllocator(spy.ctor);

      const first = allocator.get();
      const second = allocator.get();
      second.ReleaseFn();
      const third = allocator.get();

      expect(first.Value).toBe(0);
      expect(third.Value).toBe(1);
    });

    it('handles in-order removal', () => {
      const spy = getNewSpyCtor();
      const allocator = new LifecycleOwnedAllocator(spy.ctor);

      const _1 = allocator.get();
      const _2 = allocator.get();
      _1.ReleaseFn();
      _2.ReleaseFn();
      const _3 = allocator.get();
      const _4 = allocator.get();

      expect(_3.Value).toBe(0);
      expect(_4.Value).toBe(1);
    });
  });
});
