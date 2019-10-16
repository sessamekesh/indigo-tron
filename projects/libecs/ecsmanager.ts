import { Entity } from './entity';
import { Klass } from './klass';
import { ECSSystem } from './ecssystem';

export class ECSManager {
  private nextId_ = 0;
  private entities_ = new Map<number, Entity>();
  private indices_ = new Map<Klass<any>, Set<number>>();
  private systems_: ECSSystem[] = [];
  private started_ = false;

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

  start() {
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
