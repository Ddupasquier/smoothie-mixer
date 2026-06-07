<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import "../app.css";
	import TabNavigation from "$lib/components/TabNavigation.svelte";

	let { children } = $props();
</script>

<svelte:head>
	<meta name="theme-color" content="#5f564f" />
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="app-header">
	<span class="logo">🥤 Smoothie Mixer</span>
</header>

<TabNavigation />

<main class="app-main">
	{@render children()}
</main>
