export type Klass0<T extends Object> = new () => T;
export type Klass1<T extends Object, A> = new (a: A) => T;
export type Klass2<T extends Object, A, B> = new (a: A, b: B) => T;
export type Klass3<T extends Object, A, B, C> = new (a: A, b: B, c: C) => T;
export type Klass4<T extends Object, A, B, C, D> = new (a: A, b: B, c: C, d: D) => T;
export type Klass5<T extends Object, A, B, C, D, E> = new (a: A, b: B, c: C, d: D, e: E) => T;
export type Klass6<T extends Object, A, B, C, D, E, F> =
  new (a: A, b: B, c: C, d: D, e: E, f: F) => T;
export type Klass7<T extends Object, A, B, C, D, E, F, G> =
  new (a: A, b: B, c: C, d: D, e: E, f: F, g: G) => T;
export type Klass8<T extends Object, A, B, C, D, E, F, G, H> =
  new (a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H) => T;
export type Klass9<T extends Object, A, B, C, D, E, F, G, H, I> =
  new (a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H, i: I) => T;
export type Klass10<T extends Object, A, B, C, D, E, F, G, H, I, J> =
  new (a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H, i: I, j: J) => T;
export type Klass11<T extends Object, A, B, C, D, E, F, G, H, I, J, K> =
  new (a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H, i: I, j: J, k: K) => T;
export type Klass12<T extends Object, A, B, C, D, E, F, G, H, I, J, K, L> =
  new (a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H, i: I, j: J, k: K, l: L) => T;

export type Klass<T extends Object> = new (...args: any[]) => T;
