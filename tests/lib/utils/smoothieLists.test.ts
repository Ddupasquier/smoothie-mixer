import { beforeEach, describe, expect, it } from "vitest";
import {
	readSmoothieList,
	writeSmoothieList,
} from "$lib/utils/smoothieLists";
import type { FdcFood } from "$lib/utils/types";
import { MIX_STORAGE_KEYS } from "../../../src/defaults/mixDefaults";

const food = {
	fdcId: 1,
	description: "Olive oil",
	brandOwner: "Test Brand",
	foodCategory: "Oil",
	dataType: "Foundation",
	servingSize: 1,
	servingSizeUnit: "tbsp",
	foodNutrients: [
		{
			nutrientId: 1085,
			nutrientName: "Total fat (NLEA)",
			nutrientNumber: "298",
			unitName: "G",
			value: 100,
		},
	],
} satisfies FdcFood;

describe("smoothie lists", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("stores compact food records with serving metadata", () => {
		expect(writeSmoothieList(MIX_STORAGE_KEYS.fridge, [food])).toBe(true);

		expect(readSmoothieList(MIX_STORAGE_KEYS.fridge)[0]).toMatchObject({
			fdcId: 1,
			description: "Olive oil",
			dataType: "Foundation",
			servingSize: 1,
			servingSizeUnit: "tbsp",
			foodNutrients: [
				{
					nutrientId: 1085,
					nutrientNumber: "298",
					value: 100,
				},
			],
		});
	});
});
