<script lang="ts" module>
	import type { DiscountValue } from '$lib/split/discount';

	export interface ScanItemRow {
		id: number;
		name: string;
		price: number; // gross price as printed
		discount: DiscountValue; // item-level discount (% or fixed amount)
		excludeGst: boolean; // if true, GST is not applied to this item
		assigneeIds: number[];
		divide: boolean;
	}
</script>

<script lang="ts">
	import type { GstSettings } from '$lib/scan/gst';
	import { splitGst } from '$lib/scan/gst';
	import { applyDiscount, discountAmount } from '$lib/split/discount';
	import { formatMoney } from '$lib/utils/money';
	import Input from '$lib/components/ui/input.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import MultiSelect from '$lib/components/ui/multi-select.svelte';
	import DiscountInput from '$lib/components/ui/discount-input.svelte';
	import type { SelectOption } from '$lib/components/ui/select.svelte';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Plus from '@lucide/svelte/icons/plus';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Users from '@lucide/svelte/icons/users';
	import Tag from '@lucide/svelte/icons/tag';
	import { cn } from '$lib/utils/cn';
	import type { Person } from '$lib/types/splitwise';

	type Props = {
		items: ScanItemRow[];
		persons: Person[];
		gst: { applyGst: boolean; settings: GstSettings };
		currency: string;
		/** Optional bill-level discount; when set, the totals strip shows it applied. */
		billDiscount?: DiscountValue;
		onItemsChange: (items: ScanItemRow[]) => void;
	};

	let {
		items,
		persons,
		gst,
		currency,
		billDiscount,
		onItemsChange
	}: Props = $props();

	const personOptions = $derived<SelectOption<number>[]>(
		persons.map((p) => ({ label: p.name, value: p.id }))
	);

	const effectiveGst = $derived<GstSettings>(
		gst.applyGst ? gst.settings : { rate: 0, pricesInclude: false }
	);

	/** Discounted price for an item before GST treatment. */
	function discountedPrice(row: ScanItemRow): number {
		return Math.round(applyDiscount(row.price, row.discount) * 100) / 100;
	}

	/** Net / GST / Gross for display in the item card. */
	function rowSplit(row: ScanItemRow) {
		const base = discountedPrice(row);
		if (row.excludeGst) {
			return { net: base, gst: 0, gross: base };
		}
		return splitGst(base, effectiveGst);
	}

	function perPersonGross(row: ScanItemRow): number {
		if (row.assigneeIds.length === 0) return 0;
		const gross = rowSplit(row).gross;
		return row.divide ? gross / row.assigneeIds.length : gross;
	}

	const totals = $derived.by(() => {
		let net = 0;
		let tax = 0;
		let gross = 0;
		for (const r of items) {
			const s = rowSplit(r);
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

	const assignedCount = $derived(items.filter((r) => r.assigneeIds.length > 0).length);

	const billDiscountAmount = $derived(
		billDiscount && billDiscount.value > 0
			? Math.min(totals.gross, discountAmount(totals.gross, billDiscount))
			: 0
	);
	const finalTotal = $derived(Math.max(0, totals.gross - billDiscountAmount));

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
			{
				id,
				name: '',
				price: 0,
				discount: { value: 0, unit: 'pct' },
				excludeGst: false,
				assigneeIds: [],
				divide: true
			}
		]);
	}

	function nameFor(personId: number): string {
		return persons.find((p) => p.id === personId)?.name ?? '?';
	}
</script>

