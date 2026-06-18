<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/cn';

	let { class: className, children }: { class?: string; children?: Snippet } = $props();
</script>

<div class={cn('px-6 pb-6', className)}>
	{@render children?.()}
</div>
