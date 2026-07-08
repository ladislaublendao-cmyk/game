// EventBus — ponte de comunicação Phaser ↔ React
// Usa um EventEmitter simples sem dependências externas

class SimpleEventEmitter {
  constructor() {
    this._events = {}
  }

  on(event, fn) {
    if (!this._events[event]) this._events[event] = []
    this._events[event].push(fn)
    return this
  }

  off(event, fn) {
    if (!this._events[event]) return this
    this._events[event] = this._events[event].filter(f => f !== fn)
    return this
  }

  emit(event, ...args) {
    if (!this._events[event]) return this
    this._events[event].forEach(fn => fn(...args))
    return this
  }

  removeAllListeners(event) {
    if (event) delete this._events[event]
    else this._events = {}
    return this
  }
}

export const EventBus = new SimpleEventEmitter()
