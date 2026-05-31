/**
 * FoodData Central (FDC) API client.
 * Docs: https://fdc.nal.usda.gov/api-guide.html
 *
 * Rate limit: 3,600 requests / hour with an API key.
 * All responses are cached in localStorage to minimise repeat calls.
 */

import { cacheGet, cacheSet } from '$lib/cache';
import type { FdcFood, FdcSearchResponse } from '$lib/types';

const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

/** Read the API key from the Vite environment variable */
function getApiKey(): string {
	const key = import.meta.env.VITE_FDC_API_KEY ?? '';
	if (!key || key === 'your_api_key_here') {
		console.warn(
			'[FDC] No API key found. Set VITE_FDC_API_KEY in your .env file. ' +
			'Get a free key at https://fdc.nal.usda.gov/api-guide.html'
		);
	}
	return key;
}

/** Build a URL with the api_key query parameter appended */
function buildUrl(path: string, params: Record<string, string> = {}): string {
	const url = new URL(`${BASE_URL}${path}`);
	url.searchParams.set('api_key', getApiKey());
	for (const [k, v] of Object.entries(params)) {
		url.searchParams.set(k, v);
	}
	return url.toString();
}

/**
 * Search FDC for foods matching `query`.
 * Results are cached for 24 hours to avoid redundant API calls.
 *
 * @param query  - The ingredient search term
 * @param pageSize - Number of results (default 25, max 200)
 */
export async function searchFoods(query: string): Promise<FdcFood[]> {
	const trimmed = query.trim();
	if (!trimmed) return [];

	const cacheKey = `search_${trimmed.toLowerCase()}_all`;
	const cached = cacheGet<FdcFood[]>(cacheKey);
	if (cached) return cached;

	const url = buildUrl('/foods/search', {
		query: trimmed,
		dataType: 'Foundation,SR Legacy'
		// No pageSize param: let API return default/max
	});

	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`FDC search failed: ${res.status} ${res.statusText}`);
	}

	const data: FdcSearchResponse = await res.json();
	const foods = data.foods ?? [];

	cacheSet(cacheKey, foods);
	return foods;
}

/**
 * Fetch a single food item by its FDC ID.
 * Results are cached for 24 hours.
 */
export async function getFoodById(fdcId: number): Promise<FdcFood> {
	const cacheKey = `food_${fdcId}`;
	const cached = cacheGet<FdcFood>(cacheKey);
	if (cached) return cached;

	const url = buildUrl(`/food/${fdcId}`);
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`FDC food fetch failed: ${res.status} ${res.statusText}`);
	}

	const food: FdcFood = await res.json();
	cacheSet(cacheKey, food);
	return food;
}
