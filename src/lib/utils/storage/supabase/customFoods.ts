import { getSupabaseBrowserClient } from "$lib/supabase/client";
import { compactFood, uniqueFoodsById } from "$lib/utils/food/foodRecords";
import type { FdcFood } from "$lib/utils/food/types";
import { getCurrentUserId, toJson } from "./shared";

export const readCloudCustomFoods = async () => {
	const userId = await getCurrentUserId();
	if (!userId) return null;
	const supabase = getSupabaseBrowserClient();
	if (!supabase) return null;

	const { data, error } = await supabase
		.from("custom_foods")
		.select("food")
		.eq("user_id", userId)
		.order("created_at", { ascending: false });

	if (error) return null;
	return data.map((row) => compactFood(row.food as unknown as FdcFood));
};

export const writeCloudCustomFoods = async (foods: FdcFood[]) => {
	const userId = await getCurrentUserId();
	if (!userId) return false;
	const supabase = getSupabaseBrowserClient();
	if (!supabase) return false;

	if (foods.length === 0) return true;

	const { error } = await supabase.from("custom_foods").upsert(
		uniqueFoodsById(foods).map((food) => ({
			user_id: userId,
			fdc_id: food.fdcId,
			food: toJson(compactFood(food)),
		})),
		{ onConflict: "user_id,fdc_id" },
	);

	return !error;
};

export const saveCloudCustomFood = async (food: FdcFood) => {
	const userId = await getCurrentUserId();
	if (!userId) return false;
	const supabase = getSupabaseBrowserClient();
	if (!supabase) return false;

	const { error } = await supabase.from("custom_foods").upsert(
		{
			user_id: userId,
			fdc_id: food.fdcId,
			food: toJson(compactFood(food)),
		},
		{ onConflict: "user_id,fdc_id" },
	);

	return !error;
};

export const reconcileCloudCustomFoods = async (localFoods: FdcFood[]) => {
	const cloudFoods = await readCloudCustomFoods();
	if (!cloudFoods) return localFoods;
	return cloudFoods;
};
