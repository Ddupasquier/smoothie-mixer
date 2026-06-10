import { getSupabaseBrowserClient } from "$lib/supabase/client";
import {
	getCurrentUserId,
	getNumberRecord,
	getObjectRecord,
	toJson,
	type CloudMixPreferences,
} from "./shared";

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
