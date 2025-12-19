import { EventEmitter } from '../../node_modules/events/events.js';

var eventDispatcher = new EventEmitter();

export function sharedEventDispatcher() {
  return eventDispatcher;
}
