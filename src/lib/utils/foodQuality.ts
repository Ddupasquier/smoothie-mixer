import { resolveFdcNutrient, type FdcNutrientSource } from "./fdcNutrients";
import { NUTRIENT_IDS, type FdcFood } from "./types";

const VITAL_NUTRIENTS = [
	NUTRIENT_IDS.CALORIES,
	NUTRIENT_IDS.FAT,
	NUTRIENT_IDS.CARBS,
	NUTRIENT_IDS.FIBER,
	NUTRIENT_IDS.SUGAR,
	NUTRIENT_IDS.PROTEIN,
];

export type FoodQuality = {
	label: string;
	symbol: string;
	title: string;
	score: number;
	completeCount: number;
	missingCount: number;
	sourceCounts: Record<FdcNutrientSource, number>;
};

export function getFoodQuality(food: FdcFood): FoodQuality {
	const sourceCounts: Record<FdcNutrientSource, number> = {
		exact: 0,
		fallback: 0,
		derived: 0,
		missing: 0,
	};

	for (const nutrientId of VITAL_NUTRIENTS) {
		const source = resolveFdcNutrient(food, nutrientId).source;
		sourceCounts[source] += 1;
	}

	const missingCount = sourceCounts.missing;
	const completeCount = VITAL_NUTRIENTS.length - missingCount;
	const score =
		sourceCounts.exact * 3 + sourceCounts.fallback * 2 + sourceCounts.derived;

	if (missingCount === 0 && sourceCounts.fallback === 0 && sourceCounts.derived === 0) {
		return {
			label: "Complete",
			symbol: "✅",
			title: "All vital nutrients are present from exact FDC fields.",
			score,
			completeCount,
			missingCount,
			sourceCounts,
		};
	}

	if (missingCount === 0) {
		return {
			label: "Resolved",
			symbol: "🧩",
			title:
				"All vital nutrients are available, with some values mapped or derived.",
			score,
			completeCount,
			missingCount,
			sourceCounts,
		};
	}

	if (completeCount >= 4) {
		return {
			label: "Partial",
			symbol: "⚠️",
			title: `${completeCount}/${VITAL_NUTRIENTS.length} vital nutrients are available.`,
			score,
			completeCount,
			missingCount,
			sourceCounts,
		};
	}

	return {
		label: "Limited",
		symbol: "ℹ️",
		title: `${completeCount}/${VITAL_NUTRIENTS.length} vital nutrients are available. Some graph values may be incomplete.`,
		score,
		completeCount,
		missingCount,
		sourceCounts,
	};
}

export function compareFoodQuality(a: FdcFood, b: FdcFood) {
	const qualityA = getFoodQuality(a);
	const qualityB = getFoodQuality(b);
	return qualityB.score - qualityA.score;
}
