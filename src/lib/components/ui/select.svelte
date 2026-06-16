<script lang="ts" module>
	export interface SelectOption<T = unknown> {
		label: string;
		value: T;
		description?: string;
		disabled?: boolean;
	}
</script>

<script lang="ts" generics="T">
	import { Combobox } from 'bits-ui';
	import Check from '@lucide/svelte/icons/check';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import Search from '@lucide/svelte/icons/search';
	import { cn } from '$lib/utils/cn';

	type Props = {
		options: SelectOption<T>[];
		value?: T | null;
		placeholder?: string;
		searchPlaceholder?: string;
		emptyText?: string;
		disabled?: boolean;
		class?: string;
		onValueChange?: (value: T | null) => void;
	};

	let {
		options,
		value = $bindable(null),
		placeholder = 'Select an option',
		searchPlaceholder = 'Search…',
		emptyText = 'No matches.',
		disabled = false,
		class: className,
		onValueChange
	}: Props = $props();

	let search = $state('');

	const valueMap = $derived(new Map(options.map((o, i) => [String(i), o] as const)));
	const selectedKey = $derived.by(() => {
		if (value == null) return '';
		const idx = options.findIndex((o) => o.value === value);
		return idx === -1 ? '' : String(idx);
	});
	const selectedLabel = $derived.by(() => {
		if (value == null) return '';
		const found = options.find((o) => o.value === value);
		return found?.label ?? '';
	});

	const filtered = $derived.by(() => {
		const term = search.trim().toLowerCase();
		if (!term) return options.map((o, i) => ({ option: o, index: i }));
		return options
			.map((o, i) => ({ option: o, index: i }))
			.filter(({ option }) =>
				option.label.toLowerCase().includes(term) ||
				(option.description ?? '').toLowerCase().includes(term)
			);
	});

	function handleChange(next: string) {
		if (!next) {
			value = null;
			onValueChange?.(null);
			return;
		}
		const opt = valueMap.get(next);
		if (opt) {
			value = opt.value;
			onValueChange?.(opt.value);
		}
	}
</script>

<Combobox.Root
	type="single"
	value={selectedKey}
	onValueChange={handleChange}
	{disabled}
	onOpenChange={(open) => {
		if (!open) search = '';
	}}
>
	<div class={cn('relative flex h-10 w-full items-center', className)}>
		<Search class="pointer-events-none absolute left-3 size-4 text-fg-subtle" aria-hidden="true" />
		<Combobox.Input
			class={cn(
				'flex h-10 w-full rounded-md border border-default bg-surface-muted py-2 pl-9 pr-10 text-sm transition-colors',
				'placeholder:text-fg-subtle focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring',
				'disabled:cursor-not-allowed disabled:opacity-50'
			)}
			oninput={(e) => (search = (e.currentTarget as HTMLInputElement).value)}
			{placeholder}
			defaultValue={selectedLabel}
			aria-label={placeholder}
		/>
		<Combobox.Trigger
			class="absolute right-2 inline-flex size-7 items-center justify-center rounded-md text-fg-muted hover:bg-surface hover:text-fg"
			aria-label="Toggle list"
		>
			<ChevronsUpDown class="size-4" />
		</Combobox.Trigger>
	</div>

	<Combobox.Portal>
		<Combobox.Content
			class={cn(
				'z-50 max-h-80 w-[var(--bits-combobox-anchor-width)] overflow-hidden rounded-lg border border-default bg-surface text-fg shadow-token-md',
				'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
			)}
			sideOffset={6}
		>
			<Combobox.Viewport class="max-h-80 overflow-y-auto p-1">
				{#each filtered as { option, index } (index)}
					<Combobox.Item
						value={String(index)}
						label={option.label}
						disabled={option.disabled ?? false}
						class={cn(
							'flex cursor-pointer items-start gap-2 rounded-md px-3 py-2 text-sm outline-none',
							'data-[highlighted]:bg-surface-muted data-[selected]:bg-primary-soft data-[selected]:text-primary',
							'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50'
						)}
					>
						{#snippet children({ selected }: { selected: boolean })}
							<div class="flex flex-1 flex-col">
								<span class="font-medium">{option.label}</span>
								{#if option.description}
									<span class="text-xs text-fg-muted">{option.description}</span>
								{/if}
							</div>
							{#if selected}
								<Check class="size-4 text-primary" aria-hidden="true" />
							{/if}
						{/snippet}
					</Combobox.Item>
				{:else}
					<div class="px-3 py-6 text-center text-sm text-fg-muted">{emptyText}</div>
				{/each}
			</Combobox.Viewport>
		</Combobox.Content>
	</Combobox.Portal>
</Combobox.Root>
