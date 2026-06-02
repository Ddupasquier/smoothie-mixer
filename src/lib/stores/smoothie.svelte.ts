/**
 * Svelte 5 rune-based store for the active smoothie being built.
 * Saved smoothies are persisted to localStorage.
 */

import { cacheGet, cacheSet } from '$lib/cache';
import { getFdcNutrientValue } from '$lib/utils/fdcNutrients';
import type { FdcFood, Ingredient, NutritionTotals, Smoothie } from '$lib/utils/types';
import { NUTRIENT_IDS } from '$lib/utils/types';

const SAVED_SMOOTHIES_KEY = 'saved_smoothies';
const DEFAULT_SERVING_GRAMS = 100;

// ---------------------------------------------------------------------------
// Active smoothie state (Svelte 5 runes — module-level $state)
// ---------------------------------------------------------------------------

export const activeIngredients = $state<Ingredient[]>([]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert an FdcFood into an Ingredient with a default serving size */
export function foodToIngredient(food: FdcFood, servingGrams = DEFAULT_SERVING_GRAMS): Ingredient {
	return {
		fdcId: food.fdcId,
		name: food.description,
		category: food.foodCategory,
		servingGrams,
		nutrients: food.foodNutrients ?? []
	};
}

/**
 * Return the nutrient value for a given nutrient ID,
 * scaled to the ingredient's serving size.
 */
export function getNutrientValue(ingredient: Ingredient, nutrientId: number): number {
	const value = getFdcNutrientValue(
		{
			fdcId: ingredient.fdcId,
			description: ingredient.name,
			foodCategory: ingredient.category,
			foodNutrients: ingredient.nutrients
		},
		nutrientId
	);
	// FDC values are per 100 g — scale to the actual serving
	return (value * ingredient.servingGrams) / 100;
}

/** Sum up key nutrients across all ingredients in the active smoothie */
export function calcNutritionTotals(ingredients: Ingredient[]): NutritionTotals {
	const sum = (id: number) =>
		ingredients.reduce((acc, ing) => acc + getNutrientValue(ing, id), 0);

	return {
		calories: sum(NUTRIENT_IDS.CALORIES),
		protein: sum(NUTRIENT_IDS.PROTEIN),
		carbs: sum(NUTRIENT_IDS.CARBS),
		fat: sum(NUTRIENT_IDS.FAT),
		fiber: sum(NUTRIENT_IDS.FIBER),
		sugar: sum(NUTRIENT_IDS.SUGAR)
	};
}

// ---------------------------------------------------------------------------
// Active smoothie mutations
// ---------------------------------------------------------------------------

export function addIngredient(food: FdcFood, servingGrams = DEFAULT_SERVING_GRAMS): void {
	const existing = activeIngredients.findIndex((i) => i.fdcId === food.fdcId);
	if (existing >= 0) {
		activeIngredients[existing].servingGrams += servingGrams;
	} else {
		activeIngredients.push(foodToIngredient(food, servingGrams));
	}
}

export function removeIngredient(fdcId: number): void {
	const idx = activeIngredients.findIndex((i) => i.fdcId === fdcId);
	if (idx >= 0) activeIngredients.splice(idx, 1);
}

export function updateServingGrams(fdcId: number, grams: number): void {
	const ing = activeIngredients.find((i) => i.fdcId === fdcId);
	if (ing) {
		ing.servingGrams = Math.max(1, grams);
	}
}

export function clearSmoothie(): void {
	activeIngredients.splice(0, activeIngredients.length);
}

// ---------------------------------------------------------------------------
// Saved smoothies (persisted to localStorage)
// ---------------------------------------------------------------------------

export function getSavedSmoothies(): Smoothie[] {
	return cacheGet<Smoothie[]>(SAVED_SMOOTHIES_KEY) ?? [];
}

export function saveSmoothie(name: string): Smoothie {
	const smoothie: Smoothie = {
		id: crypto.randomUUID(),
		name: name.trim() || 'My Smoothie',
		ingredients: [...activeIngredients],
		createdAt: Date.now()
	};
	const all = getSavedSmoothies();
	all.unshift(smoothie);
	cacheSet(SAVED_SMOOTHIES_KEY, all, 365 * 24 * 60 * 60 * 1000); // 1 year
	return smoothie;
}

export function deleteSavedSmoothie(id: string): void {
	const all = getSavedSmoothies().filter((s) => s.id !== id);
	cacheSet(SAVED_SMOOTHIES_KEY, all, 365 * 24 * 60 * 60 * 1000);
}

export function loadSmoothie(smoothie: Smoothie): void {
	clearSmoothie();
	smoothie.ingredients.forEach((i) => activeIngredients.push(i));
}
