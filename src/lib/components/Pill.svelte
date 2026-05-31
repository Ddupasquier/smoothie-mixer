<script lang="ts">
    let { label, onRemove } = $props<{ label: string; onRemove: () => void }>();
</script>

<span class="pill">
    {label}
    <button
        class="pill-remove"
        aria-label="Remove"
        tabindex="-1"
        onclick={onRemove}>&times;</button
    >
</span>

<style>
    .pill {
        display: inline-flex;
        align-items: center;
        background: #e6f0fa;
        color: #1a3a5a;
        border-radius: 999px;
        padding: 0.18em 0.7em 0.18em 0.7em;
        font-size: 0.97em;
        font-weight: 500;
        border: 1px solid #b3d3f6;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
        margin-bottom: 0.1em;
    }
    .pill-remove {
        background: none;
        border: none;
        color: #1a3a5a;
        font-size: 1.1em;
        margin-left: 0.3em;
        cursor: pointer;
        padding: 0 0.1em;
        line-height: 1;
    }
    .pill-remove:focus {
        outline: 2px solid #1a3a5a;
    }
</style>
