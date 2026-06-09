import { MIX_STORAGE_KEYS } from "../../defaults/mixDefaults";
import { getSupabaseBrowserClient } from "$lib/supabase/client";
import { compactFood } from "$lib/utils/foodRecords";
import type { SavedDrink } from "$lib/utils/savedDrinks";
import type { FdcFood } from "$lib/utils/types";
import type { Json } from "$lib/types/database.types";
import type { SmoothieListKey } from "$lib/utils/smoothieLists";

type CloudListType = "fridge" | "shopping";

export type CloudMixPreferences = {
	nutrientGoals?: Record<number, number>;
	mixState?: Record<string, unknown>;
};

const getCurrentUserId = async () => {
	const supabase = getSupabaseBrowserClient();
	if (!supabase) return null;

	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user) return null;
	return user.id;
};

const toJson = (value: unknown): Json => {
	return JSON.parse(JSON.stringify(value)) as Json;
};

const getCloudListType = (key: SmoothieListKey): CloudListType => {
	return key === MIX_STORAGE_KEYS.fridge ? "fridge" : "shopping";
};

const getNumberRecord = (value: Json): Record<number, number> => {
	if (!value || typeof value !== "object" || Array.isArray(value)) return {};

	return Object.fromEntries(
		Object.entries(value)
			.map(([key, item]) => [Number(key), Number(item)])
			.filter(([key, item]) => Number.isFinite(key) && Number.isFinite(item)),
	);
};

const getObjectRecord = (value: Json): Record<string, unknown> => {
	if (!value || typeof value !== "object" || Array.isArray(value)) return {};
	return value as Record<string, unknown>;
};

export const readCloudSmoothieList = async (key: SmoothieListKey) => {
	const userId = await getCurrentUserId();
	if (!userId) return null;
	const supabase = getSupabaseBrowserClient();
	if (!supabase) return null;

	const { data, error } = await supabase
		.from("user_food_list_items")
		.select("food")
		.eq("user_id", userId)
		.eq("list_type", getCloudListType(key))
		.order("created_at", { ascending: true });

	if (error) return null;
	return data.map((row) => compactFood(row.food as unknown as FdcFood));
};

export const writeCloudSmoothieList = async (
	key: SmoothieListKey,
	foods: FdcFood[],
) => {
	const userId = await getCurrentUserId();
	if (!userId) return false;
	const supabase = getSupabaseBrowserClient();
	if (!supabase) return false;

	const listType = getCloudListType(key);
	const { error: deleteError } = await supabase
		.from("user_food_list_items")
		.delete()
		.eq("user_id", userId)
		.eq("list_type", listType);

	if (deleteError) return false;
	if (foods.length === 0) return true;

	const { error } = await supabase.from("user_food_list_items").insert(
		foods.map((food) => ({
			user_id: userId,
			list_type: listType,
			fdc_id: food.fdcId,
			food: toJson(compactFood(food)),
		})),
	);

	return !error;
};

export const upsertCloudSmoothieListItem = async (
	key: SmoothieListKey,
	food: FdcFood,
) => {
	const userId = await getCurrentUserId();
	if (!userId) return false;
	const supabase = getSupabaseBrowserClient();
	if (!supabase) return false;

	const { error } = await supabase.from("user_food_list_items").upsert(
		{
			user_id: userId,
			list_type: getCloudListType(key),
			fdc_id: food.fdcId,
			food: toJson(compactFood(food)),
		},
		{ onConflict: "user_id,list_type,fdc_id" },
	);

	return !error;
};

export const removeCloudSmoothieListItem = async (
	key: SmoothieListKey,
	foodId: number,
) => {
	const userId = await getCurrentUserId();
	if (!userId) return false;
	const supabase = getSupabaseBrowserClient();
	if (!supabase) return false;

	const { error } = await supabase
		.from("user_food_list_items")
		.delete()
		.eq("user_id", userId)
		.eq("list_type", getCloudListType(key))
		.eq("fdc_id", foodId);

	return !error;
};

