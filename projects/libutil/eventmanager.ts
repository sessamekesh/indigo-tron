type CBType<ValueType> = (evt: ValueType)=>void;

export interface IEventManager<EventsMap> {
  addListener<KeyType extends keyof EventsMap>(
    key: KeyType, listener: CBType<EventsMap[KeyType]>): CBType<EventsMap[KeyType]>;
  removeListener<KeyType extends keyof EventsMap>(
    key: KeyType, listener: CBType<EventsMap[KeyType]>): boolean;
  fireEvent<KeyType extends keyof EventsMap>(key: KeyType, event: EventsMap[KeyType]): void;
  destroy(): void;
}

export class EventManager<EventsMap> implements IEventManager<EventsMap> {
  private callbacks_ = new Map<any, ((event: any) => void)[]>();

  constructor() {}

  addListener<KeyType extends keyof EventsMap>(
      key: KeyType, listener: CBType<EventsMap[KeyType]>): CBType<EventsMap[KeyType]> {
    const listenerArray = this.callbacks_.get(key);
    if (listenerArray) {
      listenerArray.push(listener);
    } else {
      this.callbacks_.set(key, [listener]);
    }
    return listener;
  }

  removeListener<KeyType extends keyof EventsMap>(
      key: KeyType, listener: CBType<EventsMap[KeyType]>): boolean {
    let listenerArray = this.callbacks_.get(key);
    if (!listenerArray) return false;

    const oldlen = listenerArray.length;
    listenerArray = listenerArray.filter(_=>_!==listener);
    if (listenerArray.length === 0) {
      this.callbacks_.delete(key);
      return oldlen !== 0;
    }

    this.callbacks_.set(key, listenerArray);
    return oldlen !== listenerArray.length;
  }

  fireEvent<KeyType extends keyof EventsMap>(key: KeyType, event: EventsMap[KeyType]) {
    (this.callbacks_.get(key) || []).forEach((cb) => cb(event));
  }

  destroy() {
    this.callbacks_.clear();
  }
}
