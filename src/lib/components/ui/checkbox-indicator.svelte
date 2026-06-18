<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Minus from '@lucide/svelte/icons/minus';
	import { cn } from '$lib/utils/cn';

	type Props = {
		checked: boolean;
		indeterminate?: boolean;
		class?: string;
	};

	let { checked, indeterminate = false, class: className }: Props = $props();
</script>

<span
	class={cn(
		'inline-flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
		checked || indeterminate
			? 'border-primary bg-primary text-primary-fg'
			: 'border-border-strong bg-surface',
		className
	)}
	aria-hidden="true"
>
	{#if indeterminate}
		<Minus class="size-3" />
	{:else if checked}
		<Check class="size-3" />
	{/if}
</span>
