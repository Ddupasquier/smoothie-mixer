<script lang="ts">
    import NutritionConfidenceDetails from "$lib/components/ingredients/NutritionConfidenceDetails.svelte";
    import { getFoodQuality } from "$lib/utils/food/foodQuality";
    import type { FdcFood } from "$lib/utils/food/types";
    let { results, onSelect } = $props<{
        results: FdcFood[];
        onSelect: (food: FdcFood) => void;
    }>();
    const formatName = (desc: string): string => {
        return desc.length > 60 ? desc.slice(0, 57) + "…" : desc;
    };
</script>

{#if results.length > 0}
    <ul class="results-list" role="listbox" aria-label="Search results">
        {#each results as food (food.fdcId)}
            {@const quality = getFoodQuality(food)}
            <li class="result-item">
                <button
                    class="result-btn"
                    class:result-btn--custom={food.customFood}
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
                    <span class="result-badges" aria-label={quality.title}>
                        <span class="result-badge" title={quality.title}>
                            {quality.symbol} {quality.label}
                        </span>
                        {#if food.dataType}
                            <span
                                class="result-badge"
                                class:result-badge--custom={food.customFood}
                                class:result-badge--muted={!food.customFood}
                            >
                                {food.dataType}
                            </span>
                        {/if}
                        {#if food.servingSize && food.servingSizeUnit}
                            <span class="result-badge result-badge--muted">
                                ↔ {food.servingSize} {food.servingSizeUnit}
                            </span>
                        {/if}
                    </span>
                    {#if quality.label === "Partial" || quality.label === "Limited"}
                        <NutritionConfidenceDetails {quality} compact />
                    {/if}
                </button>
            </li>
        {/each}
    </ul>
{/if}

<style lang="scss">
    @use "../../../styles/variables" as *;

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
    .result-btn--custom {
        box-shadow: inset 0.28rem 0 0 $app-custom-strong;
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
    .result-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        margin-top: 0.18rem;
    }
    .result-badge {
        width: fit-content;
        padding: 0.12rem 0.38rem;
        color: var(--color-text);
        background: var(--color-primary-light);
        border: 1px solid var(--color-border);
        border-radius: 999px;
        font-size: 0.68rem;
        font-weight: 700;
        line-height: 1.2;
    }
    .result-badge--muted {
        color: var(--color-text-muted);
        background: var(--color-surface);
    }
    .result-badge--custom {
        color: $app-btn-text;
        background: $app-custom-strong;
        border-color: $app-custom-strong;
    }
</style>
