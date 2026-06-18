<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Component as SvelteComponent } from 'svelte';
	import { cn } from '$lib/utils/cn';
	import Card from '$lib/components/ui/card.svelte';

	type Props = {
		label: string;
		value: string;
		icon?: SvelteComponent<{ class?: string }>;
		hint?: string;
		trend?: 'up' | 'down' | 'flat';
		class?: string;
		action?: Snippet;
	};

	let { label, value, icon: Icon, hint, trend, class: className, action }: Props = $props();
</script>

<Card class={cn('px-5 py-4', className)}>
	<div class="flex items-start justify-between gap-3">
		<div class="min-w-0">
			<div class="flex items-center gap-2">
				{#if Icon}
					<Icon class="size-4 text-fg-subtle" />
				{/if}
				<div class="text-xs font-medium uppercase tracking-wide text-fg-muted">
					{label}
				</div>
			</div>
			<div class="mt-1 font-mono text-2xl font-semibold text-fg">{value}</div>
			{#if hint}
				<div
					class={cn(
						'mt-0.5 text-xs',
						trend === 'up' && 'text-success',
						trend === 'down' && 'text-danger',
						(!trend || trend === 'flat') && 'text-fg-muted'
					)}
				>
					{hint}
				</div>
			{/if}
		</div>
		{#if action}
			<div>{@render action()}</div>
		{/if}
	</div>
</Card>
