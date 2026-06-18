<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Send from '@lucide/svelte/icons/send';
	import Wallet from '@lucide/svelte/icons/wallet';
	import { splitStore } from '$lib/stores/split-store.svelte';
	import { formatMoney } from '$lib/utils/money';

	type Props = {
		onPostToSplitwise: () => void;
		canPost: boolean;
		posting?: boolean;
		currency?: string;
	};

	let { onPostToSplitwise, canPost, posting = false, currency = 'PKR' }: Props = $props();
</script>

<Card class="border-primary/40 bg-primary-soft/40">
	<CardContent>
		<div class="flex flex-col gap-4 px-0 py-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-center gap-3">
				<div class="inline-flex size-10 items-center justify-center rounded-lg bg-primary text-primary-fg">
					<Wallet class="size-5" />
				</div>
				<div>
					<div class="text-xs font-medium uppercase tracking-wide text-fg-muted">
						Grand total
					</div>
					<div
						aria-live="polite"
						class="font-mono text-3xl font-semibold text-fg"
					>
						{formatMoney(splitStore.totalBill, currency)}
					</div>
				</div>
			</div>

			<div class="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
				{#if splitStore.selectedPayer}
					<div class="text-right text-xs text-fg-muted">
						Paid by
						<span class="font-medium text-fg">
							{splitStore.selectedPayer.first_name} {splitStore.selectedPayer.last_name ?? ''}
						</span>
					</div>
				{/if}
				<Button
					onclick={onPostToSplitwise}
					disabled={!canPost}
					loading={posting}
				>
					<Send class="size-4" />
					Post to Splitwise
				</Button>
			</div>
		</div>
	</CardContent>
</Card>
