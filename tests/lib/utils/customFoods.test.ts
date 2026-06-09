import { beforeEach, describe, expect, it, vi } from "vitest";

const cloudData = vi.hoisted(() => ({
	saveCloudCustomFood: vi.fn(),
	writeCloudCustomFoods: vi.fn(),
}));

vi.mock("$lib/utils/storage/supabaseData", () => cloudData);

import {
	CUSTOM_FOODS_STORAGE_KEY,
	createCustomFood,
	readCustomFoods,
	saveCustomFood,
	searchCustomFoods,
} from "$lib/utils/food/customFoods";
import { NUTRIENT_IDS } from "$lib/utils/food/types";
import { getFdcNutrientValue } from "$lib/utils/food/fdcNutrients";

describe("custom foods", () => {
	beforeEach(() => {
		localStorage.removeItem(CUSTOM_FOODS_STORAGE_KEY);
		vi.clearAllMocks();
	});

	it("converts nutrition facts per serving into per-100g nutrients", () => {
		const food = createCustomFood({
			name: "Oreos",
			servingLabel: "3 cookies",
			servingWeightGrams: 34,
			nutrition: {
				calories: 160,
				fat: 7,
				carbs: 25,
				fiber: 1,
				sugar: 14,
				protein: 1,
			},
		});

		expect(food.customFood).toBe(true);
		expect(food.servingSize).toBe(34);
		expect(food.servingSizeUnit).toBe("g");
		expect(getFdcNutrientValue(food, NUTRIENT_IDS.CALORIES)).toBeCloseTo(
			470.59,
		);
		expect(getFdcNutrientValue(food, NUTRIENT_IDS.SUGAR)).toBeCloseTo(41.18);
	});

	it("stores custom density when a volume equivalent is provided", () => {
		const food = createCustomFood({
			name: "Custom yogurt",
			servingWeightGrams: 245,
			volumeQuantity: 1,
			volumeUnit: "cup",
			nutrition: {
				calories: 140,
				fat: 4,
				carbs: 8,
				fiber: 0,
				sugar: 7,
				protein: 18,
			},
		});

		expect(food.customDensityGramsPerMilliliter).toBeCloseTo(1.0208);
		expect(food.customDensityConfidence).toBe("known");
	});

	it("persists and searches custom foods", () => {
		const food = createCustomFood({
			name: "Homemade protein crunch",
			servingWeightGrams: 50,
			nutrition: {
				calories: 200,
				fat: 4,
				carbs: 18,
				fiber: 3,
				sugar: 6,
				protein: 20,
			},
		});

		saveCustomFood(food);

		expect(readCustomFoods()).toHaveLength(1);
		expect(searchCustomFoods("protein crunch")[0]?.description).toBe(
			"Homemade protein crunch",
		);
	});

	it("saves one custom food without rewriting the whole cloud list", () => {
		const food = createCustomFood({
			name: "Single row custom food",
			servingWeightGrams: 40,
			nutrition: {
				calories: 100,
				fat: 1,
				carbs: 20,
				fiber: 2,
				sugar: 6,
				protein: 4,
			},
		});

		saveCustomFood(food);

		expect(cloudData.saveCloudCustomFood).toHaveBeenCalledWith(
			expect.objectContaining({ fdcId: food.fdcId }),
		);
		expect(cloudData.writeCloudCustomFoods).not.toHaveBeenCalled();
	});
});
