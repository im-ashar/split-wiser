<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import { formatMoney } from '$lib/utils/money';

	type Props = {
		points: Array<{ date: string; amount: number }>;
		currency: string;
		height?: number;
		class?: string;
	};

	let { points, currency, height = 180, class: className }: Props = $props();

	const width = 600; // SVG viewBox width; scales to container
	const padding = { top: 16, right: 12, bottom: 24, left: 12 };

	const max = $derived(Math.max(1, ...points.map((p) => p.amount)));
	const innerW = $derived(width - padding.left - padding.right);
	const innerH = $derived(height - padding.top - padding.bottom);

	const stepX = $derived(points.length > 1 ? innerW / (points.length - 1) : 0);

	function pointX(i: number): number {
		return padding.left + i * stepX;
	}
	function pointY(amount: number): number {
		return padding.top + innerH - (amount / max) * innerH;
	}

	const linePath = $derived.by(() => {
		if (points.length === 0) return '';
		return points
			.map((p, i) => `${i === 0 ? 'M' : 'L'} ${pointX(i).toFixed(2)} ${pointY(p.amount).toFixed(2)}`)
			.join(' ');
	});

	const areaPath = $derived.by(() => {
		if (points.length === 0) return '';
		const baseY = padding.top + innerH;
		const head = `M ${pointX(0).toFixed(2)} ${baseY}`;
		const middle = points
			.map((p, i) => `L ${pointX(i).toFixed(2)} ${pointY(p.amount).toFixed(2)}`)
			.join(' ');
		const tail = `L ${pointX(points.length - 1).toFixed(2)} ${baseY} Z`;
		return `${head} ${middle} ${tail}`;
	});

	const maxIdx = $derived.by(() => {
		let m = 0;
		for (let i = 1; i < points.length; i++) {
			if ((points[i]?.amount ?? 0) > (points[m]?.amount ?? 0)) m = i;
		}
		return m;
	});

	const firstLabel = $derived(points[0]?.date ?? '');
	const lastLabel = $derived(points[points.length - 1]?.date ?? '');

	function formatDate(iso: string): string {
		if (!iso) return '';
		try {
			return new Date(iso + 'T00:00:00Z').toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric'
			});
		} catch {
			return iso;
		}
	}
</script>

<div class={cn('w-full', className)}>
	<svg
		viewBox={`0 0 ${width} ${height}`}
		class="h-auto w-full"
		preserveAspectRatio="none"
		role="img"
		aria-label={`Spending over ${points.length} days`}
	>
		<defs>
			<linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1">
				<stop offset="0%" stop-color="var(--primary)" stop-opacity="0.32" />
				<stop offset="100%" stop-color="var(--primary)" stop-opacity="0" />
			</linearGradient>
		</defs>

		<!-- horizontal guideline (mid) -->
		<line
			x1={padding.left}
			x2={width - padding.right}
			y1={padding.top + innerH / 2}
			y2={padding.top + innerH / 2}
			stroke="var(--border)"
			stroke-dasharray="2 4"
		/>

		<path d={areaPath} fill="url(#area-fill)" />
		<path d={linePath} fill="none" stroke="var(--primary)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />

		{#if points.length > 0}
			{@const p = points[maxIdx]}
			{#if p && p.amount > 0}
				<circle
					cx={pointX(maxIdx)}
					cy={pointY(p.amount)}
					r="3.5"
					fill="var(--primary)"
					stroke="var(--surface)"
					stroke-width="2"
				/>
			{/if}
		{/if}
	</svg>

	<div class="mt-2 flex items-center justify-between text-xs text-fg-muted">
		<span>{formatDate(firstLabel)}</span>
		{#if points[maxIdx] && (points[maxIdx]?.amount ?? 0) > 0}
			<span class="font-mono text-fg">
				Peak {formatMoney(points[maxIdx]?.amount ?? 0, currency)} · {formatDate(points[maxIdx]?.date ?? '')}
			</span>
		{/if}
		<span>{formatDate(lastLabel)}</span>
	</div>
</div>
