import { describe, expect, it } from "vitest";
import {
	findFdcNutrient,
	getFdcNutrientValue,
} from "$lib/utils/food/fdcNutrients";
import { NUTRIENT_IDS, type FdcFood } from "$lib/utils/food/types";

const sunflowerOilSearchResult = {
	fdcId: 1750349,
	description: "Oil, sunflower",
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

describe("FDC nutrient resolver", () => {
	it("maps oil Total fat (NLEA) to the app Total Fat vital", () => {
		expect(findFdcNutrient(sunflowerOilSearchResult, NUTRIENT_IDS.FAT))
			.toMatchObject({
				nutrientId: 1085,
				value: 93.2,
			});
	});

	it("derives calories from macro values when FDC omits calories", () => {
		expect(
			getFdcNutrientValue(sunflowerOilSearchResult, NUTRIENT_IDS.CALORIES),
		).toBeCloseTo(838.8);
	});
});
