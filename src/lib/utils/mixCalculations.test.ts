import { describe, expect, it } from "vitest";
import {
	getChartValues,
	getGoalValues,
	getNutrientChartMetrics,
	getNutrientContributors,
	getNutrientProgress,
	getNutrientTotal,
} from "$lib/utils/mixCalculations";
import { NUTRIENT_IDS, type FdcFood } from "$lib/utils/types";

const sunflowerOil = {
	fdcId: 1,
	description: "Sunflower oil",
	foodNutrients: [
		{
			nutrientId: 1085,
			nutrientName: "Total fat (NLEA)",
			nutrientNumber: "298",
			unitName: "G",
			value: 93.2,
		},
	],
} satisfies FdcFood;

const milk = {
	fdcId: 2,
	description: "2% milk",
	foodNutrients: [
		{
			nutrientId: NUTRIENT_IDS.PROTEIN,
			nutrientName: "Protein",
			nutrientNumber: "203",
			unitName: "G",
			value: 3.33,
		},
	],
} satisfies FdcFood;

describe("mix calculations", () => {
	it("uses fallback nutrient mappings for totals", () => {
		expect(
			getNutrientTotal([sunflowerOil], NUTRIENT_IDS.FAT, {
				1: 50,
			}),
		).toBeCloseTo(46.6);
	});

	it("sorts overage contributors by amount", () => {
		const contributors = getNutrientContributors(
			[sunflowerOil, milk],
			NUTRIENT_IDS.FAT,
			{ 1: 50, 2: 100 },
		);

		expect(contributors[0]).toMatchObject({
			label: "Sunflower oil",
			amount: 46.6,
			grams: 50,
		});
	});

	it("calculates progress and chart values from goals", () => {
		const nutrients = [
			{ id: NUTRIENT_IDS.FAT, label: "Total Fat", unit: "g" },
			{ id: NUTRIENT_IDS.PROTEIN, label: "Protein", unit: "g" },
		];
		const foods = [sunflowerOil, milk];
		const servingGrams = { 1: 50, 2: 100 };
		const goals = {
			[NUTRIENT_IDS.FAT]: 25,
			[NUTRIENT_IDS.PROTEIN]: 10,
		};

		const progress = getNutrientProgress(
			nutrients,
			foods,
			goals,
			servingGrams,
		);
		const metrics = getNutrientChartMetrics(
			nutrients,
			foods,
			goals,
			servingGrams,
		);

		expect(progress[0]).toBeCloseTo(1.864);
		expect(progress[1]).toBeCloseTo(0.333);
		expect(Math.max(...getGoalValues(metrics))).toBe(1);
		expect(getChartValues(metrics)[0]).toBeGreaterThan(
			getChartValues(metrics)[1],
		);
	});
});
