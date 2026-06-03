<script lang="ts">
    import Pill from "./Pill.svelte";
    let {
        pills,
        onRemove,
        onSelect,
        activeIndices = [],
    } = $props<{
        pills: string[];
        onRemove: (idx: number) => void;
        onSelect?: (idx: number) => void;
        activeIndices?: number[];
    }>();

    type ArrangedPill = {
        label: string;
        index: number;
        active: boolean;
    };

    function arrangePills(
        pillLabels: string[],
        selectedIndices: number[],
    ): ArrangedPill[] {
        return pillLabels
            .map((label, index) => ({
                label,
                index,
                active: selectedIndices.includes(index),
            }))
            .sort((a, b) => {
                if (a.active !== b.active) return a.active ? -1 : 1;
                if (a.label.length !== b.label.length) {
                    return a.label.length - b.label.length;
                }
                return a.label.localeCompare(b.label);
            });
    }

    const arrangedPills = $derived(arrangePills(pills, activeIndices));
</script>

<div class="pill-row">
    {#each arrangedPills as pill (`${pill.index}-${pill.label}`)}
        <Pill
            label={pill.label}
            onRemove={() => onRemove(pill.index)}
            onSelect={() => onSelect && onSelect(pill.index)}
            active={pill.active}
        />
    {/each}
</div>

<style lang="scss">
    .pill-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4em;
        margin: 0.5em 0 0.2em 0;
    }
</style>
