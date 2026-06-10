import { getSupabaseBrowserClient } from "$lib/supabase/client";
import type { Json } from "$lib/types/database.types";

export type CloudMixPreferences = {
	nutrientGoals?: Record<number, number>;
	mixState?: Record<string, unknown>;
};

export const getCurrentUserId = async () => {
	const supabase = getSupabaseBrowserClient();
	if (!supabase) return null;

	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user) return null;
	return user.id;
};

export const toJson = (value: unknown): Json => {
	return JSON.parse(JSON.stringify(value)) as Json;
};

export const getNumberRecord = (value: Json): Record<number, number> => {
	if (!value || typeof value !== "object" || Array.isArray(value)) return {};

	return Object.fromEntries(
		Object.entries(value)
			.map(([key, item]) => [Number(key), Number(item)])
			.filter(([key, item]) => Number.isFinite(key) && Number.isFinite(item)),
	);
};

export const getObjectRecord = (value: Json): Record<string, unknown> => {
	if (!value || typeof value !== "object" || Array.isArray(value)) return {};
	return value as Record<string, unknown>;
};
