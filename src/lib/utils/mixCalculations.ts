import {
	DEFAULT_GOAL_BY_UNIT,
	DEFAULT_NUTRIENT_GOALS,
	DEFAULT_SERVING_GRAMS,
	NUTRIENT_PROGRESS_COLORS,
	NUTRIENT_PROGRESS_THRESHOLDS,
} from "../../defaults/mixDefaults";
import { getFdcNutrientValue } from "./fdcNutrients";
import type { FdcFood } from "./types";

export type NutrientMeta = {
	id: string | number;
	label?: string;
	unit?: string;
};

export type NutrientContributor = {
	label: string;
	amount: number;
	grams: number;
};

export type NutrientContribution = NutrientContributor & {
	percentOfTotal: number;
};

export type NutrientContributionBreakdown = {
	nutrientId: number;
	label: string;
	unit: string;
	total: number;
	contributors: NutrientContribution[];
};

export type NutrientChartMetric = {
	goalRatio: number;
	totalRatio: number;
};

export function getDefaultNutrientGoal(nutrient: NutrientMeta) {
	const id = Number(nutrient.id);
	if (DEFAULT_NUTRIENT_GOALS[id]) return DEFAULT_NUTRIENT_GOALS[id];
	if (nutrient.unit === "g") return DEFAULT_GOAL_BY_UNIT.grams;
	if (nutrient.unit === "kcal") return DEFAULT_GOAL_BY_UNIT.calories;
	return DEFAULT_GOAL_BY_UNIT.fallback;
}

export function getFoodNutrientAmount(
	food: FdcFood,
	nutrientId: number,
	servingGrams: Record<number, number>,
) {
	const nutrientValue = getFdcNutrientValue(food, nutrientId);
	if (!nutrientValue) return 0;

	const grams = servingGrams[food.fdcId] ?? DEFAULT_SERVING_GRAMS;
	return (nutrientValue * grams) / DEFAULT_SERVING_GRAMS;
}

export function getNutrientTotal(
	foods: FdcFood[],
	nutrientId: number,
	servingGrams: Record<number, number>,
) {
	return foods.reduce(
		(total, food) =>
			total + getFoodNutrientAmount(food, nutrientId, servingGrams),
		0,
	);
}

export function getNutrientContributors(
	foods: FdcFood[],
	nutrientId: number,
	servingGrams: Record<number, number>,
) {
	return foods
		.map((food) => ({
			label: food.description,
			amount: getFoodNutrientAmount(food, nutrientId, servingGrams),
			grams: servingGrams[food.fdcId] ?? DEFAULT_SERVING_GRAMS,
		}))
		.filter((contributor) => contributor.amount > 0)
		.sort((a, b) => b.amount - a.amount);
}

export function getNutrientContributionBreakdowns(
	nutrients: NutrientMeta[],
	foods: FdcFood[],
	servingGrams: Record<number, number>,
	maxContributors = 2,
): NutrientContributionBreakdown[] {
	return nutrients.flatMap((nutrient) => {
		const nutrientId = Number(nutrient.id);
		const contributors = getNutrientContributors(
			foods,
			nutrientId,
			servingGrams,
		);
		const total = contributors.reduce(
			(sum, contributor) => sum + contributor.amount,
			0,
		);

		if (total <= 0) return [];

		return [
			{
				nutrientId,
				label: nutrient.label ?? String(nutrient.id),
				unit: nutrient.unit ?? "",
				total,
				contributors: contributors
					.slice(0, maxContributors)
					.map((contributor) => ({
						...contributor,
						percentOfTotal: (contributor.amount / total) * 100,
					})),
			},
		];
	});
}

export function getNutrientProgress(
	nutrients: NutrientMeta[],
	foods: FdcFood[],
	nutrientGoals: Record<number, number>,
	servingGrams: Record<number, number>,
) {
	return nutrients.map((nutrient) => {
		const goal =
			nutrientGoals[Number(nutrient.id)] ?? getDefaultNutrientGoal(nutrient);
		if (goal <= 0) return 0;
		return getNutrientTotal(foods, Number(nutrient.id), servingGrams) / goal;
	});
}

export function getNutrientChartMetrics(
	nutrients: NutrientMeta[],
	foods: FdcFood[],
	nutrientGoals: Record<number, number>,
	servingGrams: Record<number, number>,
): NutrientChartMetric[] {
	return nutrients.map((nutrient) => {
		const nutrientId = Number(nutrient.id);
		const baselineGoal = getDefaultNutrientGoal(nutrient);
		const safeBaselineGoal = baselineGoal > 0 ? baselineGoal : 1;
		const goal = nutrientGoals[nutrientId] ?? baselineGoal;
		const total = getNutrientTotal(foods, nutrientId, servingGrams);

		return {
			goalRatio: goal / safeBaselineGoal,
			totalRatio: total / safeBaselineGoal,
		};
	});
}

export function getChartReferenceRatio(metrics: NutrientChartMetric[]) {
	return Math.max(1, ...metrics.map((metric) => metric.goalRatio));
}

export function getChartValues(metrics: NutrientChartMetric[]) {
	const referenceRatio = getChartReferenceRatio(metrics);
	return metrics.map((metric) =>
		clampChartValue(metric.totalRatio / referenceRatio),
	);
}

export function getGoalValues(metrics: NutrientChartMetric[]) {
	const referenceRatio = getChartReferenceRatio(metrics);
	return metrics.map((metric) =>
		clampChartValue(metric.goalRatio / referenceRatio),
	);
}

export function getChartColors(progress: number) {
	if (progress <= NUTRIENT_PROGRESS_THRESHOLDS.atGoal) {
		return NUTRIENT_PROGRESS_COLORS.atGoal;
	}

	if (progress <= NUTRIENT_PROGRESS_THRESHOLDS.barelyOver) {
		return NUTRIENT_PROGRESS_COLORS.barelyOver;
	}

	if (progress <= NUTRIENT_PROGRESS_THRESHOLDS.midwayOver) {
		return NUTRIENT_PROGRESS_COLORS.midwayOver;
	}

	return NUTRIENT_PROGRESS_COLORS.wayOver;
}

export function clampChartValue(value: number) {
	if (!Number.isFinite(value)) return 0;
	return Math.max(0, Math.min(value, 1));
}
