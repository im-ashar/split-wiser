<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { splitStore } from '$lib/stores/split-store.svelte';
	import { formatMoney } from '$lib/utils/money';
	import type { Person } from '$lib/types/splitwise';

	let { person, currency = 'PKR' }: { person: Person; currency?: string } = $props();
</script>

<Card>
	<CardHeader>
		<div class="flex items-center justify-between gap-3">
			<div class="flex items-center gap-3">
				<div
					class="inline-flex size-9 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary"
					aria-hidden="true"
				>
					{(person.name[0] ?? '?').toUpperCase()}
				</div>
				<div class="min-w-0">
					<CardTitle>
						<span class="truncate">{person.name}</span>
					</CardTitle>
					{#if person.isNonGroupMember}
						<Badge variant="warning" class="mt-1">Non-group</Badge>
					{/if}
				</div>
			</div>
			<div class="text-right">
				<div class="text-xs text-fg-muted">Subtotal</div>
				<div class="font-mono text-base font-medium text-fg">
					{formatMoney(person.totalAmount, currency)}
				</div>
			</div>
		</div>
	</CardHeader>

	<CardContent>
		<div class="flex flex-col gap-2">
			{#each person.listOfAmounts as row (row.id)}
				<div class="flex items-center gap-2">
					<Label for={`amt-${person.id}-${row.id}`} class="sr-only">Amount</Label>
					<Input
						id={`amt-${person.id}-${row.id}`}
						type="number"
						min="0"
						step="0.01"
						placeholder="0.00"
						value={row.amount ?? ''}
						oninput={(e) => {
							const val = (e.currentTarget as HTMLInputElement).value;
							splitStore.setAmount(
								person.id,
								row.id,
								val === '' ? undefined : Number(val)
							);
						}}
					/>
					<Button
						variant="ghost"
						size="icon"
						onclick={() => splitStore.removeAmount(person.id, row.id)}
						aria-label="Remove amount"
					>
						<Trash2 class="size-4 text-danger" />
					</Button>
				</div>
			{/each}

			<Button
				variant="secondary"
				size="sm"
				onclick={() => splitStore.addAmount(person.id)}
				class="self-start"
			>
				<Plus class="size-4" />
				Add amount
			</Button>
		</div>
	</CardContent>
</Card>
