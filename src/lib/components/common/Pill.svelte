<script lang="ts">
    let {
        label,
        onRemove,
        onSelect,
        active = false,
        custom = false,
    } = $props<{
        label: string;
        onRemove: () => void;
        onSelect?: () => void;
        active?: boolean;
        custom?: boolean;
    }>();
</script>

<span
    class="pill {active ? 'active' : ''}"
    class:custom
    role="button"
    tabindex="0"
    onclick={onSelect}
    onkeydown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
            onSelect && onSelect();
        }
    }}
>
    {label}
    {#if custom}
        <span class="pill-custom-marker">Custom</span>
    {/if}
    <button
        class="pill-remove"
        aria-label="Remove"
        tabindex="-1"
        onclick={(e) => {
            e.stopPropagation();
            onRemove();
        }}>&times;</button
    >
</span>

<style lang="scss">
    @use "../../../styles/variables" as *;
    .pill {
        display: inline-flex;
        align-items: center;
        background: $app-accent;
        color: $app-primary;
        border-radius: 25px;
        padding: 0.18em 0.7em 0.18em 0.7em;
        font-size: 0.97em;
        font-weight: 500;
        border: 1px solid $app-accent;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
        margin-bottom: 0.1em;
        cursor: pointer;
        transition: background 0.15s;
    }
    .pill.active {
        background: $app-primary;
        color: $app-btn-text;
        border-color: $app-primary;

        .pill-remove {
            color: $app-btn-text;
        }
    }
    .pill.custom {
        background: $app-custom-bg;
        border-color: $app-custom-strong;
    }

    .pill-custom-marker {
        margin-left: 0.35rem;
        padding: 0.04rem 0.32rem;
        color: $app-btn-text;
        background: $app-custom-strong;
        border-radius: 999px;
        font-size: 0.62em;
        font-weight: 800;
        line-height: 1.2;
        text-transform: uppercase;
        letter-spacing: 0.03em;
    }
    .pill.custom.active {
        background: $app-custom-strong;
        color: $app-btn-text;
        border-color: $app-custom-strong;

        .pill-remove {
            color: $app-btn-text;
        }
    }

    .pill:active {
        background: $app-primary;
    }
    .pill-remove {
        background: none;
        border: none;
        color: $app-primary;
        font-size: 1.1em;
        margin-left: 0.3em;
        cursor: pointer;
        padding: 0 0.1em;
        line-height: 1;
        &:focus {
            outline: 2px solid $app-primary;
        }
    }
</style>
