<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import EmptyState from '$lib/components/ui/empty-state.svelte';
	import Receipt from '@lucide/svelte/icons/receipt';
	import { formatMoney } from '$lib/utils/money';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Expenses · Split-Wiser</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div>
		<h1 class="text-3xl font-semibold tracking-tight">Recent expenses</h1>
		<p class="text-fg-muted">Your most recent activity across all groups.</p>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Expenses</CardTitle>
			<CardDescription>Tap an expense to view details and comments.</CardDescription>
		</CardHeader>
		<CardContent>
			{#if data.expenses.length === 0}
				<EmptyState
					icon={Receipt}
					title="No expenses yet"
					description="Start by creating a bill on the Home page."
				/>
			{:else}
				<ul class="flex flex-col divide-y divide-default">
					{#each data.expenses as e (e.id)}
						<li>
							<a
								href={`/expenses/${e.id}`}
								class="flex items-start justify-between gap-3 rounded-md px-2 py-3 transition-colors hover:bg-surface-muted"
							>
								<div class="flex min-w-0 items-start gap-3">
									<div class="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
										<Receipt class="size-4" />
									</div>
									<div class="min-w-0">
										<div class="truncate font-medium text-fg">
											{e.description || 'Untitled expense'}
										</div>
										<div class="text-xs text-fg-muted">
											{e.date ? new Date(e.date).toLocaleDateString() : ''}
											{#if e.createdBy}
												· by {e.createdBy.firstName}
											{/if}
										</div>
									</div>
								</div>
								<div class="text-right">
									<div class="font-mono text-sm font-medium">
										{formatMoney(Number(e.cost), e.currencyCode)}
									</div>
								</div>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</CardContent>
	</Card>
</div>
