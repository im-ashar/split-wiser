<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import DiscountInput from '$lib/components/ui/discount-input.svelte';
	import Percent from '@lucide/svelte/icons/percent';
	import Tag from '@lucide/svelte/icons/tag';
	import Plus from '@lucide/svelte/icons/plus';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import Calculator from '@lucide/svelte/icons/calculator';
	import ScanLine from '@lucide/svelte/icons/scan-line';
	import { splitStore } from '$lib/stores/split-store.svelte';
	import { discountAmount, type DiscountValue } from '$lib/split/discount';

	let {
		onOpenMultiItem,
		onOpenAddNonGroup,
		onOpenScan
	}: {
		onOpenMultiItem: () => void;
		onOpenAddNonGroup: () => void;
		onOpenScan: () => void;
	} = $props();

	const ZERO_DISCOUNT: DiscountValue = { value: 0, unit: 'pct' };
	const currentDiscount = $derived<DiscountValue>(
		splitStore.discountOnTotalBill ?? ZERO_DISCOUNT
	);

	// What the discount is worth right now in currency, given current totals.
	// Pre-discount subtotal = totalBill / factor; for a percentage it's
	// totalBill / (1 - p/100); for an amount it's totalBill + amt. Either way
	// `discountAmount(preDiscountTotal, current)` gives the value we save.
	const savings = $derived.by(() => {
		const d = currentDiscount;
		if (!d || d.value <= 0) return 0;
		const grandTotal = splitStore.totalBill;
		if (grandTotal <= 0) return 0;
		// Reverse the factor used in calculate-totals to find the pre-discount sum.
		const preDiscount =
			d.unit === 'pct'
				? grandTotal / (1 - Math.min(99.9, d.value) / 100)
				: grandTotal + d.value;
		return discountAmount(preDiscount, d);
	});
</script>

<Card>
	<CardHeader>
		<div class="flex items-center gap-2">
			<div class="inline-flex size-8 items-center justify-center rounded-md bg-primary-soft text-primary">
				<Calculator class="size-4" />
			</div>
			<CardTitle>Bill configuration</CardTitle>
		</div>
	</CardHeader>
	<CardContent>
		<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
			<div class="flex flex-col gap-1.5">
				<Label for="gst" class="flex items-center gap-2">
					<Percent class="size-4 text-primary" />
					GST %
				</Label>
				<Input
					id="gst"
					type="number"
					min="0"
					max="100"
					step="0.01"
					placeholder="e.g. 18"
					bind:value={splitStore.gstPercentage as number | undefined}
				/>
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="discount" class="flex items-center gap-2">
					<Tag class="size-4 text-primary" />
					Total discount
				</Label>
				<DiscountInput
					id="discount"
					value={currentDiscount}
					ariaLabel="Total discount"
					placeholder="e.g. 10"
					onChange={(next) =>
						(splitStore.discountOnTotalBill = next.value > 0 ? next : undefined)}
				/>
				{#if savings > 0}
					<p class="text-xs text-fg-muted">
						You save <span class="font-mono text-success">−{savings.toFixed(2)}</span>
						on the bill.
					</p>
				{/if}
			</div>
		</div>

		<div class="mt-5 flex flex-wrap gap-2 border-t border-default pt-4">
			<Button variant="secondary" size="sm" onclick={onOpenMultiItem}>
				<Plus class="size-4" />
				Multi-person item
			</Button>
			<Button variant="secondary" size="sm" onclick={onOpenAddNonGroup}>
				<UserPlus class="size-4" />
				Add non-group person
			</Button>
			<Button variant="secondary" size="sm" onclick={onOpenScan}>
				<ScanLine class="size-4" />
				Scan receipt
			</Button>
		</div>
	</CardContent>
</Card>
