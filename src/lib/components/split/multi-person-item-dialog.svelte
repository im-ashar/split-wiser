<script lang="ts">
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import MultiSelect from '$lib/components/ui/multi-select.svelte';
	import type { SelectOption } from '$lib/components/ui/select.svelte';
	import { splitStore } from '$lib/stores/split-store.svelte';
	import { splitMultiPersonItem } from '$lib/split/split-multi-person-item';
	import type { Person } from '$lib/types/splitwise';

	type Props = { open: boolean; onOpenChange: (open: boolean) => void };
	let { open = $bindable(), onOpenChange }: Props = $props();

	let price = $state<number | undefined>(undefined);
	let discount = $state<number | undefined>(undefined);
	let selected = $state<Person[]>([]);
	let divide = $state(true);

	const personOptions = $derived<SelectOption<Person>[]>(
		splitStore.persons.map((p) => ({ label: p.name, value: p }))
	);

	function close() {
		price = undefined;
		discount = undefined;
		selected = [];
		divide = true;
		onOpenChange(false);
	}

	function commit() {
		if (!price || price <= 0 || selected.length === 0) return;
		const { uniqueParticipants, amountPerPerson } = splitMultiPersonItem({
			price,
			discountPercentage: discount,
			participants: selected,
			divideAmongSelected: divide
		});
		if (uniqueParticipants.length === 0) return;
		splitStore.applyMultiPersonItemAmount(
			uniqueParticipants.map((p) => p.id),
			amountPerPerson
		);
		close();
	}
</script>

<Dialog
	bind:open
	{onOpenChange}
	title="Multi-person item"
	description="Add an item that several people share."
	size="md"
>
	<div class="flex flex-col gap-5">
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			<div class="flex flex-col gap-1.5">
				<Label for="mp-price">Item price</Label>
				<Input id="mp-price" type="number" min="0" step="0.01" bind:value={price as number | undefined} />
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="mp-discount">Item discount %</Label>
				<Input id="mp-discount" type="number" min="0" max="100" step="0.01" bind:value={discount as number | undefined} />
			</div>
		</div>

		<div class="flex flex-col gap-1.5">
			<Label>Who shared this?</Label>
			<MultiSelect
				options={personOptions}
				bind:value={selected}
				placeholder="Select participants"
				emptyText="No people in the bill yet."
			/>
		</div>

		<label class="flex cursor-pointer items-start gap-3 rounded-lg border border-default bg-surface-muted p-3 text-sm">
			<input type="checkbox" class="mt-0.5 size-4" bind:checked={divide} />
			<span>
				<span class="block font-medium text-fg">Divide price among selected</span>
				<span class="block text-xs text-fg-muted">
					When off, every selected person is charged the full price.
				</span>
			</span>
		</label>
	</div>

	{#snippet footer()}
		<Button variant="ghost" onclick={close}>Cancel</Button>
		<Button onclick={commit} disabled={!price || price <= 0 || selected.length === 0}>
			Add item
		</Button>
	{/snippet}
</Dialog>
