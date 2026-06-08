import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();

	return {
		authUser: user
			? {
					id: user.id,
					email: user.email ?? null,
				}
			: null,
	};
};
