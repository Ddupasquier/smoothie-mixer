<script lang="ts">
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();
</script>

<section class="landing-page">
	<div class="landing-card">
		<p class="landing-eyebrow">Smoothie Mixer</p>
		<h1>Sign in to build and save smoothies.</h1>
		<p>
			Your fridge, shopping list, custom ingredients, saved drinks, and mix
			goals now belong to your account instead of this browser.
		</p>
		<a href={`/auth?next=${encodeURIComponent(data.next)}`}>Sign in to continue</a>
	</div>
</section>

<style lang="scss">
	@use "../styles/variables" as *;

	.landing-page {
		display: grid;
		place-items: center;
		min-height: 62vh;
	}

	.landing-card {
		display: grid;
		gap: $app-gap-md;
		width: min(100%, 31rem);
		padding: $app-gap-md;
		background: $app-section-bg;
		border: $app-border;
		border-radius: $app-card-radius;
		box-shadow: $app-box-shadow;
	}

	.landing-eyebrow {
		width: fit-content;
		padding: 0.18rem 0.55rem;
		color: $app-primary;
		background: $app-accent;
		border-radius: $app-radius-pill;
		font-size: $app-font-size-sm;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	h1 {
		color: $app-primary;
		font-size: clamp(1.75rem, 8vw, 2.5rem);
		line-height: 1.08;
	}

	p {
		color: $app-muted;
		font-size: $app-font-size-md;
		line-height: 1.45;
	}

	a {
		display: inline-flex;
		justify-content: center;
		width: fit-content;
		padding: 0.65rem 1rem;
		color: $app-btn-text;
		background: $app-btn-bg;
		border-radius: $app-radius-pill;
		font-weight: 900;
		text-decoration: none;

		&:hover {
			background: $app-btn-bg-hover;
		}
	}

	@media (max-width: $app-breakpoint-xs) {
		.landing-card {
			padding: $app-gap-md;
		}

		a {
			width: 100%;
		}
	}
</style>
