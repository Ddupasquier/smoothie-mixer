import { env } from "$env/dynamic/public";

const getFirstForwardedValue = (value: string | null) => {
	return value?.split(",")[0]?.trim() ?? "";
};

const normalizeConfiguredOrigin = (value: string | undefined) => {
	if (!value) return "";

	try {
		const url = new URL(value.includes("://") ? value : `https://${value}`);
		if (url.protocol !== "http:" && url.protocol !== "https:") return "";
		return url.origin;
	} catch {
		return "";
	}
};

export const getRequestOrigin = (request: Request, fallbackUrl: URL) => {
	const configuredOrigin = normalizeConfiguredOrigin(env.PUBLIC_SITE_URL);
	if (configuredOrigin) return configuredOrigin;

	const forwardedHost = getFirstForwardedValue(
		request.headers.get("x-forwarded-host"),
	);
	if (!forwardedHost) return fallbackUrl.origin;

	const forwardedProtocol = getFirstForwardedValue(
		request.headers.get("x-forwarded-proto"),
	);
	const protocol = forwardedProtocol === "http" ? "http" : "https";
	return `${protocol}://${forwardedHost}`;
};

export const getAuthCallbackUrl = (
	request: Request,
	fallbackUrl: URL,
	next: string,
) => {
	const callbackUrl = new URL("/auth/callback", getRequestOrigin(request, fallbackUrl));
	callbackUrl.searchParams.set("next", next);
	return callbackUrl.toString();
};
