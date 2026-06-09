import {
	MIX_STORAGE_KEYS,
	DEFAULT_SERVING_GRAMS,
} from "../../../defaults/mixDefaults";
import type { ServingMeasureUnit } from "../../../defaults/servingMeasureDefaults";
import {
	readSmoothieList,
	writeSmoothieList,
} from "$lib/utils/storage/smoothieLists";
import { compactFood } from "$lib/utils/food/foodRecords";
import {
	deleteCloudSavedDrink,
	saveCloudSavedDrink,
	saveCloudMixPreferences,
	writeCloudSavedDrinks,
} from "$lib/utils/storage/supabaseData";
import type { FdcFood } from "$lib/utils/food/types";
import { cacheClearAll } from "$lib/cache";

export const SAVED_DRINKS_STORAGE_KEY = "smoothie-saved-drinks";
export const SAVED_DRINKS_CHANGED_EVENT = "smoothie-saved-drinks-changed";

export type SavedDrinkNutrientOption = {
	id: string | number;
	label: string;
};

export type SavedDrink = {
	id: string;
	name: string;
	createdAt: number;
	foods: FdcFood[];
	selected: (string | number)[];
	options: SavedDrinkNutrientOption[];
	nutrientGoals: Record<number, number>;
	servingGrams: Record<number, number>;
	servingQuantities: Record<number, number>;
	servingUnits: Record<number, ServingMeasureUnit>;
};

export type SavedDrinkInput = Omit<SavedDrink, "id" | "createdAt">;

const dispatchSavedDrinksChanged = () => {
	window.dispatchEvent(new CustomEvent(SAVED_DRINKS_CHANGED_EVENT));
};

const isQuotaExceededError = (error: unknown) => {
	return (
		error instanceof DOMException &&
		(error.name === "QuotaExceededError" ||
			error.name === "NS_ERROR_DOM_QUOTA_REACHED")
	);
};

const normalizeDrink = (value: SavedDrink): SavedDrink => {
	return {
		...value,
		foods: (value.foods ?? []).map(compactFood),
		selected: Array.isArray(value.selected) ? value.selected : [],
		options: Array.isArray(value.options) ? value.options : [],
		nutrientGoals: value.nutrientGoals ?? {},
		servingGrams: value.servingGrams ?? {},
		servingQuantities: value.servingQuantities ?? {},
		servingUnits: value.servingUnits ?? {},
	};
};

export const readSavedDrinks = () => {
	try {
		const raw = localStorage.getItem(SAVED_DRINKS_STORAGE_KEY);
		const drinks = raw ? (JSON.parse(raw) as SavedDrink[]) : [];
		return drinks.map(normalizeDrink);
	} catch {
		return [];
	}
};

const persistSavedDrinksLocally = (drinks: SavedDrink[]) => {
	const serializedDrinks = JSON.stringify(drinks.map(normalizeDrink));

	try {
		localStorage.setItem(SAVED_DRINKS_STORAGE_KEY, serializedDrinks);
		return true;
	} catch (error) {
		if (!isQuotaExceededError(error)) return false;
	}

	cacheClearAll();

	try {
		localStorage.setItem(SAVED_DRINKS_STORAGE_KEY, serializedDrinks);
		return true;
	} catch {
		return false;
	}
};

export const cacheSavedDrinksLocally = (drinks: SavedDrink[]) => {
	persistSavedDrinksLocally(drinks);
};

export const writeSavedDrinks = (
	drinks: SavedDrink[],
	{ syncCloud = true } = {},
) => {
	const normalizedDrinks = drinks.map(normalizeDrink);
	const persistedLocally = persistSavedDrinksLocally(normalizedDrinks);
	if (syncCloud) void writeCloudSavedDrinks(normalizedDrinks);
	dispatchSavedDrinksChanged();
	return persistedLocally;
};

export const addSavedDrink = (input: SavedDrinkInput) => {
	const drink: SavedDrink = {
		...input,
		id: crypto.randomUUID(),
		name: input.name.trim() || "Untitled smoothie",
		createdAt: Date.now(),
		foods: input.foods.map(compactFood),
	};
	const drinks = readSavedDrinks();
	writeSavedDrinks([drink, ...drinks], { syncCloud: false });
	void saveCloudSavedDrink(drink);
	return drink;
};

export const deleteSavedDrink = (id: string) => {
	writeSavedDrinks(readSavedDrinks().filter((drink) => drink.id !== id), {
		syncCloud: false,
	});
	void deleteCloudSavedDrink(id);
};

export const restoreSavedDrinkToMix = (drink: SavedDrink) => {
	const fridge = readSmoothieList(MIX_STORAGE_KEYS.fridge);
	const knownFoodIds = new Set(fridge.map((food) => food.fdcId));
	const missingFoods = drink.foods.filter((food) => !knownFoodIds.has(food.fdcId));

	if (missingFoods.length > 0) {
		writeSmoothieList(MIX_STORAGE_KEYS.fridge, [...fridge, ...missingFoods]);
	}

	const mixState = {
			selected: drink.selected,
			options: drink.options,
			selectedFoodIds: drink.foods.map((food) => food.fdcId),
			servingGrams: drink.servingGrams,
			servingQuantities: Object.fromEntries(
				drink.foods.map((food) => [
					food.fdcId,
					drink.servingQuantities[food.fdcId] ??
						drink.servingGrams[food.fdcId] ??
						DEFAULT_SERVING_GRAMS,
				]),
			),
			servingUnits: Object.fromEntries(
				drink.foods.map((food) => [
					food.fdcId,
					drink.servingUnits[food.fdcId] ?? "g",
				]),
			),
		};

	localStorage.setItem(
		MIX_STORAGE_KEYS.nutrientGoals,
		JSON.stringify(drink.nutrientGoals),
	);
	localStorage.setItem(MIX_STORAGE_KEYS.mixState, JSON.stringify(mixState));
	void saveCloudMixPreferences({
		nutrientGoals: drink.nutrientGoals,
		mixState,
	});
};
