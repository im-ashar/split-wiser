<script lang="ts">
	import type { GstSettings } from '$lib/scan/gst';
	import { splitGst } from '$lib/scan/gst';
	import { formatMoney } from '$lib/utils/money';
	import Input from '$lib/components/ui/input.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import MultiSelect from '$lib/components/ui/multi-select.svelte';
	import type { SelectOption } from '$lib/components/ui/select.svelte';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Plus from '@lucide/svelte/icons/plus';
	import Users from '@lucide/svelte/icons/users';
	import type { Person } from '$lib/types/splitwise';

	export interface ScanItemRow {
		id: number;
		name: string;
		price: number; // gross price as printed
		assigneeIds: number[];
		divide: boolean;
	}

	type Props = {
		items: ScanItemRow[];
		persons: Person[];
		gst: { applyGst: boolean; settings: GstSettings };
		currency: string;
		onItemsChange: (items: ScanItemRow[]) => void;
	};

	let { items, persons, gst, currency, onItemsChange }: Props = $props();

	const personOptions = $derived<SelectOption<number>[]>(
		persons.map((p) => ({ label: p.name, value: p.id }))
	);

	const effectiveGst = $derived<GstSettings>(
		gst.applyGst ? gst.settings : { rate: 0, pricesInclude: false }
	);

	function rowSplit(row: ScanItemRow) {
		return splitGst(row.price, effectiveGst);
	}

	const totals = $derived.by(() => {
		let net = 0;
		let tax = 0;
		let gross = 0;
		for (const r of items) {
			const s = splitGst(r.price, effectiveGst);
			net += s.net;
			tax += s.gst;
			gross += s.gross;
		}
		return {
			net: Math.round(net * 100) / 100,
			gst: Math.round(tax * 100) / 100,
			gross: Math.round(gross * 100) / 100
		};
	});

	function update(id: number, patch: Partial<ScanItemRow>) {
		onItemsChange(items.map((r) => (r.id === id ? { ...r, ...patch } : r)));
	}

	function remove(id: number) {
		onItemsChange(items.filter((r) => r.id !== id));
	}

	function addRow() {
		const id = Date.now() + Math.random();
		onItemsChange([
			...items,
			{ id, name: '', price: 0, assigneeIds: [], divide: true }
		]);
	}
</script>

<div class="flex flex-col gap-3">
	<div class="overflow-x-auto rounded-xl border border-default">
		<table class="w-full text-sm">
			<thead class="bg-surface-muted text-left">
				<tr class="text-xs uppercase tracking-wide text-fg-muted">
					<th class="px-3 py-2 font-medium">Item</th>
					<th class="px-3 py-2 font-medium">Price</th>
					{#if gst.applyGst}
						<th class="hidden px-3 py-2 text-right font-medium md:table-cell">Net</th>
						<th class="hidden px-3 py-2 text-right font-medium md:table-cell">GST</th>
						<th class="px-3 py-2 text-right font-medium">Gross</th>
					{:else}
						<th class="px-3 py-2 text-right font-medium">Total</th>
					{/if}
					<th class="px-3 py-2 font-medium">Assigned to</th>
					<th class="px-3 py-2 font-medium"></th>
				</tr>
			</thead>
			<tbody class="divide-y divide-default">
				{#each items as row (row.id)}
					{@const parts = rowSplit(row)}
					<tr class="align-top">
						<td class="px-3 py-2">
							<Input
								class="h-9"
								placeholder="Item name"
								value={row.name}
								oninput={(e) =>
									update(row.id, {
										name: (e.currentTarget as HTMLInputElement).value
									})}
							/>
						</td>
						<td class="px-3 py-2">
							<Input
								class="h-9 w-24 font-mono"
								type="number"
								min="0"
								step="0.01"
								value={row.price}
								oninput={(e) => {
									const v = Number((e.currentTarget as HTMLInputElement).value);
									update(row.id, { price: Number.isFinite(v) ? v : 0 });
								}}
							/>
						</td>
						{#if gst.applyGst}
							<td class="hidden px-3 py-2 text-right font-mono text-xs text-fg-muted md:table-cell">
								{parts.net.toFixed(2)}
							</td>
							<td class="hidden px-3 py-2 text-right font-mono text-xs text-fg-muted md:table-cell">
								{parts.gst.toFixed(2)}
							</td>
							<td class="px-3 py-2 text-right font-mono text-sm text-fg">
								{parts.gross.toFixed(2)}
							</td>
						{:else}
							<td class="px-3 py-2 text-right font-mono text-sm text-fg">
								{parts.gross.toFixed(2)}
							</td>
						{/if}
						<td class="px-3 py-2">
							<div class="flex flex-col gap-2">
								<MultiSelect
									options={personOptions}
									value={row.assigneeIds}
									placeholder="Pick people"
									emptyText="No people on the bill yet."
									onValueChange={(v) => update(row.id, { assigneeIds: v })}
								/>
								<label class="flex cursor-pointer items-center gap-2 text-xs text-fg-muted">
									<input
										type="checkbox"
										class="size-3.5"
										checked={row.divide}
										onchange={(e) =>
											update(row.id, {
												divide: (e.currentTarget as HTMLInputElement).checked
											})}
									/>
									<span>Divide among selected (off = each pays full)</span>
								</label>
							</div>
						</td>
						<td class="px-3 py-2 text-right">
							<Button
								variant="ghost"
								size="icon"
								onclick={() => remove(row.id)}
								aria-label="Remove item"
							>
								<Trash2 class="size-4 text-danger" />
							</Button>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan={gst.applyGst ? 6 : 5} class="px-3 py-8 text-center text-sm text-fg-muted">
							No items yet. Add one or scan a receipt.
						</td>
					</tr>
				{/each}
			</tbody>
			{#if items.length > 0}
				<tfoot class="bg-surface-muted">
					<tr class="text-sm">
						<td colspan={2} class="px-3 py-2 font-medium text-fg">Totals</td>
						{#if gst.applyGst}
							<td class="hidden px-3 py-2 text-right font-mono text-fg md:table-cell">
								{formatMoney(totals.net, currency)}
							</td>
							<td class="hidden px-3 py-2 text-right font-mono text-fg md:table-cell">
								{formatMoney(totals.gst, currency)}
							</td>
							<td class="px-3 py-2 text-right font-mono font-semibold text-fg">
								{formatMoney(totals.gross, currency)}
							</td>
						{:else}
							<td class="px-3 py-2 text-right font-mono font-semibold text-fg">
								{formatMoney(totals.gross, currency)}
							</td>
						{/if}
						<td colspan={2} class="px-3 py-2"></td>
					</tr>
				</tfoot>
			{/if}
		</table>
	</div>

	<div>
		<Button variant="secondary" size="sm" onclick={addRow}>
			<Plus class="size-4" /> Add row
		</Button>
	</div>

	{#if persons.length === 0}
		<div class="flex items-start gap-2 rounded-md border border-default bg-warning-soft px-3 py-2 text-sm text-warning">
			<Users class="size-4" />
			<span>
				No people are on the bill yet. Set up the bill on the Home page first.
			</span>
		</div>
	{/if}
</div>
