<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/cn';
	import type { Component as SvelteComponent } from 'svelte';

	type Props = {
		title: string;
		description?: string;
		icon?: SvelteComponent<{ class?: string }>;
		class?: string;
		action?: Snippet;
	};

	let { title, description, icon: Icon, class: className, action }: Props = $props();
</script>

<div
	class={cn(
		'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-default bg-surface px-8 py-12 text-center',
		className
	)}
>
	{#if Icon}
		<Icon class="size-6 text-fg-subtle" />
	{/if}
	<div class="flex flex-col gap-1">
		<h3 class="text-lg font-semibold text-fg">{title}</h3>
		{#if description}
			<p class="max-w-md text-sm text-fg-muted">{description}</p>
		{/if}
	</div>
	{#if action}
		<div class="mt-2">{@render action()}</div>
	{/if}
</div>
