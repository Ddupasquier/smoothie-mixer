import { MIX_STORAGE_KEYS } from "../../defaults/mixDefaults";
import type { FdcFood } from "$lib/utils/types";
import { cacheClearAll } from "$lib/cache";

export const SMOOTHIE_LISTS_CHANGED_EVENT = "smoothie-lists-changed";

export type SmoothieListKey =
	| typeof MIX_STORAGE_KEYS.fridge
	| typeof MIX_STORAGE_KEYS.shoppingList;

const dispatchListsChanged = () => {
	window.dispatchEvent(new CustomEvent(SMOOTHIE_LISTS_CHANGED_EVENT));
};

const compactFood = (food: FdcFood): FdcFood => {
	return {
		fdcId: food.fdcId,
		description: food.description,
		brandOwner: food.brandOwner,
		foodCategory: food.foodCategory,
		dataType: food.dataType,
		servingSize: food.servingSize,
		servingSizeUnit: food.servingSizeUnit,
		foodNutrients: food.foodNutrients.map((nutrient) => ({
			nutrientId: nutrient.nutrientId,
			nutrientName: nutrient.nutrientName,
			nutrientNumber: nutrient.nutrientNumber,
			unitName: nutrient.unitName,
			value: nutrient.value,
		})),
	};
};

const isQuotaExceededError = (error: unknown) => {
	return (
		error instanceof DOMException &&
		(error.name === "QuotaExceededError" ||
			error.name === "NS_ERROR_DOM_QUOTA_REACHED")
	);
};

export const readSmoothieList = (key: SmoothieListKey) => {
	try {
		const raw = localStorage.getItem(key);
		const list = raw ? (JSON.parse(raw) as FdcFood[]) : [];
		return list.map(compactFood);
	} catch {
		return [];
	}
};

export const writeSmoothieList = (key: SmoothieListKey, list: FdcFood[]) => {
	const compactList = list.map(compactFood);

	try {
		localStorage.setItem(key, JSON.stringify(compactList));
		dispatchListsChanged();
		return true;
	} catch (error) {
		if (!isQuotaExceededError(error)) {
			return false;
		}

		cacheClearAll();

		try {
			localStorage.setItem(key, JSON.stringify(compactList));
			dispatchListsChanged();
			return true;
		} catch {
			return false;
		}
	}
};

export const addFoodToSmoothieList = (key: SmoothieListKey, food: FdcFood) => {
	const list = readSmoothieList(key);
	if (list.some((item) => item.fdcId === food.fdcId)) {
		return false;
	}

	return writeSmoothieList(key, [...list, compactFood(food)]);
};

export const removeFoodFromSmoothieList = (key: SmoothieListKey, foodId: number) => {
	const list = readSmoothieList(key).filter((item) => item.fdcId !== foodId);
	return writeSmoothieList(key, list);
};
