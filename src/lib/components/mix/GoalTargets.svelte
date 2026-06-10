<script lang="ts">
	import { GOAL_TEMPLATES } from "../../../defaults/mixDefaults";
	import type { NutrientMeta } from "$lib/utils/mix/mixCalculations";

	let {
		selectedNutrients,
		nutrientGoals,
		selectedGoalTemplateId,
		onTemplateChange,
		onApplyTemplate,
		onUpdateGoal,
		getGoal,
		getTotal,
	}: {
		selectedNutrients: NutrientMeta[];
		nutrientGoals: Record<number, number>;
		selectedGoalTemplateId: string;
		onTemplateChange: (templateId: string) => void;
		onApplyTemplate: () => void;
		onUpdateGoal: (id: string | number, value: string) => void;
		getGoal: (nutrient: NutrientMeta) => number;
		getTotal: (nutrientId: number) => number;
	} = $props();
</script>

<section class="setup-card setup-card--goals">
	<div class="section-heading">
		<div>
			<h4>Goal Targets</h4>
			<p>Set the target amount for each selected nutrient.</p>
		</div>
		<div class="goal-template-controls">
			<label for="goal-template">Template</label>
			<select
				id="goal-template"
				value={selectedGoalTemplateId}
				onchange={(event) => onTemplateChange(event.currentTarget.value)}
			>
				<option value="">Choose preset</option>
				{#each GOAL_TEMPLATES as template}
					<option value={template.id}>{template.label}</option>
				{/each}
			</select>
			<button
				type="button"
				onclick={onApplyTemplate}
				disabled={!selectedGoalTemplateId}>Apply</button
			>
		</div>
	</div>
	<div class="goal-grid" aria-label="Nutrient goals">
		{#each selectedNutrients as nutrient}
			<label class="goal-input">
				<span>{nutrient.label}</span>
				<input
					type="number"
					min="0"
					step="any"
					value={nutrientGoals[Number(nutrient.id)] ?? getGoal(nutrient)}
					oninput={(event) =>
						onUpdateGoal(nutrient.id, event.currentTarget.value)}
				/>
				<span class="goal-unit">{nutrient.unit}</span>
				<small>
					{getTotal(Number(nutrient.id)).toFixed(1)} /
					{nutrientGoals[Number(nutrient.id)] ?? getGoal(nutrient)}
				</small>
			</label>
		{/each}
	</div>
</section>

<style lang="scss">
	@use "../../../styles/variables" as *;

	.setup-card {
		padding: $app-gap-sm;
		background: $app-bg;
		border: $app-border;
		border-radius: $app-card-radius;
	}

	.section-heading {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: $app-gap-sm;
		margin-bottom: $app-gap-sm;

		> div:first-child {
			min-width: 0;
		}

		h4 {
			color: $app-primary;
			font-size: 0.92rem;
			font-weight: 800;
		}

		p {
			color: $app-muted;
			font-size: 0.8rem;
			line-height: 1.35;
		}
	}

	.goal-template-controls {
		display: grid;
		grid-template-columns: minmax(8.5rem, 1fr) auto;
		gap: 0.35rem;
		min-width: min(100%, 15rem);

		label {
			grid-column: 1 / -1;
			color: $app-muted;
			font-size: 0.72rem;
			font-weight: 800;
		}

		select {
			width: 100%;
			min-width: 0;
			height: 2rem;
			padding: 0 0.5rem;
			color: $app-primary;
			background: $app-section-bg;
			border: $app-border;
			border-radius: 8px;
			font-size: 0.82rem;
		}

		button {
			height: 2rem;
			padding: 0 0.6rem;
			color: $app-btn-text;
			background: $app-btn-bg;
			border-radius: 8px;
			font-size: 0.8rem;
			font-weight: 800;

			&:hover:not(:disabled) {
				background: $app-btn-bg-hover;
			}

			&:disabled {
				cursor: not-allowed;
				background: $app-btn-disabled;
			}
		}
	}

	.goal-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(135px, 1fr));
		gap: 0.45rem;
	}

	.goal-input {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(3.8rem, 4.8rem) auto;
		align-items: center;
		gap: 0.35rem;
		min-width: 0;
		padding: 0.42rem 0.55rem;
		background: $app-section-bg;
		border: $app-border;
		border-radius: $app-radius;
		color: $app-primary;
		font-size: 0.82rem;
		font-weight: 800;

		span {
			min-width: 0;
			overflow-wrap: anywhere;
		}

		input {
			width: 100%;
			min-width: 0;
			height: 1.85rem;
			padding: 0 0.45rem;
			color: $app-primary;
			background: $app-bg;
			border: $app-border;
			border-radius: 7px;
			font-size: 0.86rem;
		}

		.goal-unit {
			color: $app-muted;
			font-size: 0.76rem;
		}

		small {
			grid-column: 1 / -1;
			color: $app-muted;
			font-size: 0.72rem;
			font-weight: 600;
		}
	}

	@media (max-width: 680px) {
		.section-heading {
			display: grid;
		}

		.goal-template-controls {
			min-width: 0;
		}
	}
</style>
