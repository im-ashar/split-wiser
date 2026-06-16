<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const buttonVariants = tv({
		base: 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors duration-150 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
		variants: {
			variant: {
				primary:
					'bg-primary text-primary-fg hover:bg-primary-hover shadow-token-sm',
				secondary:
					'bg-surface text-fg border border-default hover:bg-surface-muted',
				ghost: 'text-fg hover:bg-surface-muted',
				destructive: 'bg-danger text-white hover:brightness-110',
				link: 'text-primary underline-offset-4 hover:underline'
			},
			size: {
				sm: 'h-8 px-3 text-sm',
				md: 'h-10 px-4 text-sm',
				lg: 'h-12 px-6 text-base',
				icon: 'h-10 w-10'
			},
			full: {
				true: 'w-full',
				false: ''
			}
		},
		defaultVariants: {
			variant: 'primary',
			size: 'md',
			full: false
		}
	});

	export type ButtonVariants = VariantProps<typeof buttonVariants>;
</script>

<script lang="ts">
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/cn';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';

	type Props = {
		variant?: ButtonVariants['variant'];
		size?: ButtonVariants['size'];
		full?: boolean;
		loading?: boolean;
		href?: string;
		class?: string;
		children?: Snippet;
	} & (Omit<HTMLButtonAttributes, 'class' | 'children'> | Omit<HTMLAnchorAttributes, 'class' | 'children'>);

	let {
		variant = 'primary',
		size = 'md',
		full = false,
		loading = false,
		href,
		class: className,
		children,
		...rest
	}: Props = $props();
</script>

{#if href}
	<a
		{href}
		class={cn(buttonVariants({ variant, size, full }), className)}
		{...rest as HTMLAnchorAttributes}
	>
		{#if loading}
			<LoaderCircle class="size-4 animate-spin" aria-hidden="true" />
		{/if}
		{@render children?.()}
	</a>
{:else}
	<button
		type="button"
		class={cn(buttonVariants({ variant, size, full }), className)}
		disabled={loading || (rest as HTMLButtonAttributes).disabled}
		{...rest as HTMLButtonAttributes}
	>
		{#if loading}
			<LoaderCircle class="size-4 animate-spin" aria-hidden="true" />
		{/if}
		{@render children?.()}
	</button>
{/if}
