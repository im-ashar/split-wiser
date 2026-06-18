<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/cn';

	let { class: className, children }: { class?: string; children?: Snippet } = $props();
</script>

<div
	class={cn(
		'flex items-center justify-end gap-3 border-t border-default px-6 py-4',
		className
	)}
>
	{@render children?.()}
</div>
