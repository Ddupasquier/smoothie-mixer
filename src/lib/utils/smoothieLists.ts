import { MIX_STORAGE_KEYS } from "../../defaults/mixDefaults";
import { compactFood } from "$lib/utils/foodRecords";
import {
	removeCloudSmoothieListItem,
	upsertCloudSmoothieListItem,
	writeCloudSmoothieList,
} from "$lib/utils/supabaseData";
import type { FdcFood } from "$lib/utils/types";
import { cacheClearAll } from "$lib/cache";

export const SMOOTHIE_LISTS_CHANGED_EVENT = "smoothie-lists-changed";

export type SmoothieListKey =
	| typeof MIX_STORAGE_KEYS.fridge
	| typeof MIX_STORAGE_KEYS.shoppingList;

const dispatchListsChanged = () => {
	window.dispatchEvent(new CustomEvent(SMOOTHIE_LISTS_CHANGED_EVENT));
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

export const cacheSmoothieListLocally = (key: SmoothieListKey, list: FdcFood[]) => {
	try {
		localStorage.setItem(key, JSON.stringify(list.map(compactFood)));
	} catch {
		// ignore cache write failures; localStorage is only a fallback cache here
	}
};

export const writeSmoothieList = (key: SmoothieListKey, list: FdcFood[]) => {
	const compactList = list.map(compactFood);

	try {
		localStorage.setItem(key, JSON.stringify(compactList));
		void writeCloudSmoothieList(key, compactList);
		dispatchListsChanged();
		return true;
	} catch (error) {
		if (!isQuotaExceededError(error)) {
			return false;
		}

		cacheClearAll();

		try {
			localStorage.setItem(key, JSON.stringify(compactList));
			void writeCloudSmoothieList(key, compactList);
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

	const foodRecord = compactFood(food);
	const added = writeSmoothieList(key, [...list, foodRecord]);
	if (added) void upsertCloudSmoothieListItem(key, foodRecord);
	return added;
};

export const removeFoodFromSmoothieList = (key: SmoothieListKey, foodId: number) => {
	const list = readSmoothieList(key).filter((item) => item.fdcId !== foodId);
	const removed = writeSmoothieList(key, list);
	if (removed) void removeCloudSmoothieListItem(key, foodId);
	return removed;
};
