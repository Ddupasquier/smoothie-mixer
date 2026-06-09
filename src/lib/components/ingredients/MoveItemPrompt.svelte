<script lang="ts">
    let { message, onConfirm, onCancel } = $props<{
        message: string;
        onConfirm: () => void;
        onCancel: () => void;
    }>();
</script>

<div class="prompt-modal move-prompt">
    <div class="prompt-title">{message}</div>
    <div class="prompt-actions">
        <button class="prompt-btn confirm" type="button" onclick={onConfirm}
            >Move</button
        >
        <button class="prompt-btn" type="button" onclick={onCancel}
            >Cancel</button
        >
    </div>
</div>

<style lang="scss">
    @use "../../../styles/variables" as *;
    .move-prompt {
        background: $app-section-bg;
        border-radius: $app-card-radius;
        box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.13);
        padding: 2em 2.2em 1.5em 2.2em;
        min-width: 320px;
        max-width: 90vw;
        margin: 1.2rem 0;
        display: flex;
        flex-direction: column;
        align-items: center;

        .prompt-title {
            font-size: 1.13em;
            font-weight: 600;
            margin-bottom: 0.7em;
            color: $app-primary;
            text-align: center;
        }

        .prompt-actions {
            display: flex;
            gap: 1.2em;
            margin-top: 1.2em;

            .prompt-btn {
                background: $app-accent;
                color: $app-primary;
                border: 1px solid $app-accent;
                border-radius: 999px;
                padding: 0.5em 1.3em;
                font-size: 1em;
                font-weight: 500;
                cursor: pointer;
                transition: background 0.13s;

                &.confirm {
                    background: $app-primary;
                    color: $app-btn-text;
                    border: 1px solid $app-primary;
                }

                &:focus {
                    outline: 2px solid $app-primary;
                }
            }
        }
    }
</style>
