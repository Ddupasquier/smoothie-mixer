<script lang="ts">
	const steps = [
		{
			title: "Search",
			text: "Find ingredients on the Fridge tab.",
		},
		{
			title: "Save",
			text: "Add useful items to your fridge or shopping list.",
		},
		{
			title: "Select",
			text: "Choose ingredient pills here for this smoothie.",
		},
		{
			title: "Adjust",
			text: "Set amounts and review the graph.",
		},
	];
</script>

<section class="mix-empty-state" aria-label="How to build a smoothie">
	<div class="mix-empty-state__intro">
		<p class="mix-empty-state__eyebrow">No ingredients selected yet</p>
		<h4>Build a smoothie in four steps.</h4>
		<p>
			Start by adding ingredients to your fridge or shopping list, then select
			them here to calculate goals, warnings, and graph totals.
		</p>
	</div>

	<ol class="mix-empty-state__steps">
		{#each steps as step, index}
			<li>
				<span>{index + 1}</span>
				<div>
					<strong>{step.title}</strong>
					<p>{step.text}</p>
				</div>
			</li>
		{/each}
	</ol>

	<div class="mix-empty-state__actions">
		<a href="/fridge">Go to Fridge</a>
		<p>If items are already listed above, click a pill to add it to the mix.</p>
	</div>
</section>

<style lang="scss">
	@use "../../../styles/variables" as *;

	.mix-empty-state {
		display: grid;
		gap: $app-gap-sm;
		padding: $app-gap-md;
		background: $app-bg;
		border: $app-border;
		border-radius: $app-card-radius;
		box-shadow: $app-card-shadow;
	}

	.mix-empty-state__intro {
		display: grid;
		gap: 0.25rem;

		h4 {
			color: $app-primary;
			font-size: 1rem;
			font-weight: 800;
		}

		p {
			color: $app-muted;
			font-size: 0.86rem;
			line-height: 1.4;
		}
	}

	.mix-empty-state__intro .mix-empty-state__eyebrow {
		color: $app-primary;
		font-size: 0.72rem;
		font-weight: 900;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.mix-empty-state__steps {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(115px, 1fr));
		gap: 0.45rem;
		list-style: none;
	}

	li {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 0.45rem;
		align-items: start;
		min-width: 0;
		padding: 0.55rem;
		background: $app-section-bg;
		border: $app-border;
		border-radius: $app-radius;
	}

	span {
		display: grid;
		place-items: center;
		width: 1.35rem;
		height: 1.35rem;
		color: $app-primary;
		background: $app-accent;
		border-radius: $app-radius-pill;
		font-size: 0.72rem;
		font-weight: 900;
	}

	strong {
		display: block;
		color: $app-primary;
		font-size: 0.8rem;
		font-weight: 800;
	}

	li p {
		color: $app-muted;
		font-size: 0.74rem;
		font-weight: 600;
		line-height: 1.3;
	}

	.mix-empty-state__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;

		a {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			min-height: 2rem;
			padding: 0 0.75rem;
			color: $app-btn-text;
			background: $app-btn-bg;
			border-radius: $app-radius;
			font-size: 0.82rem;
			font-weight: 800;
			text-decoration: none;

			&:hover {
				background: $app-btn-bg-hover;
			}
		}

		p {
			color: $app-muted;
			font-size: 0.78rem;
			font-weight: 600;
			line-height: 1.35;
		}
	}
</style>
