<script lang="ts">
	import type { NutrientFoodSuggestion } from "$lib/utils/mixCalculations";

	let {
		suggestions = [],
		onAdd,
	}: {
		suggestions?: NutrientFoodSuggestion[];
		onAdd: (foodId: number, servingGrams: number) => void;
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
		class="nutrient-suggestions"
		aria-label="Food suggestions for nutrition goals"
	>
		<div class="nutrient-suggestions__header">
			<h4>Best Next Adds</h4>
			<p>Simple suggestions based on what your smoothie is missing.</p>
		</div>

		<div class="nutrient-suggestions__list">
			{#each suggestions as suggestion}
				<article class="nutrient-suggestion">
					<div class="nutrient-suggestion__body">
						<div class="nutrient-suggestion__title-row">
							<div>
								<span class="nutrient-suggestion__source">
									{suggestion.sourceLabel}
								</span>
								<strong>{suggestion.food.description}</strong>
							</div>
							<span class="nutrient-suggestion__impact">
								Best for {suggestion.nutrientLabel}
							</span>
						</div>
						<p>
							{suggestion.action === "increase" ? "Increase by" : "Add"}
							~{formatGrams(suggestion.servingGramsToTarget)}g. That fills the
							remaining {formatAmount(suggestion.targetAddedAmount)}{suggestion.unit}
							{suggestion.nutrientLabel}.
						</p>
						{#if suggestion.action === "increase"}
							<p class="nutrient-suggestion__serving">
								New amount: ~{formatGrams(suggestion.nextServingGrams)}g
							</p>
						{/if}
						{#if suggestion.conflicts.length > 0}
							<div class="nutrient-suggestion__caution">
								<span>⚠ Goal caution</span>
								<p>
									{suggestion.conflicts[0].reason === "already-over"
										? "You are already over"
										: "This would push you over"}
									{suggestion.conflicts[0].label}.
								</p>
							</div>
						{/if}
					</div>

					<button
						type="button"
						onclick={() =>
							onAdd(
								suggestion.food.fdcId,
								suggestion.nextServingGrams,
							)}
						>
						{#if suggestion.action === "increase"}
							Apply
						{:else if suggestion.conflicts.length > 0}
							Add anyway
						{:else}
							Add
						{/if}
					</button>
				</article>
			{/each}
		</div>
	</section>
{/if}

<style lang="scss">
	@use "../../styles/variables" as *;

	.nutrient-suggestions {
		width: 100%;
		margin-top: $app-gap-sm;
		padding: 0.55rem;
		background: $app-bg;
		border: $app-border;
		border-radius: $app-card-radius;
	}

	.nutrient-suggestions__header {
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

	.nutrient-suggestions__list {
		display: grid;
		gap: 0.4rem;
	}

	.nutrient-suggestion {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 0.5rem;
		padding: 0.55rem;
		background: $app-section-bg;
		border: $app-border;
		border-radius: $app-radius;
	}

	.nutrient-suggestion__body {
		display: grid;
		gap: 0.12rem;
		min-width: 0;
	}

	.nutrient-suggestion__title-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0.4rem;
		align-items: start;
		min-width: 0;
	}

	.nutrient-suggestion__title-row > div {
		display: grid;
		gap: 0.15rem;
		min-width: 0;
	}

	.nutrient-suggestion__source,
	.nutrient-suggestion__impact {
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

	.nutrient-suggestion__impact {
		background: $app-success-bg;
	}

	.nutrient-suggestion__caution {
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

	.nutrient-suggestion__serving {
		color: $app-primary;
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
		.nutrient-suggestion__title-row {
			grid-template-columns: 1fr;
		}

		button {
			justify-self: stretch;
		}
	}
</style>
