import { beforeEach, describe, expect, it } from "vitest";
import { MIX_STORAGE_KEYS } from "../../../../src/defaults/mixDefaults";
import {
	addSavedDrink,
	clearLoadedSavedDrink,
	readLoadedSavedDrink,
	readSavedDrinks,
	restoreSavedDrinkToMix,
	updateSavedDrink,
} from "$lib/utils/storage/savedDrinks";
import type { FdcFood } from "$lib/utils/food/types";

const food = {
	fdcId: 1,
	description: "Bananas, raw",
	foodNutrients: [],
} satisfies FdcFood;

describe("saved drinks", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("saves drink snapshots", () => {
		addSavedDrink({
			name: "Post-workout",
			foods: [food],
			selected: [1008],
			options: [{ id: 1008, label: "Calories" }],
			nutrientGoals: { 1008: 350 },
			servingGrams: { 1: 100 },
			servingQuantities: { 1: 1 },
			servingUnits: { 1: "g" },
		});

		expect(readSavedDrinks()[0]).toMatchObject({
			name: "Post-workout",
			foods: [{ fdcId: 1, description: "Bananas, raw" }],
		});
	});

	it("restores a saved drink to mix state", () => {
		const drink = addSavedDrink({
			name: "High fiber",
			foods: [food],
			selected: [1008],
			options: [{ id: 1008, label: "Calories" }],
			nutrientGoals: { 1008: 350 },
			servingGrams: { 1: 100 },
			servingQuantities: { 1: 1 },
			servingUnits: { 1: "g" },
		});

		restoreSavedDrinkToMix(drink);

		expect(JSON.parse(localStorage.getItem(MIX_STORAGE_KEYS.mixState) ?? "{}"))
			.toMatchObject({
				selectedFoodIds: [1],
				selected: [1008],
			});
		expect(readLoadedSavedDrink()).toEqual({
			id: drink.id,
			name: "High fiber",
			isDirty: false,
		});
	});

	it("overwrites an existing saved drink without creating a duplicate", () => {
		const drink = addSavedDrink({
			name: "Original",
			foods: [food],
			selected: [1008],
			options: [{ id: 1008, label: "Calories" }],
			nutrientGoals: { 1008: 350 },
			servingGrams: { 1: 100 },
			servingQuantities: { 1: 100 },
			servingUnits: { 1: "g" },
		});

		const updated = updateSavedDrink(drink.id, {
			name: "Updated",
			foods: [food],
			selected: [1008],
			options: [{ id: 1008, label: "Calories" }],
			nutrientGoals: { 1008: 450 },
			servingGrams: { 1: 125 },
			servingQuantities: { 1: 125 },
			servingUnits: { 1: "g" },
		});

		expect(updated).toMatchObject({
			id: drink.id,
			name: "Updated",
			createdAt: drink.createdAt,
			nutrientGoals: { 1008: 450 },
		});
		expect(readSavedDrinks()).toHaveLength(1);
	});

	it("clears the loaded saved drink context", () => {
		const drink = addSavedDrink({
			name: "Draft",
			foods: [food],
			selected: [1008],
			options: [{ id: 1008, label: "Calories" }],
			nutrientGoals: { 1008: 350 },
			servingGrams: { 1: 100 },
			servingQuantities: { 1: 100 },
			servingUnits: { 1: "g" },
		});

		restoreSavedDrinkToMix(drink);
		clearLoadedSavedDrink();

		expect(readLoadedSavedDrink()).toBeNull();
	});
});
