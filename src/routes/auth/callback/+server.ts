import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const getSafeNextPath = (value: string | null) => {
	if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
	return value;
};

export const GET: RequestHandler = async ({ locals, url }) => {
	const code = url.searchParams.get("code");
	const next = getSafeNextPath(url.searchParams.get("next"));

	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);

		if (!error) {
			throw redirect(303, next);
		}
	}

	throw redirect(303, `/auth?error=callback&next=${encodeURIComponent(next)}`);
};
