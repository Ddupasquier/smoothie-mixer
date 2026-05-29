<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<meta name="theme-color" content="#4caf50" />
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="app-header">
	<span class="logo">🥤 Smoothie Mixer</span>
</header>

<main class="app-main">
	{@render children()}
</main>
