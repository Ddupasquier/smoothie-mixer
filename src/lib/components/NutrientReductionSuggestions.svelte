<script lang="ts">
	import type { NutrientReductionSuggestion } from "$lib/utils/mixCalculations";

	let {
		suggestions = [],
		onApply,
	}: {
		suggestions?: NutrientReductionSuggestion[];
		onApply: (foodId: number, nextServingGrams: number) => void;
	} = $props();

	const formatAmount = (value: number) => {
		if (value >= 100) return value.toFixed(0);
		if (value >= 10) return value.toFixed(1);
		return value.toFixed(2).replace(/\.?0+$/, "");
	};

	const formatGrams = (value: number) => {
		if (value >= 100) return value.toFixed(0);
		if (value >= 10) return value.toFixed(1);
		return value.toFixed(1).replace(/\.0$/, "");
	};
</script>

{#if suggestions.length > 0}
	<section
		class="nutrient-tweaks"
		aria-label="Ingredient tweaks for nutrition goals"
	>
		<div class="nutrient-tweaks__header">
			<h4>Best Tweaks</h4>
			<p>Small amount changes that bring over-goal nutrients closer.</p>
		</div>

		<div class="nutrient-tweaks__list">
			{#each suggestions as suggestion}
				<article class="nutrient-tweak">
					<div class="nutrient-tweak__body">
						<div class="nutrient-tweak__title-row">
							<div>
								<span class="nutrient-tweak__source">
									{suggestion.sourceLabel}
								</span>
								<strong>{suggestion.food.description}</strong>
							</div>
							<span class="nutrient-tweak__impact">
								Reduce {suggestion.nutrientLabel}
							</span>
						</div>
						<p>
							Reduce by ~{formatGrams(suggestion.reduceByGrams)}g to remove
							{formatAmount(suggestion.targetReducedAmount)}{suggestion.unit}
							{suggestion.nutrientLabel}.
						</p>
						<p class="nutrient-tweak__serving">
							New amount: ~{formatGrams(suggestion.nextServingGrams)}g
						</p>
						{#if suggestion.conflicts.length > 0}
							<div class="nutrient-tweak__caution">
								<span>⚠ Goal caution</span>
								<p>
									{suggestion.conflicts[0].reason === "already-under"
										? "You are already under"
										: "This may drop you below"}
									{suggestion.conflicts[0].label}.
								</p>
							</div>
						{/if}
					</div>

					<button
						type="button"
						onclick={() =>
							onApply(
								suggestion.food.fdcId,
								suggestion.nextServingGrams,
							)}
					>
						Apply
					</button>
				</article>
			{/each}
		</div>
	</section>
{/if}

<style lang="scss">
	@use "../../styles/variables" as *;

	.nutrient-tweaks {
		width: 100%;
		margin-top: $app-gap-sm;
		padding: 0.55rem;
		background: $app-bg;
		border: $app-border;
		border-radius: $app-card-radius;
	}

	.nutrient-tweaks__header {
		margin-bottom: 0.5rem;

		h4 {
			color: $app-primary;
			font-size: 0.92rem;
			font-weight: 800;
		}

		p {
			color: $app-muted;
			font-size: 0.76rem;
			font-weight: 600;
			line-height: 1.35;
		}
	}

	.nutrient-tweaks__list {
		display: grid;
		gap: 0.4rem;
	}

	.nutrient-tweak {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 0.5rem;
		padding: 0.55rem;
		background: $app-section-bg;
		border: $app-border;
		border-radius: $app-radius;
	}

	.nutrient-tweak__body {
		display: grid;
		gap: 0.12rem;
		min-width: 0;
	}

	.nutrient-tweak__title-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0.4rem;
		align-items: start;
		min-width: 0;
	}

	.nutrient-tweak__title-row > div {
		display: grid;
		gap: 0.15rem;
		min-width: 0;
	}

	.nutrient-tweak__source,
	.nutrient-tweak__impact {
		width: fit-content;
		max-width: 100%;
		padding: 0.12rem 0.42rem;
		color: $app-primary;
		background: $app-accent;
		border-radius: 999px;
		font-size: 0.66rem;
		font-weight: 800;
		line-height: 1.2;
	}

	.nutrient-tweak__impact {
		background: $app-warning-bg;
	}

	.nutrient-tweak__serving {
		color: $app-primary;
	}

	.nutrient-tweak__caution {
		display: grid;
		gap: 0.1rem;
		padding: 0.35rem 0.45rem;
		background: $app-warning-bg;
		border-radius: 8px;
		color: $app-primary;
		font-size: 0.7rem;
		font-weight: 700;
		line-height: 1.25;

		span {
			font-size: 0.72rem;
			font-weight: 900;
		}

		p {
			color: $app-primary;
			font-size: 0.7rem;
		}
	}

	strong {
		color: $app-primary;
		font-size: 0.78rem;
		font-weight: 800;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	p {
		color: $app-muted;
		font-size: 0.72rem;
		font-weight: 700;
		line-height: 1.25;
	}

	button {
		justify-self: end;
		padding: 0.32rem 0.58rem;
		color: $app-btn-text;
		background: $app-btn-bg;
		border-radius: 999px;
		font-size: 0.74rem;
		font-weight: 800;

		&:hover {
			background: $app-btn-bg-hover;
		}
	}

	@media (max-width: 520px) {
		.nutrient-tweak__title-row {
			grid-template-columns: 1fr;
		}

		button {
			justify-self: stretch;
		}
	}
</style>
