import { IEventManager } from "./eventmanager";

export class DestructorGroup {
  private listeners_: {
    eventManager: IEventManager<any>,
    event: any,
    listener: any,
  }[] = [];

  addListener<EventsMap, KeyType extends keyof EventsMap>(
      eventManager: IEventManager<EventsMap>,
      event: KeyType,
      listener: (evt: EventsMap[KeyType]) => void) {
    const cb = eventManager.addListener(event, listener);
    this.listeners_.push({eventManager, event, listener: cb});
  }

  destroyAll() {
    this.listeners_.forEach(listener => {
      listener.eventManager.removeListener(listener.event, listener.listener);
    });
    this.listeners_ = [];
  }
}
