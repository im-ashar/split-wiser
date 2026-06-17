<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Percent from '@lucide/svelte/icons/percent';
	import Tag from '@lucide/svelte/icons/tag';
	import Plus from '@lucide/svelte/icons/plus';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import Calculator from '@lucide/svelte/icons/calculator';
	import ScanLine from '@lucide/svelte/icons/scan-line';
	import { splitStore } from '$lib/stores/split-store.svelte';

	let {
		onOpenMultiItem,
		onOpenAddNonGroup,
		onOpenScan
	}: {
		onOpenMultiItem: () => void;
		onOpenAddNonGroup: () => void;
		onOpenScan: () => void;
	} = $props();
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
					Total discount %
				</Label>
				<Input
					id="discount"
					type="number"
					min="0"
					max="100"
					step="0.01"
					placeholder="e.g. 10"
					bind:value={splitStore.discountOnTotalBill as number | undefined}
				/>
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
