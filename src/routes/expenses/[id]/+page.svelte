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
	import EmptyState from '$lib/components/ui/empty-state.svelte';
	import Receipt from '@lucide/svelte/icons/receipt';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Send from '@lucide/svelte/icons/send';
	import { toast } from 'svelte-sonner';
	import { formatMoney } from '$lib/utils/money';
	import type { PageData } from './$types';
	import type { ApiEnvelope } from '$lib/server/respond';

	let { data }: { data: PageData } = $props();
	const expense = $derived(data.expense);

	let newComment = $state('');
	let busy = $state(false);

	async function postComment() {
		const content = newComment.trim();
		if (!content) return;
		busy = true;
		try {
			const res = await fetch('/api/comments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ expense_id: expense.id, content })
			});
			const json = (await res.json()) as ApiEnvelope<unknown>;
			if (!json.ok) {
				toast.error('Failed to add comment', { description: json.error.message });
				return;
			}
			newComment = '';
			await invalidateAll();
		} finally {
			busy = false;
		}
	}

	async function deleteComment(id: number) {
		if (!confirm('Delete this comment?')) return;
		const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
		const json = (await res.json()) as ApiEnvelope<unknown>;
		if (!json.ok) {
			toast.error('Failed to delete', { description: json.error.message });
			return;
		}
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>{expense.description || 'Expense'} · Split-Wiser</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<Button variant="ghost" size="sm" href="/expenses" class="self-start">
		<ArrowLeft class="size-4" />
		Back to expenses
	</Button>

	<Card>
		<CardHeader>
			<div class="flex items-start gap-3">
				<div class="inline-flex size-10 items-center justify-center rounded-md bg-primary-soft text-primary">
					<Receipt class="size-5" />
				</div>
				<div class="min-w-0">
					<CardTitle>
						<span class="break-words">{expense.description || 'Untitled expense'}</span>
					</CardTitle>
					<CardDescription>
						{expense.date ? new Date(expense.date).toLocaleString() : ''}
					</CardDescription>
				</div>
			</div>
		</CardHeader>
		<CardContent>
			<div class="font-mono text-3xl font-semibold">
				{formatMoney(Number(expense.cost), expense.currencyCode)}
			</div>

			<div class="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
				{#each expense.users as u (u.userId)}
					<div class="flex items-center justify-between gap-2 rounded-lg border border-default bg-surface-muted px-3 py-2">
						<div class="text-sm font-medium">{u.firstName} {u.lastName}</div>
						<div class="text-right text-xs">
							<div class="text-fg-muted">paid {u.paidShare}</div>
							<div class="font-mono text-fg">owed {u.owedShare}</div>
						</div>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<div class="flex items-center gap-2">
				<MessageCircle class="size-4 text-primary" />
				<CardTitle>Comments</CardTitle>
			</div>
		</CardHeader>
		<CardContent>
			<div class="flex flex-col gap-2">
				<Label for="new-comment" class="sr-only">Add comment</Label>
				<div class="flex gap-2">
					<Input
						id="new-comment"
						placeholder="Write a comment…"
						bind:value={newComment}
						onkeydown={(e) => e.key === 'Enter' && postComment()}
						disabled={busy}
					/>
					<Button onclick={postComment} disabled={!newComment.trim()} loading={busy}>
						<Send class="size-4" />
					</Button>
				</div>
			</div>

			<div class="mt-4">
				{#if data.comments.length === 0}
					<EmptyState
						icon={MessageCircle}
						title="No comments yet"
						description="Start the conversation."
					/>
				{:else}
					<ul class="flex flex-col gap-3">
						{#each data.comments as c (c.id)}
							<li class="flex items-start gap-3 rounded-lg border border-default bg-surface p-3">
								{#if c.user.avatar}
									<img src={c.user.avatar} alt="" class="size-8 rounded-full" />
								{:else}
									<div class="inline-flex size-8 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
										{(c.user.firstName[0] ?? '?').toUpperCase()}
									</div>
								{/if}
								<div class="min-w-0 flex-1">
									<div class="flex items-center justify-between gap-2">
										<div class="text-sm font-medium">
											{c.user.firstName} {c.user.lastName}
										</div>
										<div class="text-xs text-fg-muted">
											{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
										</div>
									</div>
									<div class="mt-1 break-words text-sm text-fg">{c.content}</div>
								</div>
								<Button
									variant="ghost"
									size="icon"
									aria-label="Delete comment"
									onclick={() => deleteComment(c.id)}
								>
									<Trash2 class="size-4 text-danger" />
								</Button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</CardContent>
	</Card>
</div>
