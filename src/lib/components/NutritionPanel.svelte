<script lang="ts">
	import type { NutritionTotals } from '$lib/types';

	interface Props {
		totals: NutritionTotals;
	}

	let { totals }: Props = $props();

	const rows = $derived([
		{ label: 'Calories', value: Math.round(totals.calories), unit: 'kcal', highlight: true },
		{ label: 'Protein', value: totals.protein.toFixed(1), unit: 'g' },
		{ label: 'Carbs', value: totals.carbs.toFixed(1), unit: 'g' },
		{ label: 'Fat', value: totals.fat.toFixed(1), unit: 'g' },
		{ label: 'Fiber', value: totals.fiber.toFixed(1), unit: 'g' },
		{ label: 'Sugar', value: totals.sugar.toFixed(1), unit: 'g' }
	]);
</script>

<section class="nutrition-panel" aria-label="Nutrition summary">
	<h2 class="panel-title">Nutrition Summary</h2>
	<ul class="nutrition-list">
		{#each rows as row}
			<li class="nutrition-row" class:highlight={row.highlight}>
				<span class="n-label">{row.label}</span>
				<span class="n-value">{row.value} <span class="n-unit">{row.unit}</span></span>
			</li>
		{/each}
	</ul>
	<p class="panel-note">Values are based on the serving sizes you entered (per 100 g raw food data).</p>
</section>

<style>
	.nutrition-panel {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: 1rem;
	}

	.panel-title {
		font-size: 1rem;
		font-weight: 700;
		margin-bottom: 0.75rem;
		color: var(--color-primary-dark);
	}

	.nutrition-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.nutrition-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.35rem 0.5rem;
		border-radius: var(--radius-sm);
		font-size: 0.9rem;
	}

	.nutrition-row.highlight {
		background: var(--color-primary-light);
		font-weight: 700;
		font-size: 1rem;
	}

	.n-label {
		color: var(--color-text);
	}

	.n-value {
		font-weight: 600;
	}

	.n-unit {
		font-weight: 400;
		color: var(--color-text-muted);
		font-size: 0.8em;
	}

	.panel-note {
		margin-top: 0.75rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		line-height: 1.4;
	}
</style>
