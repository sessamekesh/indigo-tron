import { Entity } from './entity';
import { Klass, Klass0 } from './klass';
import { ECSSystem } from './ecssystem';
import { EventManager } from '@libutil/eventmanager';

// Helpers, for use in ECS query types later
// Notice they use some ugly type transformations - this is, unfortunately, necessary for now.
export interface KlassObjBase {[name: string]: Klass<any>};
function mapObject<A extends O[keyof O], B, O extends {[key: string]: any}>(o: O, f: (a: A)=>B) {
  return Object.keys(o).reduce(((ret: {[key: string]: any}, key: string) => {
    ret[key] = f(o[key]);
    return ret;
  }) as any, {} as any);
}
export type MappedKlassObjType<T extends KlassObjBase> = {
  [KlassKey in keyof T]: T[KlassKey] extends Klass<infer KlassT> ? KlassT : never;
}
function mapKlassObj<KlassObj extends KlassObjBase>(
    e: Entity, klassObj: KlassObj): MappedKlassObjType<KlassObj>|null {
  const klasses = Object.values(klassObj);
  const hasAllKlasses = klasses.every(klass => e.hasComponent(klass));
  if (!hasAllKlasses) return null;
  // We do have to break things a little bit here, unfortunately... :-(
  // A better type definition on mapObject method would help

  return mapObject(klassObj, klass => e.getComponent(klass)!) as any as MappedKlassObjType<KlassObj>;
}
type Partial<T> = {
  [K in keyof T]: T[K]|null;
}
function unwrapPartial<T>(partial: Partial<T>): T|null {
  if (Object.values(partial).every(v => v != null)) {
    return partial as unknown as T;
  }
  return null;
}

interface ECSManagerEventMap {
  'afterUpdate': void,
}

// Actual ECS manager implementation
export class ECSManager extends EventManager<ECSManagerEventMap> {
  private nextId_ = 0;
  private entities_ = new Map<number, Entity>();
  private indices_ = new Map<Klass<any>, Set<number>>();
  private systems_: ECSSystem[] = [];
  private started_ = false;
  private singletonComponents_ = new Map<Klass<any>, any>();

  // Public API...
  createEntity(): Entity {
    const id = this.nextId_++;
    const newEntity = new Entity(this, id);
    this.entities_.set(id, newEntity);
    return newEntity;
  }

  removeEntity(id: number) {
    const entity = this.entities_.get(id);
    if (entity) {
      entity.getAllComponents().forEach(klass => {
        const index = this.indices_.get(klass);
        if (index) {
          index.delete(id);
        }
      });
    }
    this.entities_.delete(id);
  }

  addSystem<T extends ECSSystem>(system: T): T {
    this.systems_.push(system);
    return system;
  }

  addSystem2<T extends ECSSystem>(klass: Klass0<T>) {
    const system = new klass();
    this.systems_.push(system);
    return system;
  }

  getSystem<T extends ECSSystem>(klass: Klass<T>): T|null {
    const systems = this.systems_.filter(_=>_ instanceof klass);
    if (systems.length === 0) {
      return null;
    }
    if (systems.length > 1) {
      throw new Error('Multiple systems by that class type - could not resolve');
    }
    return systems[0] as T;
  }

  start() {
    let success = true;
    this.systems_.forEach(system => success = success && system.start(this));
    if (success) {
      this.started_ = true;
    }
    return success;
  }

  restart() {
    let success = true;
    this.systems_.forEach(system => success = success && system.start(this));
    if (success) {
      this.started_ = true;
    }
    return success;
  }

  updateIndices<T>(klass: Klass<T>, entity: Entity, id: number) {
    const index = this.indices_.get(klass);
    if (!index) return;

    if (entity.hasComponent(klass)) {
      index.add(id);
    } else {
      index.delete(id);
    }
  }

  update(msDt: number) {
    if (!this.started_) {
      throw new Error('Cannot update systems, systems are not started - call "start" first');
    }

    for (let i = 0; i < this.systems_.length; i++) {
      this.systems_[i].update(this, msDt);
    }

    this.fireEvent('afterUpdate', undefined);
  }

  clearAllEntities() {
    this.nextId_ = 0;
    this.entities_.forEach(entity => entity.destroy());
    this.entities_.clear();
  }

  getSingletonComponent<A>(klass: Klass<A>): A|null {
    let out: A|null = null;
    this.iterateComponents([klass], (entity, a) => {
      out = a;
      return;
    });
    return out;
  }

  // TODO (sessamekesh): This should be only accessible at the system level, and requires passing
  //  assertions at initialization time that an entity exists that contains this object.
  getSingletonComponentOrThrow<A>(klass: Klass<A>): A {
    const component = this.getSingletonComponent(klass);
    if (!component) {
      throw new Error(`Failed to get singleton: ${klass.name}`);
    }
    return component;
  }

