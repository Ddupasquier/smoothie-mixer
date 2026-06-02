import { describe, expect, it } from "vitest";
import {
	convertServingAmount,
	convertServingToGrams,
	getServingMeasureDimension,
} from "$lib/utils/servingAmount";
import type { FdcFood } from "$lib/utils/types";

const sunflowerOil = {
	fdcId: 1,
	description: "Sunflower oil",
	foodCategory: "Vegetable & Cooking Oils",
	foodNutrients: [],
} satisfies FdcFood;

const twoPercentMilk = {
	fdcId: 2,
	description: "2% milk",
	foodCategory: "Milk",
	foodNutrients: [],
} satisfies FdcFood;

const unknownFood = {
	fdcId: 3,
	description: "Mystery ingredient",
	foodNutrients: [],
} satisfies FdcFood;

describe("serving amount conversion", () => {
	it("keeps weight conversion exact", () => {
		expect(getServingMeasureDimension("oz")).toBe("weight");
		expect(convertServingToGrams(2, "oz")).toBeCloseTo(56.7);
	});

	it("converts oil volume with a narrow density range", () => {
		const conversion = convertServingAmount(1, "tbsp", sunflowerOil);

		expect(conversion.dimension).toBe("volume");
		expect(conversion.grams).toBeCloseTo(13.46, 1);
		expect(conversion.density?.label).toBe("cooking oil");
		expect(conversion.range?.minGrams).toBeCloseTo(13.06, 1);
		expect(conversion.range?.maxGrams).toBeCloseTo(13.87, 1);
		expect(conversion.warning).toContain("±3%");
	});

	it("converts milk cups using milk density", () => {
		const conversion = convertServingAmount(1, "cup", twoPercentMilk);

		expect(conversion.grams).toBeCloseTo(247.2);
		expect(conversion.density?.label).toBe("milk");
		expect(conversion.warning).toContain("milk density");
	});

	it("uses a rough warning for unknown volume densities", () => {
		const conversion = convertServingAmount(1, "cup", unknownFood);

		expect(conversion.grams).toBeCloseTo(240);
		expect(conversion.density?.confidence).toBe("rough");
		expect(conversion.warning).toContain("±50%");
	});
});
