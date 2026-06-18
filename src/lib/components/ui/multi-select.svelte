<script lang="ts" generics="T">
	import { Combobox } from 'bits-ui';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';
	import { cn } from '$lib/utils/cn';
	import type { SelectOption } from './select.svelte';
	import CheckboxIndicator from './checkbox-indicator.svelte';

	type Props = {
		options: SelectOption<T>[];
		value?: T[];
		placeholder?: string;
		searchPlaceholder?: string;
		emptyText?: string;
		disabled?: boolean;
		class?: string;
		onValueChange?: (value: T[]) => void;
	};

	let {
		options,
		value = $bindable([]),
		placeholder = 'Select options',
		emptyText = 'No matches.',
		disabled = false,
		class: className,
		onValueChange
	}: Props = $props();

	let search = $state('');
	let open = $state(false);

	const indexByOption = $derived.by(() => {
		const map = new Map<unknown, number>();
		options.forEach((o, i) => map.set(o.value, i));
		return map;
	});

	const selectedKeys = $derived.by(() =>
		value
			.map((v) => indexByOption.get(v))
			.filter((i): i is number => i !== undefined)
			.map(String)
	);

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

	function handleChange(keys: string[]) {
		const nextValues = keys
			.map((k) => options[Number(k)])
			.filter((o): o is SelectOption<T> => Boolean(o))
			.map((o) => o.value);
		value = nextValues;
		onValueChange?.(nextValues);
	}

	function removeChip(v: T) {
		value = value.filter((x) => x !== v);
		onValueChange?.(value);
	}

	const selectableFiltered = $derived(
		filtered.filter(({ option }) => !option.disabled)
	);

	const allFilteredSelected = $derived(
		selectableFiltered.length > 0 &&
			selectableFiltered.every(({ option }) => value.includes(option.value))
	);

	const someFilteredSelected = $derived(
		!allFilteredSelected &&
			selectableFiltered.some(({ option }) => value.includes(option.value))
	);

	function toggleAll() {
		if (allFilteredSelected) {
			const visible = new Set(selectableFiltered.map(({ option }) => option.value));
			value = value.filter((v) => !visible.has(v));
		} else {
			const next = [...value];
			for (const { option } of selectableFiltered) {
				if (!next.includes(option.value)) next.push(option.value);
			}
			value = next;
		}
		onValueChange?.(value);
	}
</script>

<Combobox.Root
	type="multiple"
	bind:open
	value={selectedKeys}
	onValueChange={handleChange}
	{disabled}
	onOpenChange={(o) => {
		if (!o) search = '';
	}}
>
	<div class={cn('flex flex-col gap-2', className)}>
		<div class="relative flex w-full items-center">
			<Search class="pointer-events-none absolute left-3 size-4 text-fg-subtle" aria-hidden="true" />
			<Combobox.Input
				class={cn(
					'flex h-10 w-full rounded-md border border-default bg-surface-muted py-2 pl-9 pr-10 text-sm transition-colors',
					'placeholder:text-fg-subtle focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring',
					'disabled:cursor-not-allowed disabled:opacity-50'
				)}
				oninput={(e) => (search = (e.currentTarget as HTMLInputElement).value)}
				onfocus={() => (open = true)}
				onclick={() => (open = true)}
				{placeholder}
				aria-label={placeholder}
			/>
			<Combobox.Trigger
				class="absolute right-2 inline-flex size-7 items-center justify-center rounded-md text-fg-muted hover:bg-surface hover:text-fg"
				aria-label="Toggle list"
			>
				<ChevronsUpDown class="size-4" />
			</Combobox.Trigger>
		</div>

		{#if value.length > 0}
			<div class="flex flex-wrap gap-1.5">
				{#each value as v (v)}
					{@const opt = options.find((o) => o.value === v)}
					{#if opt}
						<button
							type="button"
							class="inline-flex h-7 items-center gap-1 rounded-full bg-primary-soft px-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-fg"
							onclick={() => removeChip(v)}
							aria-label={`Remove ${opt.label}`}
						>
							<span>{opt.label}</span>
							<X class="size-3" aria-hidden="true" />
						</button>
					{/if}
				{/each}
			</div>
		{/if}
	</div>

	<Combobox.Portal>
		<Combobox.Content
			class={cn(
				'z-50 max-h-80 w-[var(--bits-combobox-anchor-width)] overflow-hidden rounded-lg border border-default bg-surface text-fg shadow-token-md',
				'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
			)}
			sideOffset={6}
		>
			{#if selectableFiltered.length > 1}
				<div class="border-b border-default p-1">
					<button
						type="button"
						onclick={toggleAll}
						class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-fg outline-none transition-colors hover:bg-surface-muted focus-visible:bg-surface-muted"
					>
						<CheckboxIndicator
							checked={allFilteredSelected}
							indeterminate={someFilteredSelected}
						/>
						<span class="flex-1 text-left">
							{allFilteredSelected
								? `Clear ${search ? 'visible' : 'all'} (${selectableFiltered.length})`
								: `Select ${search ? 'visible' : 'all'} (${selectableFiltered.length})`}
						</span>
					</button>
				</div>
			{/if}

			<Combobox.Viewport class="max-h-80 overflow-y-auto p-1">
				{#each filtered as { option, index } (index)}
					<Combobox.Item
						value={String(index)}
						label={option.label}
						disabled={option.disabled ?? false}
						class={cn(
							'flex cursor-pointer items-start gap-3 rounded-md px-3 py-2 text-sm outline-none',
							'data-[highlighted]:bg-surface-muted data-[selected]:bg-primary-soft data-[selected]:text-primary',
							'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50'
						)}
					>
						{#snippet children({ selected }: { selected: boolean })}
							<CheckboxIndicator checked={selected} class="mt-0.5" />
							<div class="flex flex-1 flex-col">
								<span class="font-medium">{option.label}</span>
								{#if option.description}
									<span class="text-xs text-fg-muted">{option.description}</span>
								{/if}
							</div>
						{/snippet}
					</Combobox.Item>
				{:else}
					<div class="px-3 py-6 text-center text-sm text-fg-muted">{emptyText}</div>
				{/each}
			</Combobox.Viewport>
		</Combobox.Content>
	</Combobox.Portal>
</Combobox.Root>
