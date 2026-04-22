import { DEBUG } from './constants.js';

export function log(...args) {
  if (DEBUG.logEvents) console.log('[polo]', ...args);
}
