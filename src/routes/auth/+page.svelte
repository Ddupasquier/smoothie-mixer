<script lang="ts">
	import { onMount } from "svelte";
	import type { ActionData, PageData } from "./$types";

	let {
		data,
		form,
	}: {
		data: PageData;
		form: ActionData;
	} = $props();

	let providerError = $state("");

	onMount(() => {
		const params = new URLSearchParams(window.location.hash.slice(1));
		providerError = params.get("error_description") ?? "";
	});
</script>

<section class="auth-page">
	<div class="auth-card">
		<div class="auth-card__header">
			<h2>Sign in</h2>
			<p>Use Google to sync your fridge, saved drinks, and custom ingredients.</p>
		</div>

		{#if data.authError}
			<p class="auth-error" role="alert">
				Google sign in did not complete.
				{#if providerError}
					<span>{providerError}</span>
				{:else}
					<span>Try again.</span>
				{/if}
			</p>
		{/if}
		{#if form?.message}
			<p class="auth-error" role="alert">{form.message}</p>
		{/if}

		<form method="POST" action="?/google">
			<input type="hidden" name="next" value={form?.next ?? data.next} />
			<button class="google-button" type="submit">
				<span aria-hidden="true">G</span>
				Continue with Google
			</button>
		</form>

		<p class="auth-note">
			Your current local data stays on this device until we add the migration
			step.
		</p>
	</div>
</section>

<style lang="scss">
	@use "../../styles/variables" as *;

	.auth-page {
		display: grid;
		place-items: center;
		min-height: 55vh;
	}

	.auth-card {
		display: grid;
		gap: $app-gap-md;
		width: min(100%, 24rem);
		padding: $app-gap-lg;
		background: $app-section-bg;
		border: $app-border;
		border-radius: $app-card-radius;
		box-shadow: $app-box-shadow;
	}

	.auth-card__header {
		display: grid;
		gap: 0.25rem;

		h2 {
			color: $app-primary;
			font-size: 1.4rem;
		}

		p {
			color: $app-muted;
			font-size: 0.92rem;
			line-height: 1.4;
		}
	}

	.google-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		width: 100%;
		padding: 0.7rem 1rem;
		color: $app-btn-text;
		background: $app-btn-bg;
		border-radius: $app-radius-pill;
		font-weight: 900;

		&:hover {
			background: $app-btn-bg-hover;
		}

		span {
			display: grid;
			place-items: center;
			width: 1.35rem;
			height: 1.35rem;
			color: $app-primary;
			background: $app-btn-text;
			border-radius: $app-radius-pill;
			font-weight: 900;
		}
	}

	.auth-error {
		padding: 0.5rem 0.65rem;
		color: $app-warning-strong;
		background: $app-warning-bg;
		border: $app-warning-border;
		border-radius: $app-radius;
		font-size: 0.85rem;
		font-weight: 800;
	}

	.auth-note {
		color: $app-muted;
		font-size: 0.78rem;
		line-height: 1.35;
	}
</style>
