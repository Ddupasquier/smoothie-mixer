import { NUTRIENT_IDS, type FdcFood, type FdcNutrient } from "$lib/utils/types";

export type FdcNutrientSource = "exact" | "fallback" | "derived" | "missing";

export type ResolvedFdcNutrient = {
	nutrient: FdcNutrient | null;
	value: number;
	source: FdcNutrientSource;
};

const FALLBACK_NUTRIENT_IDS: Record<number, number[]> = {
	[NUTRIENT_IDS.FAT]: [1085],
};

const FALLBACK_NUTRIENT_NUMBERS: Record<number, string[]> = {
	[NUTRIENT_IDS.CALORIES]: ["208"],
	[NUTRIENT_IDS.PROTEIN]: ["203"],
	[NUTRIENT_IDS.FAT]: ["204", "298"],
	[NUTRIENT_IDS.CARBS]: ["205"],
	[NUTRIENT_IDS.FIBER]: ["291"],
	[NUTRIENT_IDS.SUGAR]: ["269"],
};

export function findFdcNutrient(food: FdcFood, nutrientId: number) {
	return food.foodNutrients.find((nutrient) =>
		isFdcNutrientMatch(nutrient, nutrientId),
	);
}

export function getFdcNutrientValue(food: FdcFood, nutrientId: number) {
	return resolveFdcNutrient(food, nutrientId).value;
}

export function resolveFdcNutrient(
	food: FdcFood,
	nutrientId: number,
): ResolvedFdcNutrient {
	const exact = food.foodNutrients.find(
		(nutrient) => Number(nutrient.nutrientId) === nutrientId,
	);

	if (exact) {
		return { nutrient: exact, value: exact.value, source: "exact" };
	}

	const fallback = food.foodNutrients.find((nutrient) =>
		matchesFallbackNutrient(nutrient, nutrientId),
	);

	if (fallback) {
		return {
			nutrient: fallback,
			value: fallback.value,
			source: "fallback",
		};
	}

	if (nutrientId === NUTRIENT_IDS.CALORIES) {
		const calories = deriveCalories(food);

		if (calories > 0) {
			return {
				nutrient: null,
				value: calories,
				source: "derived",
			};
		}
	}

	return { nutrient: null, value: 0, source: "missing" };
}

export function isFdcNutrientMatch(nutrient: FdcNutrient, nutrientId: number) {
	if (Number(nutrient.nutrientId) === nutrientId) return true;

	return matchesFallbackNutrient(nutrient, nutrientId);
}

function matchesFallbackNutrient(nutrient: FdcNutrient, nutrientId: number) {
	const fallbackIds = FALLBACK_NUTRIENT_IDS[nutrientId] ?? [];
	if (fallbackIds.includes(Number(nutrient.nutrientId))) return true;

	const fallbackNumbers = FALLBACK_NUTRIENT_NUMBERS[nutrientId] ?? [];
	return fallbackNumbers.includes(String(nutrient.nutrientNumber));
}

function deriveCalories(food: FdcFood) {
	const fat = getMacroValue(food, NUTRIENT_IDS.FAT);
	const carbs = getMacroValue(food, NUTRIENT_IDS.CARBS);
	const protein = getMacroValue(food, NUTRIENT_IDS.PROTEIN);

	if (fat === 0 && carbs === 0 && protein === 0) return 0;

	return fat * 9 + carbs * 4 + protein * 4;
}

function getMacroValue(food: FdcFood, nutrientId: number) {
	const nutrient = findFdcNutrient(food, nutrientId);
	return nutrient?.value ?? 0;
}
