import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const getSafeNextPath = (value: string | null) => {
	if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
	return value;
};

export const GET: RequestHandler = async ({ locals, url }) => {
	const code = url.searchParams.get("code");
	const next = getSafeNextPath(url.searchParams.get("next"));
	const providerError = url.searchParams.get("error_description");

	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);

		if (!error) {
			throw redirect(303, next);
		}

		throw redirect(
			303,
			`/auth?error=callback_exchange&next=${encodeURIComponent(next)}`,
		);
	}

	const errorCode = providerError ? "provider" : "missing_code";
	throw redirect(
		303,
		`/auth?error=${errorCode}&next=${encodeURIComponent(next)}`,
	);
};
