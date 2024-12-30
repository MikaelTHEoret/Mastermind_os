type EventHandler = (...args: any[]) => void;

export class EventEmitter {
  private events: Map<string, EventHandler[]> = new Map();
  private maxListeners: number = 10;

  on(event: string, handler: EventHandler): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    const handlers = this.events.get(event)!;
    if (handlers.length >= this.maxListeners) {
      console.warn(`Warning: Event '${event}' has exceeded max listeners (${this.maxListeners})`);
    }

    handlers.push(handler);
  }

  off(event: string, handler: EventHandler): void {
    if (!this.events.has(event)) return;

    const handlers = this.events.get(event)!;
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  emit(event: string, ...args: any[]): void {
    if (!this.events.has(event)) return;

    const handlers = this.events.get(event)!;
    handlers.forEach(handler => {
      try {
        handler(...args);
      } catch (error) {
        console.error(`Error in event handler for '${event}':`, error);
      }
    });
  }

  once(event: string, handler: EventHandler): void {
    const wrapper = (...args: any[]) => {
      handler(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  setMaxListeners(n: number): void {
    this.maxListeners = n;
  }

  listenerCount(event: string): number {
    return this.events.get(event)?.length || 0;
  }
}