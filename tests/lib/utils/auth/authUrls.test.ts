import { beforeEach, describe, expect, it, vi } from "vitest";

const publicEnvironment = vi.hoisted(() => ({
	PUBLIC_SITE_URL: "",
}));

vi.mock("$env/dynamic/public", () => ({ env: publicEnvironment }));

import {
	getAuthCallbackUrl,
	getRequestOrigin,
} from "$lib/utils/auth/authUrls";

describe("authentication URLs", () => {
	beforeEach(() => {
		publicEnvironment.PUBLIC_SITE_URL = "";
	});

	it("uses the configured production site URL when available", () => {
		publicEnvironment.PUBLIC_SITE_URL = "https://smoothie-mixer.vercel.app/";
		const request = new Request("http://localhost:5173/auth");

		expect(getRequestOrigin(request, new URL(request.url))).toBe(
			"https://smoothie-mixer.vercel.app",
		);
	});

	it("uses proxy headers for hosted requests", () => {
		const request = new Request("http://localhost:3000/auth", {
			headers: {
				"x-forwarded-host": "smoothie-mixer.vercel.app",
				"x-forwarded-proto": "https",
			},
		});

		expect(getRequestOrigin(request, new URL(request.url))).toBe(
			"https://smoothie-mixer.vercel.app",
		);
	});

	it("builds a production callback while preserving the next path", () => {
		publicEnvironment.PUBLIC_SITE_URL = "smoothie-mixer.vercel.app";
		const request = new Request("http://localhost:5173/auth");

		expect(
			getAuthCallbackUrl(request, new URL(request.url), "/mix?loaded=true"),
		).toBe(
			"https://smoothie-mixer.vercel.app/auth/callback?next=%2Fmix%3Floaded%3Dtrue",
		);
	});

	it("falls back to localhost during direct local development", () => {
		const request = new Request("http://localhost:5173/auth");

		expect(getAuthCallbackUrl(request, new URL(request.url), "/mix")).toBe(
			"http://localhost:5173/auth/callback?next=%2Fmix",
		);
	});
});
