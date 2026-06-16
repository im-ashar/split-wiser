<script lang="ts">
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Users from '@lucide/svelte/icons/users';
	import IdCard from '@lucide/svelte/icons/id-card';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import { capitalizeFullName } from '$lib/utils/capitalize';
	import { splitStore } from '$lib/stores/split-store.svelte';
	import type { Person } from '$lib/types/splitwise';

	type Props = { open: boolean; onOpenChange: (open: boolean) => void };

	let { open = $bindable(), onOpenChange }: Props = $props();

	let count = $state<number | undefined>(undefined);
	let inputs = $state<Person[]>([]);

	const showInputs = $derived(inputs.length > 0);

	const isValid = $derived.by(() => {
		if (inputs.length === 0) return false;
		const names = inputs.map((p) => p.name.trim()).filter((n) => n.length > 0);
		if (names.length !== inputs.length) return false;
		const unique = new Set(names);
		return unique.size === names.length;
	});

	function generate() {
		if (!count || count < 2) return;
		inputs = Array.from({ length: count }, (_, i) => ({
			id: i,
			name: '',
			totalAmount: 0,
			listOfAmounts: []
		}));
	}

	function setName(idx: number, value: string) {
		inputs = inputs.map((p, i) => (i === idx ? { ...p, name: value } : p));
	}

	function commit() {
		if (!isValid) return;
		const persons: Person[] = inputs.map((p) => ({
			...p,
			name: capitalizeFullName(p.name.trim())
		}));
		splitStore.addPersons(persons);
		reset();
		onOpenChange(false);
	}

	function reset() {
		count = undefined;
		inputs = [];
	}

	function close() {
		reset();
		onOpenChange(false);
	}
</script>

<Dialog
	bind:open
	{onOpenChange}
	title="Manual entry"
	description="Add people without connecting Splitwise"
	size="md"
>
	<div class="flex flex-col gap-5">
		<div class="flex flex-col gap-2">
			<Label for="manual-count" class="flex items-center gap-2">
				<Users class="size-4 text-primary" />
				Number of people
			</Label>
			<Input
				id="manual-count"
				type="number"
				min="2"
				max="20"
				placeholder="Enter 2 to 20"
				bind:value={count as number | undefined}
			/>
			<p class="text-xs text-fg-muted">Minimum 2 people required.</p>
		</div>

		{#if showInputs}
			<div class="flex flex-col gap-3">
				<Label class="flex items-center gap-2">
					<IdCard class="size-4 text-success" />
					Names
				</Label>
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{#each inputs as p, idx (p.id)}
						<div class="flex flex-col gap-1.5">
							<span class="text-xs text-fg-muted">Person {idx + 1}</span>
							<Input
								placeholder={`Enter person ${idx + 1} name`}
								value={p.name}
								oninput={(e) => setName(idx, (e.currentTarget as HTMLInputElement).value)}
							/>
						</div>
					{/each}
				</div>

				{#if !isValid}
					<div class="flex items-center gap-2 rounded-md border border-default bg-danger-soft px-3 py-2 text-sm text-danger">
						<TriangleAlert class="size-4" />
						<span>All names are required and must be unique.</span>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	{#snippet footer()}
		<Button variant="ghost" onclick={close}>Cancel</Button>
		{#if !showInputs}
			<Button onclick={generate} disabled={!count || count < 2}>
				Generate inputs
			</Button>
		{:else}
			<Button onclick={commit} disabled={!isValid}>Create bill</Button>
		{/if}
	{/snippet}
</Dialog>
