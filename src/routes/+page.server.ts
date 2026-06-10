import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

const getSafeNextPath = (value: string | null) => {
	if (!value || !value.startsWith("/") || value.startsWith("//")) return "/fridge";
	return value;
};

export const load: PageServerLoad = async ({ locals, url }) => {
	const { user } = await locals.safeGetSession();

	if (user) {
		throw redirect(303, getSafeNextPath(url.searchParams.get("next")));
	}

	return {
		next: getSafeNextPath(url.searchParams.get("next")),
	};
};
