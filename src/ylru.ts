export interface LRUOptions {
    maxAge: number;
}

interface Entry<T> {
    value: T|undefined;
    expired?: number;
}

export class LRU<T, K = string | number> {
    private size = 0;
    private cache = new Map<K, Entry<T>>();
    private _cache = new Map<K, Entry<T>>();

    constructor(private max: number) {      
    }
  
    get(key: K, options?: LRUOptions): T | undefined {
      let item = this.cache.get(key);
      const maxAge = options && options.maxAge;
      
      // only call Date.now() when necessary
      let now = Date.now();

      if (item) {

        // check expired
        if (item.expired && now > item.expired) {
          item.expired = 0;
          item.value = undefined;
        } else {
          // update expired in get
          if (maxAge !== undefined) {
            const expired = maxAge ? now + maxAge : 0;
            item.expired = expired;
          }
        }
        return item.value;
      }
  
      // try to read from _cache
      item = this._cache.get(key);
      if (item) {
        // check expired
        if (item.expired && now > item.expired) {
          item.expired = 0;
          item.value = undefined;
        } else {
          // not expired, save to cache
          this.update(key, item);
          // update expired in get
          if (maxAge !== undefined) {
            const expired = maxAge ? now + maxAge : 0;
            item.expired = expired;
          }
        }
        return item.value;
      }

      return undefined;
    }
  
    set(key: K, value: T, options?: LRUOptions): void {
      const maxAge = options && options.maxAge;
      const expired = maxAge ? Date.now() + maxAge : 0;
      let item = this.cache.get(key);
      if (item) {
        item.expired = expired;
        item.value = value;
      } else {
        item = {
          value,
          expired,
        };
        this.update(key, item);
      }
    }
  
    keys(): K[] {
      const cacheKeys = new Set<K>();
      const now = Date.now();
  
      for (const entry of this.cache.entries()) {
        checkEntry(entry);
      }
  
      for (const entry of this._cache.entries()) {
        checkEntry(entry);
      }
  
      function checkEntry(entry: [K, Entry<T>]) {
        const key = entry[0];
        const item = entry[1];
        if (entry[1].value && (!entry[1].expired) || item.expired && item.expired >= now) {
          cacheKeys.add(key);
        }
      }
  
      return Array.from(cacheKeys.keys());
    }
  
    private update(key: K, item: Entry<T>): void {
      this.cache.set(key, item);
      this.size++;
      if (this.size >= this.max) {
        this.size = 0;
        this._cache = this.cache;
        this.cache = new Map();
      }
    }
  }
  