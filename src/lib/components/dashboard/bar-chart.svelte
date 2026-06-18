<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import { formatMoney } from '$lib/utils/money';

	type Bar = {
		label: string;
		value: number;
		color?: string; // CSS color or var(--…)
		sublabel?: string;
		avatar?: string;
	};

	type Props = {
		bars: Bar[];
		currency: string;
		signed?: boolean; // if true, color positive vs negative and show magnitude
		emptyText?: string;
		class?: string;
	};

	let {
		bars,
		currency,
		signed = false,
		emptyText = 'No data in this period.',
		class: className
	}: Props = $props();

	const maxMag = $derived(
		bars.length === 0 ? 1 : Math.max(...bars.map((b) => Math.abs(b.value)), 1)
	);

	function colorFor(b: Bar): string {
		if (b.color) return b.color;
		if (signed) return b.value >= 0 ? 'var(--success)' : 'var(--danger)';
		return 'var(--primary)';
	}
</script>

<div class={cn('flex flex-col gap-3', className)}>
	{#if bars.length === 0}
		<div class="rounded-md border border-dashed border-default px-4 py-6 text-center text-sm text-fg-muted">
			{emptyText}
		</div>
	{:else}
		{#each bars as b, i (i)}
			{@const pct = (Math.abs(b.value) / maxMag) * 100}
			<div class="flex flex-col gap-1">
				<div class="flex items-center justify-between gap-3 text-sm">
					<div class="flex min-w-0 items-center gap-2">
						{#if b.avatar}
							<img src={b.avatar} alt="" class="size-6 shrink-0 rounded-full border border-default" />
						{/if}
						<div class="min-w-0">
							<div class="truncate font-medium text-fg">{b.label}</div>
							{#if b.sublabel}
								<div class="truncate text-xs text-fg-muted">{b.sublabel}</div>
							{/if}
						</div>
					</div>
					<div class={cn('font-mono text-sm', signed && b.value < 0 ? 'text-danger' : signed && b.value > 0 ? 'text-success' : 'text-fg')}>
						{signed && b.value !== 0 ? (b.value > 0 ? '+' : '−') : ''}{formatMoney(Math.abs(b.value), currency)}
					</div>
				</div>
				<div class="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
					<div
						class="h-full rounded-full transition-[width] duration-300"
						style="width: {pct.toFixed(2)}%; background-color: {colorFor(b)};"
					></div>
				</div>
			</div>
		{/each}
	{/if}
</div>
