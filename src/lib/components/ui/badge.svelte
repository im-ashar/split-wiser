<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const badgeVariants = tv({
		base: 'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
		variants: {
			variant: {
				default: 'bg-surface-muted text-fg',
				primary: 'bg-primary-soft text-primary',
				success: 'bg-success-soft text-success',
				warning: 'bg-warning-soft text-warning',
				danger: 'bg-danger-soft text-danger'
			}
		},
		defaultVariants: { variant: 'default' }
	});

	export type BadgeVariants = VariantProps<typeof badgeVariants>;
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/cn';

	let {
		variant = 'default',
		class: className,
		children
	}: {
		variant?: BadgeVariants['variant'];
		class?: string;
		children?: Snippet;
	} = $props();
</script>

<span class={cn(badgeVariants({ variant }), className)}>
	{@render children?.()}
</span>
