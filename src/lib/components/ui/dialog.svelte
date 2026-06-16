<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Dialog as Bits } from 'bits-ui';
	import X from '@lucide/svelte/icons/x';
	import { cn } from '$lib/utils/cn';

	type Props = {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		title?: string;
		description?: string;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
		children?: Snippet;
		footer?: Snippet;
	};

	let {
		open = $bindable(false),
		onOpenChange,
		title,
		description,
		size = 'md',
		class: className,
		children,
		footer
	}: Props = $props();

	const sizeClass = $derived(
		{
			sm: 'max-w-md',
			md: 'max-w-xl',
			lg: 'max-w-3xl'
		}[size]
	);
</script>

<Bits.Root bind:open onOpenChange={onOpenChange ?? (() => {})}>
	<Bits.Portal>
		<Bits.Overlay
			class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
		/>
		<Bits.Content
			class={cn(
				'fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-0 rounded-xl border border-default bg-surface text-fg shadow-token-lg duration-200',
				'data-[state=open]:animate-in data-[state=closed]:animate-out',
				'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
				'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
				sizeClass,
				className
			)}
		>
			{#if title || description}
				<header class="flex flex-col gap-1.5 border-b border-default px-6 pt-6 pb-4">
					{#if title}
						<Bits.Title class="text-xl font-semibold leading-tight">{title}</Bits.Title>
					{/if}
					{#if description}
						<Bits.Description class="text-sm text-fg-muted">{description}</Bits.Description>
					{/if}
				</header>
			{/if}
			<div class="px-6 py-5">
				{@render children?.()}
			</div>
			{#if footer}
				<footer class="flex flex-col-reverse gap-2 border-t border-default px-6 py-4 sm:flex-row sm:justify-end">
					{@render footer()}
				</footer>
			{/if}
			<Bits.Close
				class="absolute right-4 top-4 rounded-md p-1 text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				aria-label="Close"
			>
				<X class="size-4" />
			</Bits.Close>
		</Bits.Content>
	</Bits.Portal>
</Bits.Root>
