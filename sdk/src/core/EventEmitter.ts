/**
 * Typed EventEmitter for deposit lifecycle events
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventMap = Record<string, (...args: any[]) => void>;

export class TypedEventEmitter<T extends EventMap = EventMap> {
  private listeners: Map<keyof T, Set<T[keyof T]>> = new Map();

  on<K extends keyof T>(event: K, listener: T[K]): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return this;
  }

  off<K extends keyof T>(event: K, listener: T[K]): this {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
    return this;
  }

  once<K extends keyof T>(event: K, listener: T[K]): this {
    const onceWrapper = ((...args: Parameters<T[K]>) => {
      this.off(event, onceWrapper as T[K]);
      (listener as (...args: any[]) => void)(...args);
    }) as T[K];
    return this.on(event, onceWrapper);
  }

  emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): boolean {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners || eventListeners.size === 0) {
      return false;
    }
    eventListeners.forEach((listener) => {
      try {
        (listener as (...args: any[]) => void)(...args);
      } catch (error) {
        console.error(`Error in event listener for "${String(event)}":`, error);
      }
    });
    return true;
  }

  removeAllListeners<K extends keyof T>(event?: K): this {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
    return this;
  }

  listenerCount<K extends keyof T>(event: K): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}
