<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';

	type Props = HTMLInputAttributes & {
		class?: string;
		value?: string | number | null | undefined;
	};

	let { class: className, value = $bindable(), ...rest }: Props = $props();
</script>

<input
	class={cn(
		'flex h-10 w-full rounded-md border border-default bg-surface-muted px-3 py-2 text-sm transition-colors',
		'placeholder:text-fg-subtle focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
		'disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	bind:value
	{...rest}
/>
