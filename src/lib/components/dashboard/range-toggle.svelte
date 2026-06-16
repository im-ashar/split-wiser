<script lang="ts">
	import { cn } from '$lib/utils/cn';

	type Props = {
		current: number;
		options: number[];
		class?: string;
	};

	let { current, options, class: className }: Props = $props();

	function labelFor(days: number): string {
		if (days >= 365) return '1y';
		if (days >= 90) return '90d';
		return `${days}d`;
	}
</script>

<div
	class={cn(
		'inline-flex items-center gap-1 rounded-lg border border-default bg-surface-muted p-1',
		className
	)}
	role="tablist"
	aria-label="Time range"
>
	{#each options as days (days)}
		<a
			role="tab"
			aria-selected={days === current}
			href={`?range=${days}`}
			data-sveltekit-replacestate
			class={cn(
				'inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-medium transition-colors',
				days === current
					? 'bg-surface text-fg shadow-token-sm'
					: 'text-fg-muted hover:text-fg'
			)}
		>
			{labelFor(days)}
		</a>
	{/each}
</div>