export const reconcileCloudSmoothieList = async (
	key: SmoothieListKey,
	localFoods: FdcFood[],
) => {
	const cloudFoods = await readCloudSmoothieList(key);
	if (!cloudFoods) return localFoods;

	if (cloudFoods.length > 0) return cloudFoods;
	if (localFoods.length > 0) await writeCloudSmoothieList(key, localFoods);
	return localFoods;
};

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

	const { error: deleteError } = await supabase
		.from("custom_foods")
		.delete()
		.eq("user_id", userId);

	if (deleteError) return false;
	if (foods.length === 0) return true;

	const { error } = await supabase.from("custom_foods").insert(
		foods.map((food) => ({
			user_id: userId,
			fdc_id: food.fdcId,
			food: toJson(compactFood(food)),
		})),
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

	if (cloudFoods.length > 0) return cloudFoods;
	if (localFoods.length > 0) await writeCloudCustomFoods(localFoods);
	return localFoods;
};

export const readCloudSavedDrinks = async () => {
	const userId = await getCurrentUserId();
	if (!userId) return null;
	const supabase = getSupabaseBrowserClient();
	if (!supabase) return null;

	const { data, error } = await supabase
		.from("saved_drinks")
		.select("id, drink, created_at")
		.eq("user_id", userId)
		.order("created_at", { ascending: false });

	if (error) return null;

	return data.map((row) => ({
		...(row.drink as unknown as SavedDrink),
		id: row.id,
		createdAt:
			(row.drink as unknown as SavedDrink).createdAt ??
			new Date(row.created_at).getTime(),
	}));
};

export const writeCloudSavedDrinks = async (drinks: SavedDrink[]) => {
	const userId = await getCurrentUserId();
	if (!userId) return false;
	const supabase = getSupabaseBrowserClient();
	if (!supabase) return false;

	const { error: deleteError } = await supabase
		.from("saved_drinks")
		.delete()
		.eq("user_id", userId);

	if (deleteError) return false;
	if (drinks.length === 0) return true;

	const { error } = await supabase.from("saved_drinks").insert(
		drinks.map((drink) => ({
			id: drink.id,
			user_id: userId,
			name: drink.name,
			drink: toJson(drink),
			created_at: new Date(drink.createdAt).toISOString(),
		})),
	);

	return !error;
};

export const saveCloudSavedDrink = async (drink: SavedDrink) => {
	const userId = await getCurrentUserId();
	if (!userId) return false;
	const supabase = getSupabaseBrowserClient();
	if (!supabase) return false;

	const { error } = await supabase.from("saved_drinks").upsert({
		id: drink.id,
		user_id: userId,
		name: drink.name,
		drink: toJson(drink),
		created_at: new Date(drink.createdAt).toISOString(),
	});

	return !error;
};

export const deleteCloudSavedDrink = async (drinkId: string) => {
	const userId = await getCurrentUserId();
	if (!userId) return false;
	const supabase = getSupabaseBrowserClient();
	if (!supabase) return false;

	const { error } = await supabase
		.from("saved_drinks")
		.delete()
		.eq("user_id", userId)
		.eq("id", drinkId);

	return !error;
};

export const reconcileCloudSavedDrinks = async (localDrinks: SavedDrink[]) => {
	const cloudDrinks = await readCloudSavedDrinks();
	if (!cloudDrinks) return localDrinks;

	if (cloudDrinks.length > 0) return cloudDrinks;
	if (localDrinks.length > 0) await writeCloudSavedDrinks(localDrinks);
	return localDrinks;
};

export const readCloudMixPreferences = async (): Promise<CloudMixPreferences | null> => {
	const userId = await getCurrentUserId();
	if (!userId) return null;
	const supabase = getSupabaseBrowserClient();
	if (!supabase) return null;

	const { data, error } = await supabase
		.from("mix_preferences")
		.select("nutrient_goals, mix_state")
		.eq("user_id", userId)
		.maybeSingle();

	if (error) return null;
	if (!data) return {};

	return {
		nutrientGoals: getNumberRecord(data.nutrient_goals),
		mixState: getObjectRecord(data.mix_state),
	};
};

export const saveCloudMixPreferences = async ({
	nutrientGoals,
	mixState,
}: CloudMixPreferences) => {
	const userId = await getCurrentUserId();
	if (!userId) return false;
	const supabase = getSupabaseBrowserClient();
	if (!supabase) return false;

	const existing = await readCloudMixPreferences();
	const { error } = await supabase.from("mix_preferences").upsert({
		user_id: userId,
		nutrient_goals: toJson(nutrientGoals ?? existing?.nutrientGoals ?? {}),
		mix_state: toJson(mixState ?? existing?.mixState ?? {}),
	});

	return !error;
};
