import { ECSManager } from "@libecs/ecsmanager";
import { MouseEventsQueueComponent, MouseManagerComponent, DestructorGroupComponent } from "./ioeventsqueuecomponents";
import { DestructorGroup } from "@libutil/destructorgroup";
import { MouseEvents } from "@io/mousestatemanager";

export class MouseEventsQueueUtil {
  static getMouseEventsQueue(ecs: ECSManager): MouseEventsQueueComponent {
    const existing = ecs.getSingletonComponent(MouseEventsQueueComponent);
    if (existing) return existing;

    const mouse = ecs.getSingletonComponentOrThrow(MouseManagerComponent).Mouse;
    const mouseEventsEntity = ecs.createEntity();
    const component = mouseEventsEntity.addComponent(MouseEventsQueueComponent, []);
    const destructorGroup = new DestructorGroup();
    mouseEventsEntity.addComponent(DestructorGroupComponent, destructorGroup);
    destructorGroup.addListener<MouseEvents, 'mousedown'>(mouse, 'mousedown', (event) => {
      component.MouseEvents.push({type: 'mousedown', event});
    });
    destructorGroup.addListener<MouseEvents, 'mouseup'>(mouse, 'mouseup', (event) => {
      component.MouseEvents.push({type: 'mouseup', event});
    });
    destructorGroup.addListener<MouseEvents, 'mousemove'>(mouse, 'mousemove', (event) => {
      component.MouseEvents.push({type: 'mousemove', event});
    });
    destructorGroup.addListener<MouseEvents, 'mousedrag'>(mouse, 'mousedrag', (event) => {
      component.MouseEvents.push({type: 'mousedrag', event});
    });
    destructorGroup.addListener<MouseEvents, 'mousewheel'>(mouse, 'mousewheel', (event) => {
      component.MouseEvents.push({type: 'mousewheel', event});
    });
    mouseEventsEntity.addListener('destroy', () => {
      destructorGroup.destroyAll();
    });
    return component;
  }
}
