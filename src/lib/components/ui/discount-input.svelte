<script lang="ts">
	import type { DiscountValue } from '$lib/split/discount';
	import Input from '$lib/components/ui/input.svelte';
	import { cn } from '$lib/utils/cn';

	type Props = {
		value: DiscountValue;
		currency?: string;
		placeholder?: string;
		id?: string;
		ariaLabel?: string;
		class?: string;
		onChange: (next: DiscountValue) => void;
	};

	let {
		value,
		currency = '',
		placeholder = '0',
		id,
		ariaLabel,
		class: className,
		onChange
	}: Props = $props();

	function setUnit(unit: 'pct' | 'amt') {
		if (unit === value.unit) return;
		onChange({ value: value.value, unit });
	}

	function setValue(next: number) {
		const safe = Number.isFinite(next) && next >= 0 ? next : 0;
		onChange({ value: safe, unit: value.unit });
	}
</script>

<div class={cn('flex h-10 w-full overflow-hidden rounded-md border border-default bg-surface-muted focus-within:border-primary focus-within:ring-2 focus-within:ring-ring', className)}>
	<Input
		{id}
		type="number"
		min="0"
		step="0.01"
		{placeholder}
		aria-label={ariaLabel}
		class="h-full flex-1 rounded-none border-0 bg-transparent !ring-0 focus-visible:!ring-0"
		value={value.value || ''}
		oninput={(e) => setValue(Number((e.currentTarget as HTMLInputElement).value))}
	/>
	<div class="flex shrink-0 items-stretch border-l border-default bg-surface" role="group" aria-label="Discount unit">
		<button
			type="button"
			class={cn(
				'inline-flex items-center px-3 text-xs font-semibold transition-colors',
				value.unit === 'pct'
					? 'bg-primary text-primary-fg'
					: 'text-fg-muted hover:bg-surface-muted hover:text-fg'
			)}
			onclick={() => setUnit('pct')}
			aria-pressed={value.unit === 'pct'}
		>
			%
		</button>
		<button
			type="button"
			class={cn(
				'inline-flex items-center px-3 text-xs font-semibold transition-colors',
				value.unit === 'amt'
					? 'bg-primary text-primary-fg'
					: 'text-fg-muted hover:bg-surface-muted hover:text-fg'
			)}
			onclick={() => setUnit('amt')}
			aria-pressed={value.unit === 'amt'}
		>
			{currency || 'Amt'}
		</button>
	</div>
</div>
