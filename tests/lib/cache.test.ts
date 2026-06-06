/**
 * Tests for the localStorage cache utility.
 * These run entirely in-memory (jsdom) — no network calls needed.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cacheGet, cacheSet, cacheDelete, cacheClearAll } from '$lib/cache';

beforeEach(() => {
	localStorage.clear();
});

describe('cacheSet / cacheGet', () => {
	it('stores and retrieves a value', () => {
		cacheSet('hello', { greeting: 'world' });
		expect(cacheGet('hello')).toEqual({ greeting: 'world' });
	});

	it('returns null for missing keys', () => {
		expect(cacheGet('nope')).toBeNull();
	});

	it('returns null for expired entries', () => {
		// TTL of 0 ms — already expired
		cacheSet('stale', 'old value', 0);
		// Advance time by 1 ms to ensure expiry
		const now = Date.now;
		vi.spyOn(Date, 'now').mockReturnValue(now() + 1);
		expect(cacheGet('stale')).toBeNull();
		vi.restoreAllMocks();
	});

	it('overwrites an existing value', () => {
		cacheSet('key', 'first');
		cacheSet('key', 'second');
		expect(cacheGet('key')).toBe('second');
	});
});

describe('cacheDelete', () => {
	it('removes a stored entry', () => {
		cacheSet('toDelete', 42);
		cacheDelete('toDelete');
		expect(cacheGet('toDelete')).toBeNull();
	});

	it('does not throw for non-existent keys', () => {
		expect(() => cacheDelete('ghost')).not.toThrow();
	});
});

describe('cacheClearAll', () => {
	it('removes all sm_cache_ entries', () => {
		cacheSet('a', 1);
		cacheSet('b', 2);
		cacheClearAll();
		expect(cacheGet('a')).toBeNull();
		expect(cacheGet('b')).toBeNull();
	});

	it('does not remove unrelated localStorage keys', () => {
		localStorage.setItem('other_app_key', 'preserve-me');
		cacheSet('x', 'remove-me');
		cacheClearAll();
		expect(localStorage.getItem('other_app_key')).toBe('preserve-me');
	});
});