<div class="flex flex-col gap-3">
	<!-- Header strip with totals + counts -->
	<div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-default bg-surface-muted px-4 py-3">
		<div class="flex flex-wrap items-center gap-2 text-xs">
			<span class="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 font-medium text-fg">
				{items.length} item{items.length === 1 ? '' : 's'}
			</span>
			{#if items.length > 0}
				<span
					class={cn(
						'inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium',
						assignedCount === items.length
							? 'bg-success-soft text-success'
							: 'bg-warning-soft text-warning'
					)}
				>
					{#if assignedCount === items.length}
						<CircleCheck class="size-3" />
					{:else}
						<CircleAlert class="size-3" />
					{/if}
					{assignedCount} / {items.length} assigned
				</span>
			{/if}
		</div>
		<div class="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 font-mono text-sm">
			{#if gst.applyGst}
				<span class="hidden text-fg-muted sm:inline">
					Net <span class="text-fg">{formatMoney(totals.net, currency)}</span>
				</span>
				<span class="hidden text-fg-muted sm:inline">
					GST <span class="text-fg">{formatMoney(totals.gst, currency)}</span>
				</span>
			{/if}
			{#if billDiscountAmount > 0}
				<span class="text-fg-muted">
					Subtotal <span class="text-fg">{formatMoney(totals.gross, currency)}</span>
				</span>
				<span class="text-success">
					−{formatMoney(billDiscountAmount, currency)}
				</span>
				<span class="font-semibold text-fg">
					{formatMoney(finalTotal, currency)}
				</span>
			{:else}
				<span class="font-semibold text-fg">
					{formatMoney(totals.gross, currency)}
				</span>
			{/if}
		</div>
	</div>

	{#if persons.length === 0}
		<div class="flex items-start gap-2 rounded-md border border-default bg-warning-soft px-3 py-2 text-sm text-warning">
			<Users class="mt-0.5 size-4 shrink-0" />
			<span>
				No people are on the bill yet. Set up the bill on the Home page first.
			</span>
		</div>
	{/if}

	<!-- Item cards -->
	<div class="flex flex-col gap-3">
		{#each items as row (row.id)}
			{@const parts = rowSplit(row)}
			{@const perPerson = perPersonGross(row)}
			{@const isAssigned = row.assigneeIds.length > 0}
			<div
				class={cn(
					'flex flex-col gap-3 rounded-xl border bg-surface p-3 transition-colors sm:p-4',
					isAssigned ? 'border-default' : 'border-warning/40 bg-warning-soft/20'
				)}
			>
				<!-- Top row: name, price, delete -->
				<div class="flex items-start gap-2">
					<Input
						class="h-10 flex-1"
						placeholder="Item name"
						value={row.name}
						oninput={(e) =>
							update(row.id, {
								name: (e.currentTarget as HTMLInputElement).value
							})}
					/>
					<div class="relative w-28 shrink-0 sm:w-32">
						<Input
							class="h-10 pr-10 text-right font-mono"
							type="number"
							min="0"
							step="0.01"
							value={row.price}
							aria-label="Price"
							oninput={(e) => {
								const v = Number((e.currentTarget as HTMLInputElement).value);
								update(row.id, { price: Number.isFinite(v) ? v : 0 });
							}}
						/>
						<span
							class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-fg-subtle"
						>
							{currency}
						</span>
					</div>
					<Button
						variant="ghost"
						size="icon"
						onclick={() => remove(row.id)}
						aria-label="Remove item"
						class="shrink-0"
					>
						<Trash2 class="size-4 text-danger" />
					</Button>
				</div>

				<!-- Discount + GST-exclude controls -->
				<div class="flex flex-wrap items-center gap-3 rounded-md bg-surface-muted px-3 py-2 text-xs">
					<!-- Discount input (% or fixed amount) -->
					<label class="flex items-center gap-1.5 text-fg-muted">
						<Tag class="size-3" aria-hidden="true" />
						<span>Discount</span>
						<DiscountInput
							value={row.discount}
							{currency}
							class="!h-8 w-36"
							ariaLabel="Item discount"
							onChange={(next) => update(row.id, { discount: next })}
						/>
					</label>

					{#if row.discount.value > 0}
						<span class="font-mono text-success">
							−{discountAmount(row.price, row.discount).toFixed(2)} → {discountedPrice(row).toFixed(2)}
						</span>
					{/if}

					<!-- GST-exclude toggle — only when GST is on -->
					{#if gst.applyGst}
						<label class="ml-auto flex cursor-pointer items-center gap-1.5 font-medium text-fg">
							<input
								type="checkbox"
								class="size-3.5"
								checked={row.excludeGst}
								onchange={(e) =>
									update(row.id, {
										excludeGst: (e.currentTarget as HTMLInputElement).checked
									})}
							/>
							Exclude from GST
						</label>
					{/if}
				</div>

				<!-- GST breakdown bar -->
				{#if gst.applyGst}
					<div class="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md bg-surface-muted px-3 py-1.5 text-xs font-mono">
						{#if row.excludeGst}
							<span class="text-fg-muted italic">GST excluded</span>
							<span class="ml-auto text-fg-muted">
								Total <span class="font-semibold text-fg">{parts.gross.toFixed(2)}</span>
							</span>
						{:else}
							<span class="text-fg-muted">
								Net <span class="text-fg">{parts.net.toFixed(2)}</span>
							</span>
							<span class="text-fg-muted">
								GST <span class="text-fg">{parts.gst.toFixed(2)}</span>
							</span>
							<span class="ml-auto text-fg-muted">
								Gross <span class="font-semibold text-fg">{parts.gross.toFixed(2)}</span>
							</span>
						{/if}
					</div>
				{/if}

				<!-- Assignment row -->
				<div class="grid grid-cols-1 gap-2 lg:grid-cols-[1fr_auto] lg:items-start lg:gap-4">
					<div class="flex flex-col gap-2">
						<MultiSelect
							options={personOptions}
							value={row.assigneeIds}
							placeholder="Pick people who shared this"
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
							<span>
								Divide among selected
								<span class="text-fg-subtle">
									(off = each pays full)
								</span>
							</span>
						</label>
					</div>

					{#if isAssigned}
						<div class="flex flex-col items-stretch gap-1 rounded-lg border border-default bg-surface-muted px-3 py-2 text-right text-xs lg:min-w-[10rem]">
							<span class="uppercase tracking-wide text-fg-muted">
								{row.divide ? 'Each pays' : 'Each charged'}
							</span>
							<span class="font-mono text-base font-semibold text-fg">
								{formatMoney(perPerson, currency)}
							</span>
							<span class="text-fg-muted">
								{row.assigneeIds.length} {row.assigneeIds.length === 1 ? 'person' : 'people'}
							</span>
						</div>
					{/if}
				</div>

				{#if isAssigned}
					<!-- Quick recap of assignees as small chips for at-a-glance scan -->
					<div class="flex flex-wrap gap-1">
						{#each row.assigneeIds.slice(0, 6) as pid (pid)}
							<span class="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
								{nameFor(pid)}
							</span>
						{/each}
						{#if row.assigneeIds.length > 6}
							<span class="inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-xs text-fg-muted">
								+{row.assigneeIds.length - 6} more
							</span>
						{/if}
					</div>
				{/if}
			</div>
		{:else}
			<div class="rounded-xl border border-dashed border-default px-4 py-10 text-center text-sm text-fg-muted">
				No items yet. Add one or scan a receipt.
			</div>
		{/each}
	</div>

	<div>
		<Button variant="secondary" size="sm" onclick={addRow}>
			<Plus class="size-4" /> Add row
		</Button>
	</div>
</div>
