<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';

	type Props = HTMLAttributes<HTMLDivElement> & {
		class?: string;
		children?: Snippet;
	};

	let { class: className, children, ...rest }: Props = $props();
</script>

<div
	class={cn(
		'rounded-xl border border-default bg-surface text-fg shadow-token-sm',
		className
	)}
	{...rest}
>
	{@render children?.()}
</div>
