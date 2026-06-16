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
	import Receipt from '@lucide/svelte/icons/receipt';
	import CircleDollarSign from '@lucide/svelte/icons/circle-dollar-sign';
	import Sigma from '@lucide/svelte/icons/sigma';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import { formatMoney } from '$lib/utils/money';
	import StatTile from '$lib/components/dashboard/stat-tile.svelte';
	import AreaChart from '$lib/components/dashboard/area-chart.svelte';
	import DonutChart from '$lib/components/dashboard/donut-chart.svelte';
	import BarChart from '$lib/components/dashboard/bar-chart.svelte';
	import RangeToggle from '$lib/components/dashboard/range-toggle.svelte';
	import { VALID_RANGES } from './range';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const dashboard = $derived(data.dashboard);
	const range = $derived(data.range);
	const spending = $derived(dashboard.spending);

	const rangeLabel = $derived(
		range >= 365 ? 'past year' : range >= 90 ? 'past 90 days' : 'past 30 days'
	);

	const balanceBars = $derived(
		dashboard.groups
			.flatMap((g) =>
				g.netByCurrency.map((bal) => ({
					label: g.name,
					sublabel: `${g.memberCount} members · ${bal.currency}`,
					value: bal.amount
				}))
			)
			.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
	);
</script>

<svelte:head>
	<title>Dashboard · Split-Wiser</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="text-3xl font-semibold tracking-tight">Dashboard</h1>
			<p class="text-fg-muted">A snapshot of where you stand and what you've spent.</p>
		</div>
		<RangeToggle current={range} options={VALID_RANGES} />
	</div>

	<!-- Top balance tiles -->
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

	{#if spending && spending.billCount > 0}
		<!-- KPI tiles for the period -->
		<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
			<StatTile
				label="Your share"
				icon={CircleDollarSign}
				value={formatMoney(spending.totalSpent, spending.currency)}
				hint={`${rangeLabel}`}
			/>
			<StatTile
				label="Bills"
				icon={Receipt}
				value={spending.billCount.toString()}
				hint={`${rangeLabel}`}
			/>
			<StatTile
				label="Avg bill"
				icon={Sigma}
				value={formatMoney(spending.avgBill, spending.currency)}
				hint="per expense"
			/>
			<StatTile
				label="Groups active"
				icon={LayoutGrid}
				value={spending.byGroup.length.toString()}
				hint={`with activity ${rangeLabel}`}
			/>
		</div>

		<!-- Spending over time -->
		<Card>
			<CardHeader>
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div>
						<CardTitle>Spending over time</CardTitle>
						<CardDescription>
							Your share of bills per day · {spending.currency}
						</CardDescription>
					</div>
					<div class="text-right">
						<div class="text-xs uppercase tracking-wide text-fg-muted">Total</div>
						<div class="font-mono text-xl font-semibold text-fg">
							{formatMoney(spending.totalSpent, spending.currency)}
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<AreaChart points={spending.yourShare} currency={spending.currency} />
			</CardContent>
		</Card>

		<!-- Categories + Groups -->
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>By category</CardTitle>
					<CardDescription>Where your money went, {rangeLabel}.</CardDescription>
				</CardHeader>
				<CardContent>
					<DonutChart
						slices={spending.byCategory.map((c) => ({ label: c.name, amount: c.amount }))}
						currency={spending.currency}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>By group</CardTitle>
					<CardDescription>Your share grouped by Splitwise group.</CardDescription>
				</CardHeader>
				<CardContent>
					<BarChart
						bars={spending.byGroup.map((g) => ({ label: g.name, value: g.amount }))}
						currency={spending.currency}
					/>
				</CardContent>
			</Card>
		</div>

		<!-- Top people -->
		<Card>
			<CardHeader>
				<CardTitle>Top people you split with</CardTitle>
				<CardDescription>By their share of shared expenses, {rangeLabel}.</CardDescription>
			</CardHeader>
			<CardContent>
				<BarChart
					bars={spending.topPeople.map((p) => {
						const bar: { label: string; value: number; avatar?: string } = {
							label: p.name,
							value: p.amount
						};
						if (p.avatar) bar.avatar = p.avatar;
						return bar;
					})}
					currency={spending.currency}
				/>
			</CardContent>
		</Card>
	{:else}
		<Card>
			<CardContent>
				<div class="px-0 py-2">
					<EmptyState
						icon={Receipt}
						title="No spending yet"
						description={`No bills found in the ${rangeLabel}. Create one from the Home page or widen the time range.`}
					>
						{#snippet action()}
							<Button href="/">Create a bill</Button>
						{/snippet}
					</EmptyState>
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- Group balances (now a bar chart with sign) -->
	<Card>
		<CardHeader>
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div>
					<CardTitle>Balances by group</CardTitle>
					<CardDescription>Green = owed to you, rose = you owe.</CardDescription>
				</div>
				<Button variant="secondary" size="sm" href="/expenses">
					View all expenses
				</Button>
			</div>
		</CardHeader>
		<CardContent>
			{#if balanceBars.length === 0}
				<EmptyState
					icon={Users}
					title="No groups yet"
					description="Connect your Splitwise account to see your groups here."
				/>
			{:else}
				<BarChart
					bars={balanceBars}
					currency={balanceBars[0]?.sublabel?.split('· ')[1] ?? ''}
					signed
				/>
			{/if}
		</CardContent>
	</Card>
</div>