  iterateComponents<A>(klassList: [Klass<A>], cb: (entity: Entity, a: A)=>void): void;
  iterateComponents<A, B>(klassList: [Klass<A>, Klass<B>], cb: (entity: Entity, a: A, b: B)=>void): void;
  iterateComponents<A, B, C>(
    klassList: [Klass<A>, Klass<B>, Klass<C>], cb: (entity: Entity, a: A, b: B, c: C)=>void): void;
  iterateComponents<A, B, C, D>(
    klassList: [Klass<A>, Klass<B>, Klass<C>, Klass<D>],
    cb: (entity: Entity, a: A, b: B, c: C, d: D)=>void): void;
  iterateComponents(klassList: Klass<any>[], cb: (entity: Entity, ...components: any[])=>void) {
    if (klassList.length === 0) {
      return;
    }

    const idSets = klassList.map(klass => this.getOrCreateIndex(klass)).sort((a, b) => a.size - b.size);
    idSets[0].forEach(id => {
      // Skip this entity if it does not appear in all component indices
      for (let i = 1; i < idSets.length; i++) {
        if (!idSets[i].has(id)) return;
      }

      const entity = this.entities_.get(id);
      if (!entity) return;

      let missingInstance = false;
      const componentInstances = klassList.map(klass => {
        const instance = entity.getComponent(klass);
        if (!instance) missingInstance = true;
        return instance;
      });

      if (missingInstance) return;

      cb(entity, ...componentInstances);
    });
  }

  // TODO (sessamekesh): This should return an iterator instead (generator?)
  iterateComponents2<KlassObj extends KlassObjBase, SingletonKlassObj extends KlassObjBase>(
      singletonQuery: SingletonKlassObj,
      query: KlassObj,
      cb: (
        entity: Entity,
        singletons: MappedKlassObjType<SingletonKlassObj>,
        components: MappedKlassObjType<KlassObj>
      )=>void) {

    // Gross type avoidance thing here
    const partialSingletons =
        mapObject(
          singletonQuery,
          klass => this.getSingletonComponent(klass)) as unknown as Partial<MappedKlassObjType<SingletonKlassObj>>;
    const singletons = unwrapPartial(partialSingletons);
    if (!singletons) return;

    const klassList = Object.values(query);
    const idSets = klassList.map(klass => this.getOrCreateIndex(klass)).sort((a, b)=>a.size - b.size);
    idSets[0].forEach(id => {
      // Skip this entity if it does not appear in all component indices
      for (let i = 1; i < idSets.length; i++) {
        if (!idSets[i].has(id)) return;
      }

      const entity = this.entities_.get(id);
      if (!entity) return;

      const componentInstances = mapKlassObj(entity, query);
      if (!componentInstances) return;

      cb(entity, singletons, componentInstances);
    });
  }

  *iterateComponents3<SingletonObj extends KlassObjBase, ComponentObj extends KlassObjBase>(
      singletonQuery: SingletonObj,
      query: ComponentObj) {
    // Gross type avoidance thing here
    const partialSingletons =
    mapObject(
      singletonQuery,
      klass => this.getSingletonComponent(klass)) as unknown as Partial<MappedKlassObjType<SingletonObj>>;
    const singletons = unwrapPartial(partialSingletons);
    if (!singletons) return;

    const klassList = Object.values(query);
    const idSets = klassList.map(klass => this.getOrCreateIndex(klass)).sort((a, b)=>a.size - b.size);

    const firstIdSet = idSets[0];
    for (let id of firstIdSet) {
      // Skip this entity if it does not appear in all component indices
      for (let i = 1; i < idSets.length; i++) {
        if (!idSets[i].has(id)) continue;
      }

      const entity = this.entities_.get(id);
      if (!entity) continue;

      const componentInstances = mapKlassObj(entity, query);
      if (!componentInstances) continue;

      yield {entity, singletons, componentInstances};
    };
  }

  // TODO (sessamekesh): This should be "querySingletons" instead
  withSingletons<SingletonKlassObj extends KlassObjBase>(
      singletonQuery: SingletonKlassObj,
      cb: (singletons: MappedKlassObjType<SingletonKlassObj>)=>void): string[] {
    const partialSingletons =
      mapObject(
        singletonQuery,
        klass => this.getSingletonComponent(klass)) as unknown as Partial<MappedKlassObjType<SingletonKlassObj>>;
    const singletons = unwrapPartial(partialSingletons);

    if (!singletons) {
      return Object.entries(partialSingletons)
        .filter(entry => entry[1] == null)
        .map(entry => entry[0]);
    }

    cb(singletons);
    return [];
  }

  // Utility methods...
  private getOrCreateIndex<T>(klass: Klass<T>): Set<number> {
    const index = this.indices_.get(klass);
    if (index) {
      return index;
    }

    const ids = new Set<number>();
    this.entities_.forEach((value, key) => {
      if (value.hasComponent(klass)) {
        ids.add(key);
      }
    });

    this.indices_.set(klass, ids);
    return ids;
  }
}
