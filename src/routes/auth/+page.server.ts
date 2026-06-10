import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

const getSafeNextPath = (value: FormDataEntryValue | string | null) => {
	if (typeof value !== "string" || !value.startsWith("/")) return "/";
	if (value.startsWith("//")) return "/";
	return value;
};

const getEmailAuthFields = async (request: Request) => {
	const formData = await request.formData();
	const email = String(formData.get("email") ?? "").trim().toLowerCase();
	const password = String(formData.get("password") ?? "");
	const next = getSafeNextPath(formData.get("next"));

	return { email, password, next };
};

const getEmailAuthValidationError = (email: string, password: string) => {
	if (!email) return "Enter your email address.";
	if (!email.includes("@")) return "Enter a valid email address.";
	if (!password) return "Enter your password.";
	if (password.length < 6) return "Password must be at least 6 characters.";
	return "";
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
	emailSignIn: async ({ locals, request }) => {
		const { email, password, next } = await getEmailAuthFields(request);
		const validationError = getEmailAuthValidationError(email, password);

		if (validationError) {
			return fail(400, {
				message: validationError,
				email,
				next,
			});
		}

		const { error } = await locals.supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			return fail(400, {
				message: "Email or password was not accepted.",
				email,
				next,
			});
		}

		throw redirect(303, next);
	},
	emailSignUp: async ({ locals, request, url }) => {
		const { email, password, next } = await getEmailAuthFields(request);
		const validationError = getEmailAuthValidationError(email, password);

		if (validationError) {
			return fail(400, {
				message: validationError,
				email,
				next,
			});
		}

		const { data, error } = await locals.supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: `${url.origin}/auth/callback?next=${encodeURIComponent(next)}`,
			},
		});

		if (error) {
			return fail(400, {
				message: error.message,
				email,
				next,
			});
		}

		if (data.session) {
			throw redirect(303, next);
		}

		return {
			success:
				"Account created. Check your email to confirm it, then come back and sign in.",
			email,
			next,
		};
	},
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
