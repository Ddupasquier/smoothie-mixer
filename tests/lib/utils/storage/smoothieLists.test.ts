import { beforeEach, describe, expect, it, vi } from "vitest";

const cloudData = vi.hoisted(() => ({
	removeCloudSmoothieListItem: vi.fn(),
	upsertCloudSmoothieListItem: vi.fn(),
	writeCloudSmoothieList: vi.fn(),
}));

vi.mock("$lib/utils/storage/supabaseData", () => cloudData);

import {
	addFoodToSmoothieList,
	readSmoothieList,
	removeFoodFromSmoothieList,
	writeSmoothieList,
} from "$lib/utils/storage/smoothieLists";
import type { FdcFood } from "$lib/utils/food/types";
import { MIX_STORAGE_KEYS } from "../../../../src/defaults/mixDefaults";

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
		vi.clearAllMocks();
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

	it("adds one list item without rewriting the whole cloud list", () => {
		expect(addFoodToSmoothieList(MIX_STORAGE_KEYS.fridge, food)).toBe(true);

		expect(readSmoothieList(MIX_STORAGE_KEYS.fridge)).toHaveLength(1);
		expect(cloudData.upsertCloudSmoothieListItem).toHaveBeenCalledWith(
			MIX_STORAGE_KEYS.fridge,
			expect.objectContaining({ fdcId: food.fdcId }),
		);
		expect(cloudData.writeCloudSmoothieList).not.toHaveBeenCalled();
	});

	it("removes one list item without rewriting the whole cloud list", () => {
		writeSmoothieList(MIX_STORAGE_KEYS.fridge, [food]);
		vi.clearAllMocks();

		expect(removeFoodFromSmoothieList(MIX_STORAGE_KEYS.fridge, food.fdcId)).toBe(
			true,
		);

		expect(readSmoothieList(MIX_STORAGE_KEYS.fridge)).toHaveLength(0);
		expect(cloudData.removeCloudSmoothieListItem).toHaveBeenCalledWith(
			MIX_STORAGE_KEYS.fridge,
			food.fdcId,
		);
		expect(cloudData.writeCloudSmoothieList).not.toHaveBeenCalled();
	});
});
