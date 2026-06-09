<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import "../app.css";
	import TabNavigation from "$lib/components/app/TabNavigation.svelte";
	import type { LayoutData } from "./$types";

	let {
		children,
		data,
	}: {
		children: import("svelte").Snippet;
		data: LayoutData;
	} = $props();
</script>

<svelte:head>
	<title>Smoothie Mixer</title>
	<meta
		name="description"
		content="Build, compare, and save smoothie recipes with nutrition goals, ingredient amounts, custom foods, and visual nutrient tracking."
	/>
	<meta name="theme-color" content="#5f564f" />
	<link rel="icon" href={favicon} />
	<link rel="canonical" href="https://smoothie-mixer.vercel.app/" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://smoothie-mixer.vercel.app/" />
	<meta property="og:title" content="Smoothie Mixer" />
	<meta
		property="og:description"
		content="Build, compare, and save smoothie recipes with nutrition goals, ingredient amounts, custom foods, and visual nutrient tracking."
	/>
	<meta property="og:image" content="https://smoothie-mixer.vercel.app/og-image.png" />
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Smoothie Mixer nutrition graph preview" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Smoothie Mixer" />
	<meta
		name="twitter:description"
		content="Build, compare, and save smoothie recipes with nutrition goals, ingredient amounts, custom foods, and visual nutrient tracking."
	/>
	<meta name="twitter:image" content="https://smoothie-mixer.vercel.app/og-image.png" />
	<meta name="twitter:image:alt" content="Smoothie Mixer nutrition graph preview" />
</svelte:head>

<header class="app-header">
	<span class="logo">🥤 Smoothie Mixer</span>
	<div class="auth-status">
		{#if data.authUser}
			<span>{data.authUser.email ?? "Signed in"}</span>
			<form method="POST" action="/auth/logout">
				<button type="submit">Sign out</button>
			</form>
		{:else}
			<a href="/auth">Sign in</a>
		{/if}
	</div>
</header>

<TabNavigation />

<main class="app-main">
	{@render children()}
</main>
