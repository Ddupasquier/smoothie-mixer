<script lang="ts">
	import type { SmartWarning } from "$lib/utils/smartWarnings";

	let { warnings = [] }: { warnings?: SmartWarning[] } = $props();
</script>

{#if warnings.length > 0}
	<section class="smart-warnings" aria-live="polite" aria-label="Smart warnings">
		<h4>Smart Warnings</h4>
		<div class="smart-warnings__list">
			{#each warnings as warning}
				<article class={`smart-warning smart-warning--${warning.tone}`}>
					<span class="smart-warning__symbol" aria-hidden="true">
						{warning.symbol}
					</span>
					<div>
						<strong>{warning.title}</strong>
						<p>{warning.message}</p>
					</div>
				</article>
			{/each}
		</div>
	</section>
{/if}

<style lang="scss">
	@use "../../styles/variables" as *;

	.smart-warnings {
		width: 100%;
		margin-top: $app-gap-sm;
		padding: $app-gap-sm;
		background: $app-bg;
		border: $app-border;
		border-radius: $app-card-radius;

		h4 {
			margin-bottom: $app-gap-sm;
			color: $app-primary;
			font-size: 0.92rem;
			font-weight: 800;
		}
	}

	.smart-warnings__list {
		display: grid;
		gap: 0.4rem;
	}

	.smart-warning {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 0.5rem;
		align-items: start;
		padding: 0.55rem 0.65rem;
		background: $app-section-bg;
		border: $app-border;
		border-radius: $app-radius;
	}

	.smart-warning__symbol {
		display: grid;
		place-items: center;
		width: 1.35rem;
		height: 1.35rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 900;
	}

	.smart-warning--danger {
		border-color: #fecaca;

		.smart-warning__symbol {
			color: #991b1b;
			background: #fee2e2;
		}
	}

	.smart-warning--warning {
		border-color: #fde68a;

		.smart-warning__symbol {
			color: #92400e;
			background: #fef3c7;
		}
	}

	.smart-warning--info {
		border-color: #bfdbfe;

		.smart-warning__symbol {
			color: $app-primary;
			background: $app-accent;
		}
	}

	strong {
		display: block;
		margin-bottom: 0.1rem;
		color: $app-primary;
		font-size: 0.82rem;
		font-weight: 800;
	}

	p {
		color: $app-muted;
		font-size: 0.78rem;
		font-weight: 600;
		line-height: 1.35;
	}
</style>
