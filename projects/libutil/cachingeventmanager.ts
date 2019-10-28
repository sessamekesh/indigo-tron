import { IEventManager, EventManager } from "./eventmanager";

/**
 * Event manager that holds on to the last sent value, and fires this immediately to all new
 *  listeners. Useful for UI bindings.
 */
export class CachingEventManager<EventsMap> implements IEventManager<EventsMap> {

  private eventManager_ = new EventManager<EventsMap>();
  private valuesMap_ = new Map();

  addListener<KeyType extends keyof EventsMap>(
      key: KeyType, listener: (evt: EventsMap[KeyType]) => void):
      (evt: EventsMap[KeyType]) => void {
    const value = this.valuesMap_.get(key);
    if (value) {
      listener(value);
    }
    return this.eventManager_.addListener(key, listener);
  }
  removeListener<KeyType extends keyof EventsMap>(
      key: KeyType, listener: (evt: EventsMap[KeyType]) => void): boolean {
    return this.eventManager_.removeListener(key, listener);
  }
  fireEvent<KeyType extends keyof EventsMap>(key: KeyType, event: EventsMap[KeyType]): void {
    this.valuesMap_.set(key, event);
    return this.eventManager_.fireEvent(key, event);
  }
  destroy(): void {
    this.valuesMap_.clear();
    return this.eventManager_.destroy();
  }
}
