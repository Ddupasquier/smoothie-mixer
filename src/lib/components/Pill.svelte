<script lang="ts">
    let {
        label,
        onRemove,
        onSelect,
        active = false,
    } = $props<{
        label: string;
        onRemove: () => void;
        onSelect?: () => void;
        active?: boolean;
    }>();
</script>

<span
    class="pill {active ? 'active' : ''}"
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
    @use "../../styles/variables" as *;
    .pill {
        display: inline-flex;
        align-items: center;
        background: $app-accent;
        color: $app-primary;
        border-radius: 25px;
        padding: 0.18em 0.7em 0.18em 0.7em;
        font-size: 0.97em;
        font-weight: 500;
        border: 1px solid #b3d3f6;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
        margin-bottom: 0.1em;
        cursor: pointer;
        transition: background 0.15s;
    }
    .pill.active {
        /* Active state: slightly darker than $app-accent for contrast */
        background: #c6dff0; /* fallback darker tint */
        color: #fff;
    }
    .pill:active {
        background: #b0cfe6;
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
