<script lang="ts">
    import { goto } from "$app/navigation";
    import {
        deleteSavedDrink,
        readSavedDrinks,
        restoreSavedDrinkToMix,
        SAVED_DRINKS_CHANGED_EVENT,
        type SavedDrink,
    } from "$lib/utils/savedDrinks";
    import { onMount } from "svelte";

    let drinks = $state<SavedDrink[]>([]);

    const loadSavedDrinks = () => {
        drinks = readSavedDrinks();
    };

    const formatDate = (timestamp: number) => {
        return new Intl.DateTimeFormat(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
        }).format(new Date(timestamp));
    };

    const getIngredientSummary = (drink: SavedDrink) => {
        if (drink.foods.length === 0) return "No ingredients";
        return drink.foods
            .slice(0, 3)
            .map((food) => food.description)
            .join(", ");
    };

    const loadDrink = (drink: SavedDrink) => {
        restoreSavedDrinkToMix(drink);
        goto("/mix");
    };

    const removeDrink = (drinkId: string) => {
        deleteSavedDrink(drinkId);
        loadSavedDrinks();
    };

    onMount(() => {
        loadSavedDrinks();
        window.addEventListener("storage", loadSavedDrinks);
        window.addEventListener(SAVED_DRINKS_CHANGED_EVENT, loadSavedDrinks);
        return () => {
            window.removeEventListener("storage", loadSavedDrinks);
            window.removeEventListener(
                SAVED_DRINKS_CHANGED_EVENT,
                loadSavedDrinks,
            );
        };
    });
</script>

<div class="saved-page">
    <header class="saved-header">
        <h2>Saved Drinks</h2>
        <p>Load a saved smoothie back into Mix when you want to make it again.</p>
    </header>

    {#if drinks.length > 0}
        <div class="saved-grid">
            {#each drinks as drink}
                <article class="saved-card">
                    <div>
                        <h3>{drink.name}</h3>
                        <p>{formatDate(drink.createdAt)}</p>
                    </div>
                    <div class="saved-card__details">
                        <span>{drink.foods.length} ingredients</span>
                        <p>{getIngredientSummary(drink)}</p>
                    </div>
                    <div class="saved-card__actions">
                        <button type="button" onclick={() => loadDrink(drink)}>
                            Load
                        </button>
                        <button
                            class="saved-card__delete"
                            type="button"
                            onclick={() => removeDrink(drink.id)}
                        >
                            Delete
                        </button>
                    </div>
                </article>
            {/each}
        </div>
    {:else}
        <section class="saved-empty">
            <h3>No saved drinks yet.</h3>
            <p>Build a smoothie in Mix, then use Save to name it for later.</p>
            <button type="button" onclick={() => goto("/mix")}>Go to Mix</button>
        </section>
    {/if}
</div>

<style lang="scss">
    @use "../../styles/variables" as *;

    .saved-page {
        max-width: $app-max-width;
        margin: 0 auto;
        padding: $app-padding 0;
        box-sizing: border-box;
    }

    .saved-header {
        margin-bottom: $app-gap-md;

        h2 {
            margin-bottom: 0.25rem;
            color: $app-primary;
        }

        p {
            color: $app-muted;
        }
    }

    .saved-grid {
        display: grid;
        gap: $app-gap-sm;
    }

    .saved-card,
    .saved-empty {
        padding: $app-gap-md;
        background: $app-section-bg;
        border: $app-border;
        border-radius: $app-card-radius;
        box-shadow: $app-box-shadow;
    }

    .saved-card {
        display: grid;
        gap: $app-gap-sm;

        h3 {
            color: $app-primary;
            font-size: 1.05rem;
            font-weight: 800;
        }

        p {
            color: $app-muted;
            font-size: 0.88rem;
        }
    }

    .saved-card__details {
        display: grid;
        gap: 0.2rem;

        span {
            width: fit-content;
            padding: 0.16rem 0.5rem;
            color: $app-primary;
            background: $app-accent;
            border: 1px solid $app-accent;
            border-radius: 999px;
            font-size: 0.72rem;
            font-weight: 800;
        }
    }

    .saved-card__actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;

        button {
            padding: 0.45rem 0.9rem;
            color: $app-btn-text;
            background: $app-btn-bg;
            border-radius: 999px;
            font-weight: 800;

            &:hover {
                background: $app-btn-bg-hover;
            }
        }

        .saved-card__delete {
            color: $app-primary;
            background: $app-accent;
        }
    }

    .saved-empty {
        display: grid;
        gap: $app-gap-sm;
        text-align: center;

        h3 {
            color: $app-primary;
        }

        p {
            color: $app-muted;
        }

        button {
            justify-self: center;
            padding: 0.5rem 1rem;
            color: $app-btn-text;
            background: $app-btn-bg;
            border-radius: 999px;
            font-weight: 800;
        }
    }
</style>
