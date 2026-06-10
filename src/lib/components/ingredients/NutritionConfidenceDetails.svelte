<script lang="ts">
	import type { FoodQuality } from "$lib/utils/food/foodQuality";

	let {
		quality,
		compact = false,
	}: {
		quality: FoodQuality;
		compact?: boolean;
	} = $props();

	const noteworthyDetails = $derived(
		quality.details.filter(
			(detail) =>
				detail.source === "missing" ||
				detail.source === "derived" ||
				detail.source === "fallback",
		),
	);
</script>

{#if quality.needsDetails && noteworthyDetails.length > 0}
	<section
		class="confidence-details {compact ? 'confidence-details--compact' : ''}"
		aria-label="Nutrition confidence details"
	>
		<div class="confidence-details__header">
			<strong>{quality.symbol} {quality.label} nutrition data</strong>
			<span>
				{quality.completeCount}/{quality.completeCount + quality.missingCount}
				vital nutrients available
			</span>
		</div>
		<ul>
			{#each noteworthyDetails as detail}
				<li class={`confidence-detail confidence-detail--${detail.source}`}>
					<span>{detail.label}</span>
					<strong>{detail.sourceLabel}</strong>
					<small>{detail.detail}</small>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style lang="scss">
	@use "../../../styles/variables" as *;

	.confidence-details {
		display: grid;
		gap: 0.45rem;
		margin: 0.45rem 0;
		padding: 0.55rem;
		background: $app-bg;
		border: $app-border;
		border-radius: $app-radius;
		font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
			sans-serif;
	}

	.confidence-details--compact {
		margin: 0.25rem 0 0;
		padding: 0.45rem;
	}

	.confidence-details__header {
		display: grid;
		gap: 0.1rem;

		strong {
			color: $app-primary;
			font-size: 0.78rem;
			font-weight: 800;
		}

		span {
			color: $app-muted;
			font-size: 0.7rem;
			font-weight: 700;
		}
	}

	ul {
		display: grid;
		gap: 0.3rem;
		list-style: none;
	}

	.confidence-detail {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0.1rem 0.45rem;
		align-items: center;
		padding: 0.35rem 0.4rem;
		background: $app-section-bg;
		border: $app-border;
		border-radius: $app-radius-sm;

		span {
			min-width: 0;
			overflow: hidden;
			color: $app-primary;
			font-size: 0.74rem;
			font-weight: 750;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		strong {
			font-size: 0.68rem;
			font-weight: 900;
			text-transform: uppercase;
		}

		small {
			grid-column: 1 / -1;
			color: $app-muted;
			font-size: 0.68rem;
			font-weight: 600;
			line-height: 1.25;
		}
	}

	.confidence-detail--missing strong {
		color: $app-warning-strong;
	}

	.confidence-detail--derived strong {
		color: $app-primary;
	}

	.confidence-detail--fallback strong {
		color: $app-primary;
	}
</style>
