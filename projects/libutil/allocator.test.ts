import { TempGroupAllocator } from "./allocator";

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
