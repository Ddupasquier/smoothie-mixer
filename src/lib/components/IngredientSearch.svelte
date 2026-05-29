<script lang="ts">
	import { searchFoods } from '$lib/api/fdc';
	import type { FdcFood } from '$lib/types';

	interface Props {
		onSelect: (food: FdcFood) => void;
	}

	let { onSelect }: Props = $props();

	let query = $state('');
	let results = $state<FdcFood[]>([]);
	let loading = $state(false);
	let error = $state('');
	let debounceTimer: ReturnType<typeof setTimeout>;

	function handleInput() {
		clearTimeout(debounceTimer);
		error = '';
		if (!query.trim()) {
			results = [];
			return;
		}
		// Debounce 500 ms to avoid hammering the API
		debounceTimer = setTimeout(async () => {
			loading = true;
			try {
				results = await searchFoods(query, 15);
			} catch (e) {
				error = e instanceof Error ? e.message : 'Search failed. Check your API key in .env.';
				results = [];
			} finally {
				loading = false;
			}
		}, 500);
	}

	function select(food: FdcFood) {
		onSelect(food);
		query = '';
		results = [];
	}

	/** Format a food description to title case with max length */
	function formatName(desc: string): string {
		return desc.length > 60 ? desc.slice(0, 57) + '…' : desc;
	}
</script>

<div class="search-wrap">
	<label class="search-label" for="ingredient-search">Search ingredients</label>
	<div class="search-row">
		<input
			id="ingredient-search"
			type="search"
			class="search-input"
			placeholder="e.g. banana, spinach, almond milk…"
			bind:value={query}
			oninput={handleInput}
			autocomplete="off"
		/>
		{#if loading}
			<span class="spinner" aria-label="Searching…">⏳</span>
		{/if}
	</div>

	{#if error}
		<p class="search-error" role="alert">{error}</p>
	{/if}

	{#if results.length > 0}
		<ul class="results-list" role="listbox" aria-label="Search results">
			{#each results as food (food.fdcId)}
				<li class="result-item">
					<button
						class="result-btn"
						role="option"
						aria-selected="false"
						onclick={() => select(food)}
					>
						<span class="result-name">{formatName(food.description)}</span>
						{#if food.foodCategory}
							<span class="result-category">{food.foodCategory}</span>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.search-wrap {
		position: relative;
	}

	.search-label {
		display: block;
		font-weight: 600;
		margin-bottom: 0.4rem;
		font-size: 0.95rem;
		color: var(--color-text);
	}

	.search-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.search-input {
		flex: 1;
		padding: 0.65rem 0.9rem;
		border: 2px solid var(--color-border);
		border-radius: var(--radius-sm);
		outline: none;
		transition: border-color 0.15s;
		background: var(--color-surface);
	}

	.search-input:focus {
		border-color: var(--color-primary);
	}

	.spinner {
		font-size: 1.1rem;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.search-error {
		margin-top: 0.4rem;
		font-size: 0.85rem;
		color: var(--color-danger);
	}

	.results-list {
		list-style: none;
		margin-top: 0.4rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		overflow: hidden;
		box-shadow: var(--shadow);
		background: var(--color-surface);
		max-height: 280px;
		overflow-y: auto;
	}

	.result-btn {
		width: 100%;
		text-align: left;
		background: transparent;
		border-radius: 0;
		padding: 0.65rem 0.9rem;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		border-bottom: 1px solid var(--color-border);
	}

	.result-item:last-child .result-btn {
		border-bottom: none;
	}

	.result-btn:hover,
	.result-btn:focus-visible {
		background: var(--color-primary-light);
		outline: none;
	}

	.result-name {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--color-text);
	}

	.result-category {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}
</style>
