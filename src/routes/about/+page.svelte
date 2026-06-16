<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import Calculator from '@lucide/svelte/icons/calculator';
	import Wallet from '@lucide/svelte/icons/wallet';
	import Users from '@lucide/svelte/icons/users';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import Receipt from '@lucide/svelte/icons/receipt';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import GitBranch from '@lucide/svelte/icons/git-branch';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Button from '$lib/components/ui/button.svelte';

	const features = [
		{ icon: Wallet, label: 'Splitwise integration', desc: 'OAuth-based connect, server-side token.' },
		{ icon: Calculator, label: 'GST + discount math', desc: 'Per-line GST then percentage discount.' },
		{ icon: Receipt, label: 'Multi-person items', desc: 'Divide one item among any group of people.' },
		{ icon: Users, label: 'Non-group people', desc: 'Track people outside the Splitwise group.' },
		{ icon: MessageCircle, label: 'Comments on expenses', desc: 'Discuss directly on the expense.' },
		{ icon: LayoutDashboard, label: 'Balance dashboard', desc: 'See net balances across groups.' }
	] as const;

	const stack = [
		'SvelteKit 2',
		'Svelte 5 (runes)',
		'TypeScript strict',
		'Tailwind v4',
		'bits-ui',
		'splitwise-ts',
		'Netlify Functions',
		'Vitest + Playwright'
	];
</script>

<svelte:head>
	<title>About · Split-Wiser</title>
</svelte:head>

<div class="flex flex-col gap-8">
	<Card>
		<CardHeader>
			<CardTitle>About Split-Wiser</CardTitle>
			<CardDescription>Smart bill splitting that respects every cent.</CardDescription>
		</CardHeader>
		<CardContent>
			<p class="text-fg-muted">
				Split-Wiser is a calculator-style web app for splitting bills with friends and posting
				the result to your Splitwise account. It handles GST, discounts, multi-person items,
				and people who aren't in the Splitwise group, while reconciling rounding differences
				on the payer's share so the books always balance.
			</p>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>Features</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{#each features as f (f.label)}
					<div class="flex items-start gap-3 rounded-lg border border-default bg-surface p-4">
						<div class="inline-flex size-9 items-center justify-center rounded-md bg-primary-soft text-primary">
							<f.icon class="size-4" />
						</div>
						<div class="min-w-0">
							<div class="font-medium text-fg">{f.label}</div>
							<div class="text-sm text-fg-muted">{f.desc}</div>
						</div>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>How it works</CardTitle>
		</CardHeader>
		<CardContent>
			<ol class="flex flex-col gap-3 text-sm">
				<li class="flex items-start gap-3">
					<Badge variant="primary">1</Badge>
					<span>Connect your Splitwise account or pick manual entry.</span>
				</li>
				<li class="flex items-start gap-3">
					<Badge variant="primary">2</Badge>
					<span>Choose the group, members who shared, and who paid.</span>
				</li>
				<li class="flex items-start gap-3">
					<Badge variant="primary">3</Badge>
					<span>Enter individual amounts or multi-person items, apply GST/discount.</span>
				</li>
				<li class="flex items-start gap-3">
					<Badge variant="primary">4</Badge>
					<span>Post the expense to Splitwise — rounding fix lands the cents on the payer.</span>
				</li>
			</ol>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>Tech stack</CardTitle>
			<CardDescription>Lightweight by design — server endpoints run as Netlify Functions for free.</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="flex flex-wrap gap-2">
				{#each stack as item (item)}
					<Badge>{item}</Badge>
				{/each}
			</div>
			<div class="mt-5 flex flex-wrap gap-2">
				<Button variant="secondary" size="sm" href="https://github.com/im-ashar" target="_blank" rel="noopener">
					<GitBranch class="size-4" />
					GitHub profile
				</Button>
				<Button variant="ghost" size="sm" href="https://www.splitwise.com" target="_blank" rel="noopener">
					<ExternalLink class="size-4" />
					Splitwise
				</Button>
			</div>
		</CardContent>
	</Card>
</div>
