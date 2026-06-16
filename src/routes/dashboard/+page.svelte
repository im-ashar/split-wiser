<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import EmptyState from '$lib/components/ui/empty-state.svelte';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import TrendingDown from '@lucide/svelte/icons/trending-down';
	import Wallet from '@lucide/svelte/icons/wallet';
	import Users from '@lucide/svelte/icons/users';
	import { formatMoney } from '$lib/utils/money';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const dashboard = $derived(data.dashboard);
</script>

<svelte:head>
	<title>Dashboard · Split-Wiser</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div>
		<h1 class="text-3xl font-semibold tracking-tight">Dashboard</h1>
		<p class="text-fg-muted">A snapshot of where you stand across every Splitwise group.</p>
	</div>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#if dashboard.totals.length === 0}
			<Card class="sm:col-span-2 lg:col-span-3">
				<CardContent>
					<div class="px-0 py-3">
						<EmptyState
							icon={Wallet}
							title="No active balances"
							description="Once you start adding expenses, your net balance per currency will appear here."
						/>
					</div>
				</CardContent>
			</Card>
		{:else}
			{#each dashboard.totals as t (t.currency)}
				<Card>
					<CardHeader>
						<div class="flex items-center justify-between gap-3">
							<CardTitle>{t.currency}</CardTitle>
							{#if t.amount > 0}
								<Badge variant="success">
									<TrendingUp class="size-3" /> Owed to you
								</Badge>
							{:else if t.amount < 0}
								<Badge variant="danger">
									<TrendingDown class="size-3" /> You owe
								</Badge>
							{:else}
								<Badge>Settled</Badge>
							{/if}
						</div>
					</CardHeader>
					<CardContent>
						<div class="font-mono text-3xl font-semibold">
							{formatMoney(Math.abs(t.amount), t.currency)}
						</div>
					</CardContent>
				</Card>
			{/each}
		{/if}
	</div>

	<Card>
		<CardHeader>
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div>
					<CardTitle>Groups</CardTitle>
					<CardDescription>Your balance in each Splitwise group.</CardDescription>
				</div>
				<Button variant="secondary" size="sm" href="/expenses">
					View all expenses
				</Button>
			</div>
		</CardHeader>
		<CardContent>
			{#if dashboard.groups.length === 0}
				<EmptyState
					icon={Users}
					title="No groups yet"
					description="Connect your Splitwise account to see your groups here."
				/>
			{:else}
				<ul class="flex flex-col divide-y divide-default">
					{#each dashboard.groups as g (g.id)}
						<li class="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
							<div class="flex items-center gap-3">
								<div class="inline-flex size-9 items-center justify-center rounded-md bg-primary-soft text-primary">
									<Users class="size-4" />
								</div>
								<div>
									<div class="font-medium">{g.name}</div>
									<div class="text-xs text-fg-muted">{g.memberCount} members</div>
								</div>
							</div>
							<div class="flex flex-wrap items-center gap-2">
								{#if g.netByCurrency.length === 0}
									<Badge>Settled</Badge>
								{:else}
									{#each g.netByCurrency as bal (bal.currency)}
										<Badge variant={bal.amount > 0 ? 'success' : bal.amount < 0 ? 'danger' : 'default'}>
											<span class="font-mono">
												{formatMoney(Math.abs(bal.amount), bal.currency)}
											</span>
										</Badge>
									{/each}
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</CardContent>
	</Card>
</div>
