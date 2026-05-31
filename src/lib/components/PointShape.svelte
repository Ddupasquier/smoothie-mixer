<script lang="ts">
	import { POINT_SHAPE_DEFAULTS } from "../../defaults/pointShapeDefaults";

	interface Props {
		points?: number;
		values?: number[];
		labels?: string[];
		size?: number;
		fillColor?: string;
		strokeColor?: string;
		gridColor?: string;
		goalColor?: string;
		fullWidth?: boolean;
		class?: string;
	}

	let {
		points = 0,
		values = [],
		labels = [],
		size = POINT_SHAPE_DEFAULTS.size,
		fillColor = POINT_SHAPE_DEFAULTS.fillColor,
		strokeColor = POINT_SHAPE_DEFAULTS.strokeColor,
		gridColor = POINT_SHAPE_DEFAULTS.gridColor,
		goalColor = POINT_SHAPE_DEFAULTS.goalColor,
		fullWidth = false,
		class: className = "",
	}: Props = $props();

	const ringCount = POINT_SHAPE_DEFAULTS.ringCount;
	const center = $derived(size / 2);
	const chartRadius = $derived(size * 0.34);
	const labelRadius = $derived(size * 0.43);
	const normalizedPoints = $derived(Math.max(0, Math.floor(points)));
	const axisCount = $derived(normalizedPoints);
	const normalizedValues = $derived(
		Array.from({ length: axisCount }, (_, index) =>
			Math.max(0, Math.min(values[index] ?? 0, 1)),
		),
	);
	const hasData = $derived(normalizedPoints > 0);

	function pointAt(index: number, scale = 1, radius = chartRadius): [number, number] {
		if (axisCount === 1) {
			return [center, center - radius * scale];
		}

		if (axisCount === 2) {
			const direction = index === 0 ? -1 : 1;
			return [center + radius * scale * direction, center];
		}

		const angle = (2 * Math.PI * index) / axisCount - Math.PI / 2;
		return [
			center + radius * scale * Math.cos(angle),
			center + radius * scale * Math.sin(angle),
		];
	}

	function pointsToString(pointsList: [number, number][]) {
		return pointsList.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
	}

	const rings = $derived(
		Array.from({ length: ringCount }, (_, index) =>
			Array.from({ length: axisCount }, (_value, axisIndex) =>
				pointAt(axisIndex, (index + 1) / ringCount),
			),
		),
	);
	const axisLines = $derived(
		Array.from({ length: axisCount }, (_value, index) => ({
			end: pointAt(index),
			label: pointAt(index, 1, labelRadius),
		})),
	);
	const goalPoints = $derived(
		Array.from({ length: axisCount }, (_value, index) => pointAt(index)),
	);
	const valuePoints = $derived(
		Array.from({ length: axisCount }, (_value, index) =>
			pointAt(index, normalizedValues[index]),
		),
	);
</script>

<svg
	class={`point-shape ${fullWidth ? "point-shape--full" : ""} ${className}`.trim()}
	width={size}
	height={size}
	viewBox={`0 0 ${size} ${size}`}
	role="img"
	aria-label={`${normalizedPoints}-axis nutrient radar chart`}
>
	{#if hasData}
		{#if axisCount === 1}
			{#each Array.from({ length: ringCount }) as _ring, index}
				<circle
					cx={center}
					cy={center}
					r={chartRadius * ((index + 1) / ringCount)}
					fill="none"
					stroke={gridColor}
					stroke-width={size * 0.003}
				/>
			{/each}
			<line
				x1={center}
				y1={center}
				x2={center}
				y2={center - chartRadius}
				stroke={gridColor}
				stroke-width={size * 0.003}
			/>
			<circle
				cx={center}
				cy={center}
				r={chartRadius}
				fill="none"
				stroke={goalColor}
				stroke-width={size * 0.006}
			/>
			<circle
				class="point-shape__value-circle"
				cx={center}
				cy={center}
				r={chartRadius * normalizedValues[0]}
				fill={fillColor}
				stroke={strokeColor}
				stroke-width={size * 0.007}
			/>
		{:else if axisCount === 2}
			{#each Array.from({ length: ringCount }) as _ring, index}
				<line
					x1={center - chartRadius * ((index + 1) / ringCount)}
					y1={center}
					x2={center + chartRadius * ((index + 1) / ringCount)}
					y2={center}
					stroke={gridColor}
					stroke-width={size * 0.003}
				/>
			{/each}
			<line
				x1={center - chartRadius}
				y1={center}
				x2={center + chartRadius}
				y2={center}
				stroke={goalColor}
				stroke-width={size * 0.006}
				stroke-linecap="round"
			/>
			<line
				x1={center - chartRadius * normalizedValues[0]}
				y1={center}
				x2={center + chartRadius * normalizedValues[1]}
				y2={center}
				stroke={strokeColor}
				stroke-width={size * 0.03}
				stroke-linecap="round"
			/>
		{:else}
			{#each rings as ring}
				<polygon
					class="point-shape__ring"
					points={pointsToString(ring)}
					fill="none"
					stroke={gridColor}
					stroke-width={size * 0.003}
				/>
			{/each}

			{#each axisLines as axis}
				<line
					class="point-shape__axis"
					x1={center}
					y1={center}
					x2={axis.end[0]}
					y2={axis.end[1]}
					stroke={gridColor}
					stroke-width={size * 0.003}
				/>
			{/each}

			<polygon
				class="point-shape__goal"
				points={pointsToString(goalPoints)}
				fill="none"
				stroke={goalColor}
				stroke-width={size * 0.006}
			/>

			<polygon
				class="point-shape__value"
				points={pointsToString(valuePoints)}
				fill={fillColor}
				stroke={strokeColor}
				stroke-width={size * 0.007}
			/>
		{/if}

		{#each axisLines as axis, index}
			<text
				class="point-shape__label"
				x={axis.label[0]}
				y={axis.label[1]}
				text-anchor={axis.label[0] < center - 4
					? "end"
					: axis.label[0] > center + 4
						? "start"
						: "middle"}
				dominant-baseline="middle"
			>
				{labels[index] ?? ""}
			</text>
		{/each}
	{/if}
</svg>

<style lang="scss">
	.point-shape {
		display: block;
		overflow: visible;
	}

	.point-shape--full {
		width: 100%;
		height: auto;
	}

	.point-shape__label {
		fill: #1a3a5a;
		font-size: 0.72rem;
		font-weight: 700;
	}

	.point-shape__value-circle {
		transition:
			r 0.32s ease-out,
			fill 0.18s ease,
			stroke 0.18s ease;
	}

	.point-shape__value {
		transition:
			fill 0.18s ease,
			stroke 0.18s ease;
	}
</style>
