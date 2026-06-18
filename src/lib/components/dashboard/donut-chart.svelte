<script lang="ts" module>
	// Categorical palette — chosen to keep AA contrast on slate surfaces.
	export const CATEGORICAL_COLORS = [
		'var(--primary)',
		'#10b981', // emerald-500
		'#f59e0b', // amber-500
		'#fb7185', // rose-400
		'#0ea5e9', // sky-500
		'#a78bfa', // violet-400
		'#14b8a6', // teal-500
		'#fb923c' // orange-400
	] as const;
</script>

<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import { formatMoney } from '$lib/utils/money';

	type Slice = { label: string; amount: number };

	type Props = {
		slices: Slice[];
		currency: string;
		size?: number;
		maxSlices?: number;
		class?: string;
	};

	let { slices, currency, size = 180, maxSlices = 6, class: className }: Props = $props();

	// Collapse the long tail into "Other".
	const display = $derived.by(() => {
		if (slices.length <= maxSlices) return slices.slice();
		const top = slices.slice(0, maxSlices - 1);
		const restAmount = slices.slice(maxSlices - 1).reduce((s, x) => s + x.amount, 0);
		return [...top, { label: 'Other', amount: restAmount }];
	});

	const total = $derived(display.reduce((s, x) => s + x.amount, 0));

	const radius = $derived(size / 2 - 2);
	const innerRadius = $derived(radius * 0.62);
	const cx = $derived(size / 2);
	const cy = $derived(size / 2);

	function polar(angle: number, r: number): { x: number; y: number } {
		return {
			x: cx + Math.cos(angle) * r,
			y: cy + Math.sin(angle) * r
		};
	}

	const segments = $derived.by(() => {
		if (total <= 0) return [];
		let start = -Math.PI / 2;
		return display.map((slice, i) => {
			const frac = slice.amount / total;
			const end = start + frac * Math.PI * 2;
			const largeArc = end - start > Math.PI ? 1 : 0;
			const outerStart = polar(start, radius);
			const outerEnd = polar(end, radius);
			const innerStart = polar(end, innerRadius);
			const innerEnd = polar(start, innerRadius);
			const path = [
				`M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
				`A ${radius} ${radius} 0 ${largeArc} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
				`L ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
				`A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
				'Z'
			].join(' ');
			start = end;
			return {
				path,
				color: CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length],
				label: slice.label,
				amount: slice.amount,
				pct: frac
			};
		});
	});
</script>

<div class={cn('flex flex-col items-center gap-4 sm:flex-row sm:items-start', className)}>
	<svg
		viewBox={`0 0 ${size} ${size}`}
		width={size}
		height={size}
		role="img"
		aria-label="Spending by category"
		class="shrink-0"
	>
		{#if total <= 0}
			<circle
				cx={cx}
				cy={cy}
				r={radius}
				fill="none"
				stroke="var(--surface-muted)"
				stroke-width={radius - innerRadius}
			/>
		{:else}
			{#each segments as seg, i (i)}
				<path d={seg.path} fill={seg.color}>
					<title>{seg.label}: {formatMoney(seg.amount, currency)}</title>
				</path>
			{/each}
		{/if}
		<text
			x={cx}
			y={cy - 6}
			text-anchor="middle"
			class="fill-fg-muted"
			font-size="10"
		>Total</text>
		<text
			x={cx}
			y={cy + 12}
			text-anchor="middle"
			class="fill-fg font-mono"
			font-size="14"
			font-weight="600"
		>{formatMoney(total, currency)}</text>
	</svg>

	<ul class="flex flex-1 flex-col gap-2 self-stretch text-sm">
		{#each segments as seg, i (i)}
			<li class="flex items-center gap-2">
				<span
					class="inline-block size-2.5 shrink-0 rounded-sm"
					style="background-color: {seg.color}"
					aria-hidden="true"
				></span>
				<span class="min-w-0 flex-1 truncate text-fg">{seg.label}</span>
				<span class="font-mono text-xs text-fg-muted">{(seg.pct * 100).toFixed(0)}%</span>
				<span class="font-mono text-fg">{formatMoney(seg.amount, currency)}</span>
			</li>
		{:else}
			<li class="text-sm text-fg-muted">No data in this period.</li>
		{/each}
	</ul>
</div>
