<script lang="ts">
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { formatMoney } from '$lib/utils/money';

	type Props = {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		shares: { name: string; amount: number }[];
		currency?: string;
	};

	let {
		open = $bindable(),
		onOpenChange,
		shares,
		currency = 'PKR'
	}: Props = $props();
</script>

<Dialog
	bind:open
	{onOpenChange}
	title="Settle outside Splitwise"
	description="These people aren’t in your Splitwise group, so collect from them in cash."
	size="sm"
>
	<ul class="flex flex-col divide-y divide-default">
		{#each shares as share, i (i)}
			<li class="flex items-center justify-between py-2.5">
				<span class="text-sm font-medium text-fg">{share.name}</span>
				<span class="font-mono text-sm">{formatMoney(share.amount, currency)}</span>
			</li>
		{/each}
	</ul>

	{#snippet footer()}
		<Button variant="primary" onclick={() => onOpenChange(false)}>Done</Button>
	{/snippet}
</Dialog>
