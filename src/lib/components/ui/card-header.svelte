<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/cn';

	let { class: className, children }: { class?: string; children?: Snippet } = $props();
</script>

<div class={cn('flex flex-col gap-1.5 px-6 pt-6 pb-4', className)}>
	{@render children?.()}
</div>
