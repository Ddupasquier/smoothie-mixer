<script lang="ts">
	import IngredientSearch from '$lib/components/IngredientSearch.svelte';
	import IngredientCard from '$lib/components/IngredientCard.svelte';
	import NutritionPanel from '$lib/components/NutritionPanel.svelte';
	import {
		activeIngredients,
		addIngredient,
		removeIngredient,
		updateServingGrams,
		clearSmoothie,
		calcNutritionTotals,
		saveSmoothie,
		getSavedSmoothies,
		deleteSavedSmoothie,
		loadSmoothie
	} from '$lib/stores/smoothie.svelte';
	import type { FdcFood, Smoothie } from '$lib/types';

	let smoothieName = $state('');
	let saveMsg = $state('');
	let showSaved = $state(false);

	const totals = $derived(calcNutritionTotals(activeIngredients));
	const savedSmoothies = $derived(showSaved ? getSavedSmoothies() : []);

	function handleSelect(food: FdcFood) {
		addIngredient(food);
	}

	function handleSave() {
		if (activeIngredients.length === 0) return;
		saveSmoothie(smoothieName);
		saveMsg = '✅ Saved!';
		smoothieName = '';
		setTimeout(() => (saveMsg = ''), 2500);
	}

	function handleLoad(smoothie: Smoothie) {
		loadSmoothie(smoothie);
		showSaved = false;
	}

	function handleDeleteSaved(id: string) {
		deleteSavedSmoothie(id);
		// force reactivity refresh
		showSaved = false;
		showSaved = true;
	}
</script>

<svelte:head>
	<title>Smoothie Mixer</title>
</svelte:head>

<section class="card search-section">
	<IngredientSearch onSelect={handleSelect} />
</section>

{#if activeIngredients.length > 0}
	<section class="card ingredients-section">
		<div class="section-header">
			<h2 class="section-title">Your Smoothie</h2>
			<button class="btn-ghost" onclick={clearSmoothie}>Clear all</button>
		</div>

		<ul class="ingredients-list">
			{#each activeIngredients as ingredient (ingredient.fdcId)}
				<IngredientCard
					{ingredient}
					onRemove={removeIngredient}
					onUpdateGrams={updateServingGrams}
				/>
			{/each}
		</ul>
	</section>

	<section class="card">
		<NutritionPanel {totals} />
	</section>

	<section class="card save-section">
		<h2 class="section-title">Save this smoothie</h2>
		<div class="save-row">
			<input
				type="text"
				class="name-input"
				placeholder="Give it a name…"
				bind:value={smoothieName}
				onkeydown={(e) => e.key === 'Enter' && handleSave()}
				maxlength={60}
			/>
			<button class="btn-primary" onclick={handleSave}>Save</button>
		</div>
		{#if saveMsg}
			<p class="save-msg" role="status">{saveMsg}</p>
		{/if}
	</section>
{:else}
	<div class="empty-state">
		<p class="empty-icon">🥤</p>
		<p>Search for an ingredient above to start building your smoothie.</p>
	</div>
{/if}

<section class="card saved-section">
	<button class="toggle-saved" onclick={() => (showSaved = !showSaved)}>
		{showSaved ? '▲' : '▼'} Saved Smoothies
	</button>

	{#if showSaved}
		{#if savedSmoothies.length === 0}
			<p class="no-saved">No saved smoothies yet.</p>
		{:else}
			<ul class="saved-list">
				{#each savedSmoothies as s (s.id)}
					<li class="saved-item">
						<div class="saved-info">
							<span class="saved-name">{s.name}</span>
							<span class="saved-meta">{s.ingredients.length} ingredient{s.ingredients.length !== 1 ? 's' : ''}</span>
						</div>
						<div class="saved-actions">
							<button class="btn-secondary" onclick={() => handleLoad(s)}>Load</button>
							<button class="btn-danger" onclick={() => handleDeleteSaved(s.id)}>Delete</button>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</section>

<style>
	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: 1rem;
		margin-bottom: 1rem;
		box-shadow: var(--shadow);
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	.section-title {
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-primary-dark);
	}

	.ingredients-list {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.btn-primary {
		background: var(--color-primary);
		color: #fff;
		font-weight: 600;
		padding: 0.6rem 1.1rem;
	}

	.btn-primary:hover {
		background: var(--color-primary-dark);
	}

	.btn-secondary {
		background: var(--color-primary-light);
		color: var(--color-primary-dark);
		font-weight: 600;
		padding: 0.4rem 0.75rem;
		font-size: 0.85rem;
	}

	.btn-danger {
		background: #fce4e4;
		color: var(--color-danger);
		font-weight: 600;
		padding: 0.4rem 0.75rem;
		font-size: 0.85rem;
	}

	.btn-ghost {
		background: transparent;
		color: var(--color-text-muted);
		font-size: 0.85rem;
		padding: 0.3rem 0.6rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	.save-row {
		display: flex;
		gap: 0.5rem;
	}

	.name-input {
		flex: 1;
		padding: 0.6rem 0.8rem;
		border: 2px solid var(--color-border);
		border-radius: var(--radius-sm);
		outline: none;
		transition: border-color 0.15s;
	}

	.name-input:focus {
		border-color: var(--color-primary);
	}

	.save-msg {
		margin-top: 0.5rem;
		font-size: 0.9rem;
		color: var(--color-primary-dark);
	}

	.empty-state {
		text-align: center;
		padding: 2.5rem 1rem;
		color: var(--color-text-muted);
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 0.5rem;
	}

	.toggle-saved {
		background: transparent;
		color: var(--color-primary-dark);
		font-weight: 700;
		font-size: 0.95rem;
		padding: 0;
		width: 100%;
		text-align: left;
	}

	.no-saved {
		margin-top: 0.75rem;
		font-size: 0.9rem;
		color: var(--color-text-muted);
	}

	.saved-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.saved-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.6rem 0.75rem;
		background: var(--color-bg);
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
	}

	.saved-info {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.saved-name {
		font-weight: 600;
		font-size: 0.9rem;
	}

	.saved-meta {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.saved-actions {
		display: flex;
		gap: 0.4rem;
	}
</style>
