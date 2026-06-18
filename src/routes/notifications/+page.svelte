<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import EmptyState from '$lib/components/ui/empty-state.svelte';
	import Bell from '@lucide/svelte/icons/bell';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Inbox · Split-Wiser</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div>
		<h1 class="text-3xl font-semibold tracking-tight">Inbox</h1>
		<p class="text-fg-muted">Recent activity from your Splitwise account.</p>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Notifications</CardTitle>
		</CardHeader>
		<CardContent>
			{#if data.notifications.length === 0}
				<EmptyState
					icon={Bell}
					title="All caught up"
					description="No new notifications right now."
				/>
			{:else}
				<ul class="flex flex-col divide-y divide-default">
					{#each data.notifications as n (n.id)}
						<li class="flex items-start gap-3 py-3">
							{#if n.imageUrl}
								<img src={n.imageUrl} alt="" class="size-9 rounded-md border border-default" />
							{:else}
								<div class="inline-flex size-9 items-center justify-center rounded-md bg-primary-soft text-primary">
									<Bell class="size-4" />
								</div>
							{/if}
							<div class="min-w-0 flex-1">
								<div class="prose prose-sm break-words text-sm text-fg [&_a]:text-primary">
									<!-- Splitwise sends pre-formatted HTML in `content`. -->
									{@html n.content}
								</div>
								<div class="mt-1 text-xs text-fg-muted">
									{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
								</div>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</CardContent>
	</Card>
</div>
