<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import "../app.css";
	import TabNavigation from "$lib/components/TabNavigation.svelte";
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
	<meta name="theme-color" content="#5f564f" />
	<link rel="icon" href={favicon} />
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
