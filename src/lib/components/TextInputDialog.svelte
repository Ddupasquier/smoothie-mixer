<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		open = false,
		title,
		description = "",
		label,
		placeholder = "",
		confirmLabel = "Save",
		cancelLabel = "Cancel",
		initialValue = "",
		children,
		onConfirm,
		onCancel,
	}: {
		open?: boolean;
		title: string;
		description?: string;
		label: string;
		placeholder?: string;
		confirmLabel?: string;
		cancelLabel?: string;
		initialValue?: string;
		children?: Snippet;
		onConfirm: (value: string) => void;
		onCancel: () => void;
	} = $props();

	let value = $state("");
	let wasOpen = false;

	$effect(() => {
		if (open && !wasOpen) {
			value = initialValue;
		}
		wasOpen = open;
	});

	function confirm() {
		onConfirm(value);
	}
</script>

{#if open}
	<div class="dialog-backdrop" role="presentation">
		<div
			class="dialog"
			role="dialog"
			aria-modal="true"
			aria-labelledby="text-input-dialog-title"
		>
			<header>
				<h3 id="text-input-dialog-title">{title}</h3>
				{#if description}
					<p>{description}</p>
				{/if}
			</header>

			{#if children}
				<div class="dialog-content">
					{@render children()}
				</div>
			{/if}

			<label>
				<span>{label}</span>
				<input
					type="text"
					bind:value
					{placeholder}
					onkeydown={(event) => {
						if (event.key === "Enter") confirm();
						if (event.key === "Escape") onCancel();
					}}
				/>
			</label>

			<div class="dialog-actions">
				<button class="dialog-cancel" type="button" onclick={onCancel}>
					{cancelLabel}
				</button>
				<button class="dialog-confirm" type="button" onclick={confirm}>
					{confirmLabel}
				</button>
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	@use "../../styles/variables" as *;

	.dialog-backdrop {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: grid;
		place-items: center;
		padding: $app-padding;
		background: rgba(26, 58, 90, 0.28);
		backdrop-filter: blur(2px);
	}

	.dialog {
		width: min(26rem, 100%);
		padding: $app-gap-md;
		background: $app-section-bg;
		border: $app-border;
		border-radius: $app-card-radius;
		box-shadow: 0 16px 42px rgba(0, 0, 0, 0.18);
	}

	header {
		margin-bottom: $app-gap-md;

		h3 {
			margin-bottom: 0.25rem;
			color: $app-primary;
			font-size: 1.15rem;
			font-weight: 800;
		}

		p {
			color: $app-muted;
			font-size: 0.9rem;
			line-height: 1.4;
		}
	}

	.dialog-content {
		margin-bottom: $app-gap-md;
	}

	label {
		display: grid;
		gap: 0.35rem;
		color: $app-primary;
		font-size: 0.88rem;
		font-weight: 800;
	}

	input {
		width: 100%;
		height: 2.45rem;
		padding: 0 0.75rem;
		color: $app-primary;
		background: $app-bg;
		border: $app-border;
		border-radius: $app-radius;
		font-size: 0.95rem;
		box-sizing: border-box;
	}

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.55rem;
		margin-top: $app-gap-md;
	}

	button {
		border-radius: 999px;
		font-weight: 800;
		padding: 0.55rem 1rem;
	}

	.dialog-cancel {
		color: $app-primary;
		background: $app-accent;
	}

	.dialog-confirm {
		color: $app-btn-text;
		background: $app-btn-bg;

		&:hover {
			background: $app-btn-bg-hover;
		}
	}
</style>
