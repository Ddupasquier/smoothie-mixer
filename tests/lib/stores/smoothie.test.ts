/**
 * Unit tests for the smoothie store helpers.
 * Uses Svelte 5 runes — no browser required.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
	foodToIngredient,
	getNutrientValue,
	calcNutritionTotals
} from '$lib/stores/smoothie.svelte';
import { NUTRIENT_IDS } from '$lib/utils/types';
import type { FdcFood } from '$lib/utils/types';

const mockFood: FdcFood = {
	fdcId: 173944,
	description: 'Bananas, raw',
	foodCategory: 'Fruits and Fruit Juices',
	foodNutrients: [
		{ nutrientId: 1008, nutrientName: 'Energy', nutrientNumber: '208', unitName: 'KCAL', value: 89 },
		{ nutrientId: 1003, nutrientName: 'Protein', nutrientNumber: '203', unitName: 'G', value: 1.09 },
		{ nutrientId: 1005, nutrientName: 'Carbohydrate', nutrientNumber: '205', unitName: 'G', value: 22.84 },
		{ nutrientId: 1004, nutrientName: 'Total lipid (fat)', nutrientNumber: '204', unitName: 'G', value: 0.33 },
		{ nutrientId: 1079, nutrientName: 'Fiber', nutrientNumber: '291', unitName: 'G', value: 2.6 },
		{ nutrientId: 2000, nutrientName: 'Sugars', nutrientNumber: '269', unitName: 'G', value: 12.23 }
	]
};

describe('foodToIngredient', () => {
	it('converts FdcFood to Ingredient with default 100 g serving', () => {
		const ing = foodToIngredient(mockFood);
		expect(ing.fdcId).toBe(173944);
		expect(ing.name).toBe('Bananas, raw');
		expect(ing.servingGrams).toBe(100);
		expect(ing.nutrients).toHaveLength(6);
	});

	it('uses custom serving grams', () => {
		const ing = foodToIngredient(mockFood, 50);
		expect(ing.servingGrams).toBe(50);
	});
});

describe('getNutrientValue', () => {
	it('returns scaled value for the serving size', () => {
		const ing = foodToIngredient(mockFood, 200); // 200 g serving
		// Calories: 89 per 100 g → 178 for 200 g
		expect(getNutrientValue(ing, NUTRIENT_IDS.CALORIES)).toBeCloseTo(178, 1);
	});

	it('returns 0 for a nutrient not in the food', () => {
		const ing = foodToIngredient(mockFood, 100);
		expect(getNutrientValue(ing, 9999)).toBe(0);
	});

	it('scales proportionally to serving grams', () => {
		const ing50 = foodToIngredient(mockFood, 50);
		const ing100 = foodToIngredient(mockFood, 100);
		expect(getNutrientValue(ing50, NUTRIENT_IDS.CALORIES)).toBeCloseTo(
			getNutrientValue(ing100, NUTRIENT_IDS.CALORIES) / 2,
			1
		);
	});
});

describe('calcNutritionTotals', () => {
	it('returns zeros for empty ingredient list', () => {
		const totals = calcNutritionTotals([]);
		expect(totals.calories).toBe(0);
		expect(totals.protein).toBe(0);
	});

	it('sums nutrients across multiple ingredients', () => {
		const ing1 = foodToIngredient(mockFood, 100);
		const ing2 = foodToIngredient(mockFood, 100); // duplicate for simple math
		const totals = calcNutritionTotals([ing1, ing2]);
		expect(totals.calories).toBeCloseTo(178, 1); // 89 * 2
		expect(totals.protein).toBeCloseTo(2.18, 1); // 1.09 * 2
	});

	it('includes all macro fields', () => {
		const ing = foodToIngredient(mockFood, 100);
		const totals = calcNutritionTotals([ing]);
		expect(totals).toHaveProperty('calories');
		expect(totals).toHaveProperty('protein');
		expect(totals).toHaveProperty('carbs');
		expect(totals).toHaveProperty('fat');
		expect(totals).toHaveProperty('fiber');
		expect(totals).toHaveProperty('sugar');
	});
});
