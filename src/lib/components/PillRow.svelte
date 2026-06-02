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
</script>

<div class="pill-row">
    {#each pills as pill, i}
        <Pill
            label={pill}
            onRemove={() => onRemove(i)}
            onSelect={() => onSelect && onSelect(i)}
            active={activeIndices.includes(i)}
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
