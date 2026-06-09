import {
	DEFAULT_GOAL_BY_UNIT,
	DEFAULT_NUTRIENT_GOALS,
	DEFAULT_SERVING_GRAMS,
	NUTRIENT_POINT_COLORS,
	NUTRIENT_POINT_GOAL_TOLERANCE,
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

export type NutrientFoodSuggestion = {
	food: FdcFood;
	action: "add" | "increase";
	nutrientId: number;
	nutrientLabel: string;
	unit: string;
	amountPer100g: number;
	remainingAmount: number;
	servingGramsToTarget: number;
	currentServingGrams: number;
	nextServingGrams: number;
	targetAddedAmount: number;
	conflicts: NutrientFoodSuggestionConflict[];
	sourceLabel: string;
};

export type NutrientFoodSuggestionConflict = {
	nutrientId: number;
	label: string;
	unit: string;
	amountAdded: number;
	nextTotal: number;
	goal: number;
	reason: "already-over" | "would-exceed";
};

export type NutrientReductionSuggestion = {
	food: FdcFood;
	nutrientId: number;
	nutrientLabel: string;
	unit: string;
	currentServingGrams: number;
	nextServingGrams: number;
	reduceByGrams: number;
	targetReducedAmount: number;
	overageAmount: number;
	percentOfOverageResolved: number;
	conflicts: NutrientReductionSuggestionConflict[];
	sourceLabel: string;
};

export type NutrientReductionSuggestionConflict = {
	nutrientId: number;
	label: string;
	unit: string;
	amountRemoved: number;
	nextTotal: number;
	goal: number;
	reason: "already-under" | "would-drop-below";
};

export const getDefaultNutrientGoal = (nutrient: NutrientMeta) => {
	const id = Number(nutrient.id);
	if (DEFAULT_NUTRIENT_GOALS[id]) return DEFAULT_NUTRIENT_GOALS[id];
	if (nutrient.unit === "g") return DEFAULT_GOAL_BY_UNIT.grams;
	if (nutrient.unit === "kcal") return DEFAULT_GOAL_BY_UNIT.calories;
	return DEFAULT_GOAL_BY_UNIT.fallback;
};

export const getFoodNutrientAmount = (
	food: FdcFood,
	nutrientId: number,
	servingGrams: Record<number, number>,
) => {
	const nutrientValue = getFdcNutrientValue(food, nutrientId);
	if (!nutrientValue) return 0;

	const grams = servingGrams[food.fdcId] ?? DEFAULT_SERVING_GRAMS;
	return (nutrientValue * grams) / DEFAULT_SERVING_GRAMS;
};

export const getNutrientTotal = (
	foods: FdcFood[],
	nutrientId: number,
	servingGrams: Record<number, number>,
) => {
	return foods.reduce(
		(total, food) =>
			total + getFoodNutrientAmount(food, nutrientId, servingGrams),
		0,
	);
};

export const getNutrientContributors = (
	foods: FdcFood[],
	nutrientId: number,
	servingGrams: Record<number, number>,
) => {
	return foods
		.map((food) => ({
			label: food.description,
			amount: getFoodNutrientAmount(food, nutrientId, servingGrams),
			grams: servingGrams[food.fdcId] ?? DEFAULT_SERVING_GRAMS,
		}))
		.filter((contributor) => contributor.amount > 0)
		.sort((a, b) => b.amount - a.amount);
};

export const getNutrientContributionBreakdowns = (
	nutrients: NutrientMeta[],
	foods: FdcFood[],
	servingGrams: Record<number, number>,
	maxContributors = 2,
): NutrientContributionBreakdown[] => {
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
};

export const getNutrientProgress = (
	nutrients: NutrientMeta[],
	foods: FdcFood[],
	nutrientGoals: Record<number, number>,
	servingGrams: Record<number, number>,
) => {
	return nutrients.map((nutrient) => {
		const goal =
			nutrientGoals[Number(nutrient.id)] ?? getDefaultNutrientGoal(nutrient);
		if (goal <= 0) return 0;
		return getNutrientTotal(foods, Number(nutrient.id), servingGrams) / goal;
	});
};

export const getNutrientFoodSuggestions = ({
	nutrients,
	availableFoods,
	selectedFoodIds,
	nutrientGoals,
	servingGrams,
	sourceLabelForFood,
	maxSuggestions = 3,
}: {
	nutrients: NutrientMeta[];
	availableFoods: FdcFood[];
	selectedFoodIds: number[];
	nutrientGoals: Record<number, number>;
	servingGrams: Record<number, number>;
	sourceLabelForFood: (food: FdcFood) => string;
	maxSuggestions?: number;
}) => {
	const selectedFoods = availableFoods.filter((food) =>
		selectedFoodIds.includes(food.fdcId),
	);
	const nutrientStates = nutrients.map((nutrient) => {
		const nutrientId = Number(nutrient.id);
		const goal = nutrientGoals[nutrientId] ?? getDefaultNutrientGoal(nutrient);
		const total = getNutrientTotal(selectedFoods, nutrientId, servingGrams);

		return {
			nutrientId,
			label: nutrient.label ?? String(nutrient.id),
			unit: nutrient.unit ?? "",
			goal,
			total,
			remainingAmount: goal - total,
		};
	});

	const suggestions = nutrientStates
		.flatMap((targetNutrient) => {
			const { nutrientId, goal, remainingAmount } = targetNutrient;

			if (goal <= 0 || remainingAmount <= goal * 0.1) return [];

			return availableFoods.flatMap((food) => {
				const amountPer100g = getFdcNutrientValue(food, nutrientId);
				if (!amountPer100g || amountPer100g <= 0) return [];

				const currentServingGrams = selectedFoodIds.includes(food.fdcId)
					? (servingGrams[food.fdcId] ?? DEFAULT_SERVING_GRAMS)
					: 0;
				const servingGramsToTarget = remainingAmount / (amountPer100g / 100);
				if (!Number.isFinite(servingGramsToTarget) || servingGramsToTarget <= 0) {
					return [];
				}
				const nextServingGrams = currentServingGrams + servingGramsToTarget;

				const conflicts: NutrientFoodSuggestionConflict[] =
					nutrientStates.flatMap(
						(nutrientState): NutrientFoodSuggestionConflict[] => {
							const nutrientAmountPer100g = getFdcNutrientValue(
								food,
								nutrientState.nutrientId,
							);
							const amountAdded =
								(nutrientAmountPer100g * servingGramsToTarget) /
								DEFAULT_SERVING_GRAMS;
							const nextTotal = nutrientState.total + amountAdded;
							const safeGoal =
								nutrientState.goal > 0 ? nutrientState.goal : 1;
							const overGoalLimit =
								safeGoal * (1 + NUTRIENT_POINT_GOAL_TOLERANCE);

							if (amountAdded <= Math.max(safeGoal * 0.01, 0.05)) {
								return [];
							}

							if (nutrientState.nutrientId === nutrientId) return [];

							if (nutrientState.total > overGoalLimit) {
								return [
									{
										nutrientId: nutrientState.nutrientId,
										label: nutrientState.label,
										unit: nutrientState.unit,
										amountAdded,
										nextTotal,
										goal: nutrientState.goal,
										reason: "already-over" as const,
									},
								];
							}

							if (nextTotal > overGoalLimit) {
								return [
									{
										nutrientId: nutrientState.nutrientId,
										label: nutrientState.label,
										unit: nutrientState.unit,
										amountAdded,
										nextTotal,
										goal: nutrientState.goal,
										reason: "would-exceed" as const,
									},
								];
							}

							return [];
						},
					);

				return [
					{
						food,
						action: (currentServingGrams > 0 ? "increase" : "add") as
							| "increase"
							| "add",
						nutrientId,
						nutrientLabel: targetNutrient.label,
						unit: targetNutrient.unit,
						amountPer100g,
						remainingAmount,
						servingGramsToTarget,
						currentServingGrams,
						nextServingGrams,
						targetAddedAmount: remainingAmount,
						conflicts,
						sourceLabel: sourceLabelForFood(food),
					},
				];
			});
		})
		.sort((a, b) => {
			const conflictDifference = a.conflicts.length - b.conflicts.length;
			if (conflictDifference !== 0) return conflictDifference;
			const servingDifference = a.servingGramsToTarget - b.servingGramsToTarget;
			if (Math.abs(servingDifference) > 0.01) return servingDifference;
			return b.amountPer100g - a.amountPer100g;
		});

	const bestSuggestionByFood = new Map<number, NutrientFoodSuggestion>();

	suggestions.forEach((suggestion) => {
		if (!bestSuggestionByFood.has(suggestion.food.fdcId)) {
			bestSuggestionByFood.set(suggestion.food.fdcId, suggestion);
		}
	});

	return Array.from(bestSuggestionByFood.values()).slice(0, maxSuggestions);
};

export const getNutrientReductionSuggestions = ({
	nutrients,
	selectedFoods,
	nutrientGoals,
	servingGrams,
	sourceLabelForFood,
	maxSuggestions = 3,
}: {
	nutrients: NutrientMeta[];
	selectedFoods: FdcFood[];
	nutrientGoals: Record<number, number>;
	servingGrams: Record<number, number>;
	sourceLabelForFood: (food: FdcFood) => string;
	maxSuggestions?: number;
}) => {
	const nutrientStates = nutrients.map((nutrient) => {
		const nutrientId = Number(nutrient.id);
		const goal = nutrientGoals[nutrientId] ?? getDefaultNutrientGoal(nutrient);
		const total = getNutrientTotal(selectedFoods, nutrientId, servingGrams);

		return {
			nutrientId,
			label: nutrient.label ?? String(nutrient.id),
			unit: nutrient.unit ?? "",
			goal,
			total,
			overageAmount: total - goal,
		};
	});

	const suggestions = nutrientStates
		.flatMap((targetNutrient) => {
			const { nutrientId, goal, total, overageAmount } = targetNutrient;
			if (goal <= 0 || total <= goal || overageAmount <= 0) return [];

			return selectedFoods.flatMap((food) => {
				const currentServingGrams =
					servingGrams[food.fdcId] ?? DEFAULT_SERVING_GRAMS;
				const targetAmount = getFoodNutrientAmount(
					food,
					nutrientId,
					servingGrams,
				);

				if (currentServingGrams <= 0 || targetAmount <= 0) return [];

				const targetReducedAmount = Math.min(overageAmount, targetAmount);
				const percentOfOverageResolved =
					(targetReducedAmount / overageAmount) * 100;
				const reduceByGrams =
					targetReducedAmount / (targetAmount / currentServingGrams);
				const nextServingGrams = Math.max(
					0,
					currentServingGrams - reduceByGrams,
				);
				const minimumUsefulReductionAmount = Math.max(goal * 0.02, 0.25);

				if (
					!Number.isFinite(reduceByGrams) ||
					reduceByGrams < 2 ||
					targetReducedAmount < minimumUsefulReductionAmount ||
					percentOfOverageResolved < 10
				) {
					return [];
				}

				const conflicts: NutrientReductionSuggestionConflict[] =
					nutrientStates.flatMap(
						(nutrientState): NutrientReductionSuggestionConflict[] => {
							if (nutrientState.nutrientId === nutrientId) return [];
							if (nutrientState.goal <= 0) return [];

							const currentFoodAmount = getFoodNutrientAmount(
								food,
								nutrientState.nutrientId,
								servingGrams,
							);
							const amountRemoved =
								(currentFoodAmount * reduceByGrams) / currentServingGrams;
							const nextTotal = nutrientState.total - amountRemoved;
							const underGoalLimit =
								nutrientState.goal * (1 - NUTRIENT_POINT_GOAL_TOLERANCE);

							if (
								amountRemoved <=
								Math.max(nutrientState.goal * 0.01, 0.05)
							) {
								return [];
							}

							if (nutrientState.total < underGoalLimit) {
								return [
									{
										nutrientId: nutrientState.nutrientId,
										label: nutrientState.label,
										unit: nutrientState.unit,
										amountRemoved,
										nextTotal,
										goal: nutrientState.goal,
										reason: "already-under" as const,
									},
								];
							}

							if (nextTotal < underGoalLimit) {
								return [
									{
										nutrientId: nutrientState.nutrientId,
										label: nutrientState.label,
										unit: nutrientState.unit,
										amountRemoved,
										nextTotal,
										goal: nutrientState.goal,
										reason: "would-drop-below" as const,
									},
								];
							}

							return [];
						},
					);

				return [
					{
						food,
						nutrientId,
						nutrientLabel: targetNutrient.label,
						unit: targetNutrient.unit,
						currentServingGrams,
						nextServingGrams,
						reduceByGrams,
						targetReducedAmount,
						overageAmount,
						percentOfOverageResolved,
						conflicts,
						sourceLabel: sourceLabelForFood(food),
					},
				];
			});
		})
		.sort((a, b) => {
			const conflictDifference = a.conflicts.length - b.conflicts.length;
			if (conflictDifference !== 0) return conflictDifference;
			const resolvedDifference =
				b.percentOfOverageResolved - a.percentOfOverageResolved;
			if (Math.abs(resolvedDifference) > 0.01) return resolvedDifference;
			return a.reduceByGrams - b.reduceByGrams;
		});

	const bestSuggestionByFood = new Map<number, NutrientReductionSuggestion>();

	suggestions.forEach((suggestion) => {
		if (!bestSuggestionByFood.has(suggestion.food.fdcId)) {
			bestSuggestionByFood.set(suggestion.food.fdcId, suggestion);
		}
	});

	return Array.from(bestSuggestionByFood.values()).slice(0, maxSuggestions);
};

export const getNutrientChartMetrics = (
	nutrients: NutrientMeta[],
	foods: FdcFood[],
	nutrientGoals: Record<number, number>,
	servingGrams: Record<number, number>,
): NutrientChartMetric[] => {
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
};

export const getChartReferenceRatio = (metrics: NutrientChartMetric[]) => {
	return Math.max(1, ...metrics.map((metric) => metric.goalRatio));
};

export const getChartValues = (metrics: NutrientChartMetric[]) => {
	const referenceRatio = getChartReferenceRatio(metrics);
	return metrics.map((metric) =>
		clampChartValue(metric.totalRatio / referenceRatio),
	);
};

export const getGoalValues = (metrics: NutrientChartMetric[]) => {
	const referenceRatio = getChartReferenceRatio(metrics);
	return metrics.map((metric) =>
		clampChartValue(metric.goalRatio / referenceRatio),
	);
};

export const getChartColors = (progress: number) => {
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
};

export const getPointColors = (progressValues: number[]) => {
	return progressValues.map((progress) => {
		if (progress > 1 + NUTRIENT_POINT_GOAL_TOLERANCE) {
			return NUTRIENT_POINT_COLORS.overGoal;
		}

		if (progress >= 1 - NUTRIENT_POINT_GOAL_TOLERANCE) {
			return NUTRIENT_POINT_COLORS.nearGoal;
		}

		return NUTRIENT_POINT_COLORS.belowGoal;
	});
};

export const clampChartValue = (value: number) => {
	if (!Number.isFinite(value)) return 0;
	return Math.max(0, Math.min(value, 1));
};
