<script lang="ts">
    import type { FdcFood } from "$lib/utils/types";
    let { results, onSelect } = $props<{
        results: FdcFood[];
        onSelect: (food: FdcFood) => void;
    }>();
    function formatName(desc: string): string {
        return desc.length > 60 ? desc.slice(0, 57) + "…" : desc;
    }
</script>

{#if results.length > 0}
    <ul class="results-list" role="listbox" aria-label="Search results">
        {#each results as food (food.fdcId)}
            <li class="result-item">
                <button
                    class="result-btn"
                    role="option"
                    aria-selected="false"
                    onclick={() => onSelect(food)}
                >
                    <span class="result-name"
                        >{formatName(food.description)}</span
                    >
                    {#if food.foodCategory}
                        <span class="result-category">{food.foodCategory}</span>
                    {/if}
                </button>
            </li>
        {/each}
    </ul>
{/if}

<style>
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
