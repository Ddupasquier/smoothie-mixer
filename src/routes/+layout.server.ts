import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

const PUBLIC_PATHS = new Set(["/", "/auth"]);

const isPublicPath = (pathname: string) => {
	return PUBLIC_PATHS.has(pathname) || pathname.startsWith("/auth/callback");
};

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const { user } = await locals.safeGetSession();

	if (!user && !isPublicPath(url.pathname)) {
		throw redirect(
			303,
			`/?next=${encodeURIComponent(`${url.pathname}${url.search}`)}`,
		);
	}

	return {
		authUser: user
			? {
					id: user.id,
					email: user.email ?? null,
				}
			: null,
	};
};
