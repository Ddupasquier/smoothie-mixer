<script lang="ts">
	import CheckboxGroup from "$lib/components/common/CheckboxGroup.svelte";
	import type { NutrientOption } from "$lib/utils/mix/mixUi";
	import { ALL_NUTRIENTS } from "../../../variables/allNutrients";

	let {
		options,
		selected,
		selectedCount,
		onChange,
		onAddNutrient,
	}: {
		options: NutrientOption[];
		selected: (string | number)[];
		selectedCount: number;
		onChange: (next: (string | number)[]) => void;
		onAddNutrient: (id: string | number) => void;
	} = $props();

	let addNutrientId = $state<string | number>("");

	const addNutrient = () => {
		if (!addNutrientId) return;
		onAddNutrient(addNutrientId);
		addNutrientId = "";
	};
</script>

<section class="setup-card setup-card--nutrients">
	<div class="panel-header">
		<div>
			<h3 id="nutrient-controls-title">Nutrients</h3>
			<p>{selectedCount} selected for the graph</p>
		</div>
		<div class="add-nutrient-controls">
			<label for="add-nutrient">Add nutrient</label>
			<select id="add-nutrient" name="add-nutrient" bind:value={addNutrientId}>
				<option value="">Select nutrient</option>
				{#each ALL_NUTRIENTS.filter((nutrient) => !options.some((option) => option.id == nutrient.id)) as nutrient}
					<option value={nutrient.id}>{nutrient.label}</option>
				{/each}
			</select>
			<button type="button" onclick={addNutrient} disabled={!addNutrientId}>
				Add
			</button>
		</div>
	</div>

	<div class="mix-nutrients" aria-label="Selected nutrients">
		<CheckboxGroup {options} {selected} onChange={onChange} />
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

	.panel-header {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(220px, 300px);
		gap: $app-gap-sm;
		align-items: end;
		margin-bottom: $app-gap-sm;

		h3 {
			margin-bottom: 0.1rem;
			color: $app-primary;
			font-size: $app-font-size-lg;
			font-weight: 800;
		}

		p {
			color: $app-muted;
			font-size: $app-font-size-sm;
			font-weight: 600;
		}
	}

	.add-nutrient-controls {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 4.5rem;
		gap: 0.4rem;

		label {
			grid-column: 1 / -1;
			color: $app-muted;
			font-size: $app-font-size-xs;
			font-weight: 700;
			line-height: 1;
		}

		select {
			width: 100%;
			min-width: 0;
			height: $app-control-height;
			padding: 0 0.55rem;
			color: $app-primary;
			background: $app-bg;
			border: $app-border;
			border-radius: $app-radius-sm;
			font-size: $app-font-size-md;
		}

		button {
			height: $app-control-height;
			padding: 0 0.65rem;
			background: $app-btn-bg;
			color: $app-btn-text;
			font-size: $app-font-size-sm;

			&:hover:not(:disabled) {
				background: $app-btn-bg-hover;
			}

			&:disabled {
				cursor: not-allowed;
				background: $app-btn-disabled;
			}
		}
	}

	.mix-nutrients {
		display: flex;
		align-content: flex-start;

		:global(.checkbox-group) {
			gap: 0.35rem;
		}

		:global(.checkbox-item) {
			min-height: 1.85rem;
			padding: 0.3rem 0.55rem;
			font-size: $app-font-size-sm;
		}

		:global(input) {
			width: 0.8rem;
			height: 0.8rem;
		}
	}

	@media (max-width: $app-breakpoint-md) {
		.panel-header {
			grid-template-columns: 1fr;
		}

		.add-nutrient-controls {
			grid-template-columns: minmax(0, 1fr) 4.5rem;
		}
	}
</style>
