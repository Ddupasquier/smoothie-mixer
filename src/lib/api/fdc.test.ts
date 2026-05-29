/**
 * Unit tests for the FDC API service.
 *
 * These tests use fetch mocking so they work offline and
 * don't consume real API rate-limit quota.
 *
 * To run a LIVE test against the real FDC API:
 *   VITE_FDC_API_KEY=<your_key> npx vitest run --reporter=verbose src/lib/api/fdc.test.ts
 * The live tests are skipped by default when no real key is present.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { cacheClearAll } from '$lib/cache';

// ---- Mock the import.meta.env used inside fdc.ts ----------------------------
vi.stubEnv('VITE_FDC_API_KEY', 'TEST_KEY');

// Import AFTER stubbing env
const { searchFoods, getFoodById } = await import('$lib/api/fdc');

// ---- Helpers ----------------------------------------------------------------

const mockFood = {
	fdcId: 173944,
	description: 'Bananas, raw',
	foodCategory: 'Fruits and Fruit Juices',
	foodNutrients: [
		{ nutrientId: 1008, nutrientName: 'Energy', nutrientNumber: '208', unitName: 'KCAL', value: 89 },
		{ nutrientId: 1003, nutrientName: 'Protein', nutrientNumber: '203', unitName: 'G', value: 1.09 }
	]
};

const mockSearchResponse = {
	foods: [mockFood],
	totalHits: 1,
	currentPage: 1,
	totalPages: 1
};

function mockFetch(data: unknown, status = 200) {
	return vi.fn().mockResolvedValue({
		ok: status >= 200 && status < 300,
		status,
		statusText: status === 200 ? 'OK' : 'Error',
		json: async () => data
	});
}

// ---- Tests ------------------------------------------------------------------

beforeEach(() => {
	localStorage.clear();
	cacheClearAll();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('searchFoods', () => {
	it('returns empty array for blank query', async () => {
		const result = await searchFoods('   ');
		expect(result).toEqual([]);
	});

	it('fetches and returns foods from the API', async () => {
		vi.stubGlobal('fetch', mockFetch(mockSearchResponse));
		const foods = await searchFoods('banana');
		expect(foods).toHaveLength(1);
		expect(foods[0].description).toBe('Bananas, raw');
	});

	it('uses cache on second call for the same query', async () => {
		const fetchMock = mockFetch(mockSearchResponse);
		vi.stubGlobal('fetch', fetchMock);

		await searchFoods('banana');
		await searchFoods('banana'); // second call should hit cache

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('treats query as case-insensitive for cache key', async () => {
		const fetchMock = mockFetch(mockSearchResponse);
		vi.stubGlobal('fetch', fetchMock);

		await searchFoods('Banana');
		await searchFoods('banana');

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('throws a descriptive error on non-OK response', async () => {
		vi.stubGlobal('fetch', mockFetch({}, 401));
		await expect(searchFoods('banana')).rejects.toThrow('FDC search failed');
	});
});

describe('getFoodById', () => {
	it('fetches a food by FDC ID', async () => {
		vi.stubGlobal('fetch', mockFetch(mockFood));
		const food = await getFoodById(173944);
		expect(food.fdcId).toBe(173944);
		expect(food.description).toBe('Bananas, raw');
	});

	it('uses cache on repeated calls for same id', async () => {
		const fetchMock = mockFetch(mockFood);
		vi.stubGlobal('fetch', fetchMock);

		await getFoodById(173944);
		await getFoodById(173944);

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('throws on non-OK response', async () => {
		vi.stubGlobal('fetch', mockFetch({}, 404));
		await expect(getFoodById(999999)).rejects.toThrow('FDC food fetch failed');
	});
});

// ---- Optional live integration test -----------------------------------------
// To run against the real FDC API, set VITE_FDC_API_KEY in your .env file and run:
//   npx vitest run src/lib/api/fdc.test.ts
// The live tests are skipped automatically when no real key is detected.

const REAL_KEY = (import.meta.env.VITE_FDC_API_KEY as string) ?? '';
const describeIfLive = REAL_KEY && REAL_KEY !== 'TEST_KEY' ? describe : describe.skip;

describeIfLive('Live FDC API (requires real API key)', () => {
	it('searches for "spinach" and returns results', async () => {
		// Uses the already-imported searchFoods with the real key configured in .env
		const foods = await searchFoods('spinach', 5);
		expect(foods.length).toBeGreaterThan(0);
		expect(foods[0]).toHaveProperty('fdcId');
	});
});
