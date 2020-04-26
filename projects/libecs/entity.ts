import { EventManager } from '@libutil/eventmanager';
import { Klass, Klass0, Klass1, Klass2, Klass3, Klass4, Klass5, Klass6, Klass7, Klass8 } from './klass';
import { ECSManager } from './ecsmanager';

interface EntityEventMap {
  'destroy': Entity
};

export class Entity extends EventManager<EntityEventMap> {
  private components_ = new Map<Klass<any>, any>();
  private isActive_ = true;

  constructor(private ecsManager: ECSManager, public readonly id: number) {
    super();
  }

  addComponent<T>(klass: Klass0<T>): T;
  addComponent<T, A>(klass: Klass1<T, A>, a: A): T;
  addComponent<T, A, B>(klass: Klass2<T, A, B>, a: A, b: B): T;
  addComponent<T, A, B, C>(
    klass: Klass3<T, A, B, C>, a: A, b: B, c: C): T
  addComponent<T, A, B, C, D>(
    klass: Klass4<T, A, B, C, D>, a: A, b: B, c: C, d: D): T
  addComponent<T, A, B, C, D, E>(
    klass: Klass5<T, A, B, C, D, E>, a: A, b: B, c: C, d: D, e: E): T
  addComponent<T, A, B, C, D, E, F>(
    klass: Klass6<T, A, B, C, D, E, F>,
    a: A, b: B, c: C, d: D, e: E, f: F): T
  addComponent<T, A, B, C, D, E, F, G>(
    klass: Klass7<T, A, B, C, D, E, F, G>,
    a: A, b: B, c: C, d: D, e: E, f: F, g: G): T
  addComponent<T, A, B, C, D, E, F, G, H>(
    klass: Klass8<T, A, B, C, D, E, F, G, H>,
    a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H): T
  addComponent<T>(klass: Klass<T>, ...args: any[]) {
    if (this.components_.has(klass)) {
      throw new Error(`Cannot add component ${klass.name}, one is already registered`);
    }
    const component = new klass(...args);
    this.components_.set(klass, component);
    this.ecsManager.updateIndices(klass, this, this.id);
    return component;
  }

  addComponentRef<T>(klass: Klass<T>, componentRef: T) {
    if (this.components_.has(klass)) {
      throw new Error(`Cannot add component ${klass.name}, one is already registered`);
    }
    this.components_.set(klass, componentRef);
    this.ecsManager.updateIndices(klass, this, this.id);
    return componentRef;
  }

  removeComponent<T>(klass: Klass<T>) {
    this.components_.delete(klass);
    this.ecsManager.updateIndices(klass, this, this.id);
  }

  hasComponent<T>(klass: Klass<T>) {
    return this.components_.has(klass);
  }

  getComponent<T>(klass: Klass<T>): T|undefined {
    return this.components_.get(klass);
  }

  getAllComponents(): Klass<any>[] {
    return Array.from(this.components_.keys());
  }

  isActive() {
    return this.isActive_;
  }

  destroy() {
    this.isActive_ = false;
    this.fireEvent('destroy', this);
    this.components_.clear();
    this.ecsManager.removeEntity(this.id);
    super.destroy();
  }
}
