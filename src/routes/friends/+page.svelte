<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import EmptyState from '$lib/components/ui/empty-state.svelte';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Users from '@lucide/svelte/icons/users';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Mail from '@lucide/svelte/icons/mail';
	import { toast } from 'svelte-sonner';
	import { formatMoney } from '$lib/utils/money';
	import type { PageData } from './$types';
	import type { ApiEnvelope } from '$lib/server/respond';

	let { data }: { data: PageData } = $props();

	let addOpen = $state(false);
	let firstName = $state('');
	let lastName = $state('');
	let email = $state('');
	let busy = $state(false);

	function reset() {
		firstName = '';
		lastName = '';
		email = '';
	}

	async function add() {
		if (!firstName.trim() || !email.trim()) return;
		busy = true;
		try {
			const res = await fetch('/api/friends', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					user_first_name: firstName.trim(),
					user_last_name: lastName.trim() || undefined,
					user_email: email.trim()
				})
			});
			const json = (await res.json()) as ApiEnvelope<unknown>;
			if (!json.ok) {
				toast.error('Failed to add friend', { description: json.error.message });
				return;
			}
			toast.success('Friend added');
			reset();
			addOpen = false;
			await invalidateAll();
		} finally {
			busy = false;
		}
	}

	async function remove(id: number, name: string) {
		if (!confirm(`Remove ${name}?`)) return;
		const res = await fetch(`/api/friends/${id}`, { method: 'DELETE' });
		const json = (await res.json()) as ApiEnvelope<unknown>;
		if (!json.ok) {
			toast.error('Failed to remove', { description: json.error.message });
			return;
		}
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>Friends · Split-Wiser</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="text-3xl font-semibold tracking-tight">Friends</h1>
			<p class="text-fg-muted">Manage who you split with on Splitwise.</p>
		</div>
		<Button onclick={() => (addOpen = true)}>
			<UserPlus class="size-4" />
			Add friend
		</Button>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Your friends</CardTitle>
			<CardDescription>Net balances are aggregated across all your shared expenses.</CardDescription>
		</CardHeader>
		<CardContent>
			{#if data.friends.length === 0}
				<EmptyState
					icon={Users}
					title="No friends yet"
					description="Add a friend to start sharing expenses."
				>
					{#snippet action()}
						<Button onclick={() => (addOpen = true)}>
							<UserPlus class="size-4" />
							Add friend
						</Button>
					{/snippet}
				</EmptyState>
			{:else}
				<ul class="flex flex-col divide-y divide-default">
					{#each data.friends as f (f.id)}
						<li class="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
							<div class="flex items-center gap-3">
								{#if f.avatar}
									<img src={f.avatar} alt="" class="size-9 rounded-full border border-default" />
								{:else}
									<div class="inline-flex size-9 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
										{(f.firstName[0] ?? '?').toUpperCase()}
									</div>
								{/if}
								<div>
									<div class="font-medium">{f.firstName} {f.lastName}</div>
									{#if f.email}
										<div class="flex items-center gap-1 text-xs text-fg-muted">
											<Mail class="size-3" /> {f.email}
										</div>
									{/if}
								</div>
							</div>
							<div class="flex flex-wrap items-center gap-2">
								{#if f.balance.length === 0}
									<Badge>Settled</Badge>
								{:else}
									{#each f.balance as bal (bal.currency)}
										<Badge variant={bal.amount > 0 ? 'success' : bal.amount < 0 ? 'danger' : 'default'}>
											<span class="font-mono">
												{formatMoney(Math.abs(bal.amount), bal.currency)}
											</span>
										</Badge>
									{/each}
								{/if}
								<Button
									variant="ghost"
									size="icon"
									aria-label={`Remove ${f.firstName}`}
									onclick={() => remove(f.id, `${f.firstName} ${f.lastName}`.trim())}
								>
									<Trash2 class="size-4 text-danger" />
								</Button>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</CardContent>
	</Card>
</div>

<Dialog
	bind:open={addOpen}
	onOpenChange={(v) => {
		addOpen = v;
		if (!v) reset();
	}}
	title="Add a friend"
	description="They’ll get an invite by email."
	size="sm"
>
	<div class="flex flex-col gap-3">
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			<div class="flex flex-col gap-1.5">
				<Label for="first-name">First name</Label>
				<Input id="first-name" bind:value={firstName} />
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="last-name">Last name</Label>
				<Input id="last-name" bind:value={lastName} />
			</div>
		</div>
		<div class="flex flex-col gap-1.5">
			<Label for="email">Email</Label>
			<Input id="email" type="email" bind:value={email} />
		</div>
	</div>

	{#snippet footer()}
		<Button variant="ghost" onclick={() => (addOpen = false)}>Cancel</Button>
		<Button
			onclick={add}
			disabled={!firstName.trim() || !email.trim() || busy}
			loading={busy}
		>
			Send invite
		</Button>
	{/snippet}
</Dialog>
