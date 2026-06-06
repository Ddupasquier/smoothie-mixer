<script lang="ts">
	import Popover from "$lib/components/Popover.svelte";

	export type NutrientOverageContributor = {
		label: string;
		amount: number;
		grams: number;
	};

	export type NutrientOverage = {
		label: string;
		unit: string;
		total: number;
		goal: number;
		overage: number;
		contributors: NutrientOverageContributor[];
	};

	let { overages = [] }: { overages?: NutrientOverage[] } = $props();

	const formatValue = (value: number) => {
		return value >= 10 ? value.toFixed(0) : value.toFixed(1);
	};
</script>

{#if overages.length > 0}
	<section
		class="overage-summary"
		aria-live="polite"
		aria-label="Nutrient goal overages"
	>
		<h4>Over Goal</h4>
		<p>These nutrients exceed your goal for this smoothie.</p>
		<ul>
			{#each overages as overage}
				<li>
					<strong>{overage.label}</strong>
					<span>
						{formatValue(overage.total)} / {formatValue(
							overage.goal,
						)}
						{overage.unit}
					</span>
					<em>
						+{formatValue(overage.overage)}
						{overage.unit}
					</em>
					<Popover
						buttonLabel="Why?"
						title={`${overage.label} contributors`}
					>
						<p class="popover-note">
							These selected items contribute to the overage.
						</p>
						<ul class="contributor-list">
							{#each overage.contributors as contributor}
								<li>
									<strong>{contributor.label}</strong>
									<span>
										{formatValue(contributor.amount)}
										{overage.unit}
										from {formatValue(contributor.grams)}g
									</span>
								</li>
							{/each}
						</ul>
					</Popover>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style lang="scss">
	@use "../../styles/variables" as *;

	.overage-summary {
		padding: $app-gap-sm;
		background: $app-warning-bg;
		border: $app-warning-border;
		border-radius: $app-card-radius;
		box-shadow: $app-card-shadow;

		h4 {
			margin-bottom: 0.2rem;
			color: $app-warning-text;
			font-size: 0.95rem;
			font-weight: 800;
		}

		p {
			margin-bottom: $app-gap-sm;
			color: $app-warning-text;
			font-size: 0.86rem;
			font-weight: 600;
		}

		ul {
			display: grid;
			gap: 0.35rem;
			list-style: none;
		}

		li {
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto auto auto;
			gap: 0.55rem;
			align-items: center;
			padding: 0.45rem 0.55rem;
			background: $app-section-bg;
			border-radius: $app-radius;
			color: $app-primary;
			font-size: 0.86rem;
		}

		strong {
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		span {
			color: $app-muted;
			font-weight: 700;
		}

		em {
			color: $app-warning-strong;
			font-style: normal;
			font-weight: 800;
		}

		.popover-note {
			margin-bottom: $app-gap-sm;
			color: $app-muted;
			font-size: 0.82rem;
		}

		.contributor-list {
			display: grid;
			gap: 0.35rem;
			list-style: none;

			li {
				display: grid;
				grid-template-columns: 1fr;
				gap: 0.15rem;
				padding: 0.4rem 0;
				border-bottom: 1px solid #e3e7ee;
				border-radius: 0;
			}

			li:last-child {
				border-bottom: 0;
			}
		}
	}
</style>
