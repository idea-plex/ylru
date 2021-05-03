

import { LRU } from './ylru';
import { describe, expect, test } from '@jest/globals';

const sleep = (ms: number): void => {
  const stop = Date.now() + ms;

  // eslint-disable-next-line no-empty
  while (Date.now() < stop) {}
};

describe('ylru tests', () => {
  describe('normal', () => {
    test('key is string', () => {
      const lru = new LRU(10);
      lru.set('foo', 'bar');
      expect(lru.get('foo')).toEqual('bar');
    });

    test('key is number', () => {
      const lru = new LRU(10);
      lru.set(1, 'bar');
      expect(lru.get(1)).toEqual('bar');
    });

    test('key is obj', () => {
      const lru = new LRU<string, Record<string, string>>(10);
      const obj = { hi: 'foo' };
      lru.set(obj, 'bar');
      expect(lru.get(obj)).toEqual('bar');
    });

    test('value is empty value', () => {
      const lru = new LRU(10);
      lru.set('foo', 'bar');
      expect(lru.get('foo')).toStrictEqual('bar');
      lru.set('foo', null);
      expect(lru.get('foo')).toBeNull();
      lru.set('foo', undefined);
      expect(lru.get('foo')).toBeUndefined();
      lru.set('foo', 0);
      expect(lru.get('foo')).toStrictEqual(0);
      lru.set('foo', '');
      expect(lru.get('foo')).toStrictEqual('');
    });

    test('value is obj', () => {
      const lru = new LRU(10);
      lru.set('foo', { foo: 'bar' });
      expect(lru.get('foo')).toEqual({ foo: 'bar' });
    });

    test('expired value should not copy', async () => {
      const lru = new LRU(2);
      lru.set('foo1', 'bar');
      lru.set('foo', 'bar', { maxAge: 2 });
      // @ts-ignore 
      expect(lru.cache.size).toStrictEqual(0);
      // @ts-ignore
      expect(lru._cache.size).toStrictEqual(2);

      await sleep(10);
      expect(lru.get('foo')).toBeUndefined();
      expect(lru.get('foo1')).toStrictEqual('bar');
      // @ts-ignore
      expect(lru['cache'].size).toStrictEqual(1);
      // @ts-ignore
      expect(lru._cache.size).toStrictEqual(2);

      await sleep(10);
      expect(lru.get('foo')).toBeUndefined();
      expect(lru.get('foo1')).toStrictEqual('bar');
      // @ts-ignore
      expect(lru.cache.size).toStrictEqual(1);
      // @ts-ignore
      expect(lru._cache.size).toStrictEqual(2);

      lru.set('foo2', 'bar');
      // @ts-ignore
      expect(lru.cache.size).toStrictEqual(0);
      // @ts-ignore
      expect(lru._cache.size).toStrictEqual(2);
      expect(lru.get('foo')).toBeUndefined();
      expect(lru.get('foo2')).toStrictEqual('bar');
      // @ts-ignore
      expect(lru.cache.size).toStrictEqual(1);
      // @ts-ignore
      expect(lru._cache.size).toStrictEqual(2);
    });

    test('item count overflow max', () => {
      const lru = new LRU(10);
      for (let i = 0; i < 10; i++) {
        lru.set(i, i);
      }
      // cache should be new Map()
      // @ts-ignore
      expect(lru.cache.size).toStrictEqual(0);
      // @ts-ignore
      expect(lru._cache.size).toStrictEqual(10);
      for (let i = 10; i < 20; i++) {
        lru.set(i, i);
      }
      // @ts-ignore
      expect(lru.cache.size).toStrictEqual(0);
      // @ts-ignore
      expect(lru._cache.size).toStrictEqual(10);
      expect(lru.get(0)).toBeUndefined();
      expect(lru.get(1)).toBeUndefined();
      expect(lru.get(9)).toBeUndefined();
      // @ts-ignore
      expect(lru.cache.size).toStrictEqual(0);
      // @ts-ignore
      expect(lru._cache.size).toStrictEqual(10);
      expect(lru.get(10)).toStrictEqual(10);
      // @ts-ignore
      expect(lru.cache.size).toStrictEqual(1);
      // @ts-ignore
      expect(lru.get(11)).toStrictEqual(11);
      // @ts-ignore
      expect(lru.cache.size).toStrictEqual(2);
      expect(lru.get(19)).toStrictEqual(19);
      // @ts-ignore
      expect(lru.cache.size).toStrictEqual(3);

      lru.set(20, 20);
      lru.set(20, 20);
      expect(lru.get(20)).toStrictEqual(20);
      expect(lru.get(10)).toStrictEqual(10);

      for (let i = 20; i < 27; i++) {
        lru.set(i, i);
      }
      // @ts-ignore
      expect(lru.cache.size).toStrictEqual(0);
      // @ts-ignore
      expect(lru._cache.size).toStrictEqual(10);
      expect(lru.get(10)).toStrictEqual(10);
      expect(lru.get(26)).toStrictEqual(26);
      // @ts-ignore
      expect(lru.cache.size).toStrictEqual(2);
    });
  });

  describe('set with options.maxAge', () => {
    [ 1, 10, 100, 1000, 1500, 2000 ].forEach(maxAge => {
      test(`maxAge=${maxAge}`, async () => {
        const lru = new LRU(10);
        lru.set(1, 0, { maxAge });
        lru.set('k2', 'v2', { maxAge });
        lru.set('k3', { foo: 'bar' }, { maxAge });
        expect(lru.get(1)).toStrictEqual(0);
        expect(lru.get('k2')).toStrictEqual('v2');
        expect(lru.get('k3')).toEqual({ foo: 'bar' });

        await sleep(maxAge + 10);
        expect(lru.get(1)).toBeUndefined();
        expect(lru.get('k2')).toBeUndefined();
        expect(lru.get('k3')).toBeUndefined();
        expect(lru.get(1)).toBeUndefined();
        expect(lru.get('k2')).toBeUndefined();
        expect(lru.get('k3')).toBeUndefined();
      });
    });
  });

  describe('get with options.maxAge', () => {
    for (const maxAge of [ 100, 1000, 1500, 2000 ]) {
      test(`maxAge=${maxAge}`, async () => {
        const lru = new LRU(10);
        lru.set(1, 0, { maxAge });
        lru.set('k2', 'v2', { maxAge });
        lru.set('k3', { foo: 'bar' }, { maxAge });
        expect(lru.get(1)).toStrictEqual(0);
        expect(lru.get('k2')).toStrictEqual('v2');
        expect(lru.get('k3')).toEqual({ foo: 'bar' });

        sleep(maxAge - 10);
        expect(lru.get(1, { maxAge })).toBeDefined();
        expect(lru.get('k2', { maxAge })).toBeDefined();
        expect(lru.get('k3', { maxAge })).toBeDefined();

        sleep(maxAge - 10);
        expect(lru.get(1)).toBeDefined();
        expect(lru.get('k2')).toBeDefined();
        expect(lru.get('k3')).toBeDefined();
        expect(lru.get(1)).toBeDefined();
        expect(lru.get('k2')).toBeDefined();
        expect(lru.get('k3')).toBeDefined();
      });
    }

    test('can update expired to 0', async () => {
      const lru = new LRU(10);
      lru.set('foo', 'bar', { maxAge: 100 });
      lru.get('foo', { maxAge: 0 });
      await sleep(200);
      expect(lru.get('foo') === 'bar');
    });

    test('can update expired when item in _cache', async () => {
      const lru = new LRU(2);
      lru.set('foo1', 'bar');
      lru.set('foo2', 'bar', { maxAge: 100 });
      lru.get('foo1', { maxAge: 100 });
      await sleep(50);
      expect(lru.get('foo1')).toStrictEqual('bar');
      expect(lru.get('foo2', { maxAge: 0 })).toStrictEqual('bar');
      await sleep(120);
      expect(lru.get('foo')).toBeFalsy();
      expect(lru.get('foo2')).toStrictEqual('bar');
      expect(lru.keys()).toEqual([ 'foo2' ]);
    });
  });

  describe('keys', () => {
    test('should work with no expired', () => {
      const lru = new LRU(5);
      lru.set('foo1', 'bar');
      lru.set('foo2', 'bar');
      lru.set('foo3', 'bar');
      lru.set('foo4', 'bar');
      lru.set('foo5', 'bar');
      lru.set('foo6', 'bar');
      // will be more than 5 because ylru's cache strategy
      expect(lru.keys().length).toStrictEqual(6);
    });

    test('should work with expired', async () => {
      const lru = new LRU(5);
      lru.set('foo1', 'bar', { maxAge: 100 });
      lru.set('foo2', 'bar', { maxAge: 100 });
      lru.set('foo3', 'bar', { maxAge: 100 });
      lru.set('foo4', 'bar', { maxAge: 200 });
      lru.set('foo5', 'bar', { maxAge: 200 });
      lru.set('foo6', 'bar', { maxAge: 200 });
      await sleep(120);
      expect(lru.keys().length).toStrictEqual(3);
      await sleep(120);
      expect(lru.keys().length).toStrictEqual(0);
    });
  });
});
