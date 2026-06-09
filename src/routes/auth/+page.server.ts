import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

const getSafeNextPath = (value: FormDataEntryValue | string | null) => {
	if (typeof value !== "string" || !value.startsWith("/")) return "/";
	if (value.startsWith("//")) return "/";
	return value;
};

export const load: PageServerLoad = async ({ locals, url }) => {
	const { user } = await locals.safeGetSession();

	if (user) {
		throw redirect(303, getSafeNextPath(url.searchParams.get("next")));
	}

	return {
		authError: url.searchParams.get("error") ?? "",
		next: getSafeNextPath(url.searchParams.get("next")),
	};
};

export const actions: Actions = {
	google: async ({ locals, request, url }) => {
		const formData = await request.formData();
		const next = getSafeNextPath(formData.get("next"));
		const redirectTo = `${url.origin}/auth/callback?next=${encodeURIComponent(next)}`;

		const { data, error } = await locals.supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo,
			},
		});

		if (error || !data.url) {
			return fail(400, {
				message: error?.message ?? "Unable to start Google sign in.",
				next,
			});
		}

		throw redirect(303, data.url);
	},
};
