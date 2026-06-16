<script lang="ts">
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import CardFooter from '$lib/components/ui/card-footer.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Select, {
		type SelectOption
	} from '$lib/components/ui/select.svelte';
	import MultiSelect from '$lib/components/ui/multi-select.svelte';
	import EmptyState from '$lib/components/ui/empty-state.svelte';
	import Sitemap from '@lucide/svelte/icons/network';
	import UserCheck from '@lucide/svelte/icons/user-check';
	import Wallet from '@lucide/svelte/icons/wallet';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import Edit3 from '@lucide/svelte/icons/edit-3';
	import Plug from '@lucide/svelte/icons/plug';
	import { splitStore } from '$lib/stores/split-store.svelte';
	import ManualEntryDialog from '$lib/components/split/manual-entry-dialog.svelte';
	import AddNonGroupMemberDialog from '$lib/components/split/add-non-group-member-dialog.svelte';
	import MultiPersonItemDialog from '$lib/components/split/multi-person-item-dialog.svelte';
	import DescriptionDialog from '$lib/components/split/description-dialog.svelte';
	import NonGroupSharesDialog from '$lib/components/split/non-group-shares-dialog.svelte';
	import PersonBillCard from '$lib/components/split/person-bill-card.svelte';
	import BillConfigurationCard from '$lib/components/split/bill-configuration-card.svelte';
	import GrandTotalCard from '$lib/components/split/grand-total-card.svelte';
	import { buildExpensePayload } from '$lib/split/build-expense-payload';
	import type {
		ApiEnvelope
	} from '$lib/server/respond';
	import type {
		Person,
		SplitwiseGroup,
		SplitwiseMember
	} from '$lib/types/splitwise';

	const isAuthenticated = $derived(page.data.isAuthenticated);
	const groups = $derived<SplitwiseGroup[]>(
		(page.data as { groups?: SplitwiseGroup[] }).groups ?? []
	);

	const groupOptions = $derived<SelectOption<SplitwiseGroup | null>[]>([
		{ label: 'No group', value: null, description: 'Track outside Splitwise' },
		...groups.map((g) => ({
			label: g.name,
			value: g,
			description: `${g.members.length} member${g.members.length === 1 ? '' : 's'}`
		}))
	]);

	const memberOptions = $derived<SelectOption<SplitwiseMember>[]>(
		(splitStore.selectedGroup?.members ?? []).map((m) => {
			const opt: SelectOption<SplitwiseMember> = {
				label: `${m.first_name} ${m.last_name ?? ''}`.trim(),
				value: m
			};
			if (m.email) opt.description = m.email;
			return opt;
		})
	);

	const payerOptions = $derived<SelectOption<SplitwiseMember>[]>(
		splitStore.selectedGroupMembers.map((m) => ({
			label: `${m.first_name} ${m.last_name ?? ''}`.trim(),
			value: m
		}))
	);

	let manualOpen = $state(false);
	let multiItemOpen = $state(false);
	let nonGroupOpen = $state(false);
	let descriptionOpen = $state(false);
	let nonGroupSharesOpen = $state(false);
	let nonGroupShares = $state<{ name: string; amount: number }[]>([]);
	let posting = $state(false);

	const canCreateBill = $derived(
		isAuthenticated &&
			splitStore.selectedGroup != null &&
			splitStore.selectedGroupMembers.length > 0
	);

	const canPostToSplitwise = $derived(
		isAuthenticated &&
			splitStore.showBillCards &&
			splitStore.selectedPayer != null &&
			splitStore.persons.length > 0 &&
			splitStore.persons.filter((p) => !p.isNonGroupMember).length > 0
	);

	function createBillFromGroup() {
		const persons: Person[] = splitStore.selectedGroupMembers.map((m) => ({
			id: m.id,
			name: `${m.first_name} ${m.last_name ?? ''}`.trim(),
			totalAmount: 0,
			listOfAmounts: [],
			splitwiseMember: m,
			splitwiseUserId: m.user_id ?? m.id
		}));
		splitStore.persons = [...persons].sort((a, b) =>
			a.name.localeCompare(b.name)
		);
		splitStore.showBillCards = true;
	}

	async function postToSplitwise(description: string) {
		const payer = splitStore.selectedPayer;
		const group = splitStore.selectedGroup;
		if (!payer || !group) return;

		posting = true;
		try {
			// Surface non-group cash shares (if any).
			const nonGroup = splitStore.persons.filter((p) => p.isNonGroupMember);
			if (nonGroup.length > 0) {
				nonGroupShares = nonGroup.map((p) => ({
					name: p.name,
					amount: p.totalAmount
				}));
			}

			const payload = buildExpensePayload({
				persons: splitStore.persons,
				payer,
				group,
				description
			});

			const res = await fetch('/api/expenses', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			const json = (await res.json()) as ApiEnvelope<{ expenses: unknown[] }>;
			if (!json.ok) {
				toast.error('Splitwise error', {
					description: json.error.message ?? 'Failed to post expense.'
				});
				return;
			}
			toast.success('Posted to Splitwise', {
				description: 'The expense was created successfully.'
			});
			descriptionOpen = false;
			if (nonGroup.length > 0) {
				nonGroupSharesOpen = true;
			}
		} catch (e) {
			toast.error('Network error', {
				description: e instanceof Error ? e.message : 'Try again.'
			});
		} finally {
			posting = false;
		}
	}

	function reset() {
		splitStore.reset();
		manualOpen = false;
		multiItemOpen = false;
		nonGroupOpen = false;
		descriptionOpen = false;
		nonGroupSharesOpen = false;
	}
</script>

<svelte:head>
	<title>Split-Wiser · Smart bill splitting</title>
</svelte:head>

<div class="flex flex-col gap-8">
	<div class="flex flex-col gap-2">
		<h1 class="text-3xl font-semibold tracking-tight md:text-4xl">
			Split your bill, fair to the last cent.
		</h1>
		<p class="max-w-2xl text-fg-muted">
			Pick a Splitwise group, add itemised amounts, apply GST and discounts,
			and we’ll post the expense back to Splitwise — rounding reconciled on
			the payer’s share.
		</p>
	</div>

	<Card>
		<CardHeader>
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div class="flex flex-col gap-1.5">
					<CardTitle>Set up the bill</CardTitle>
					<CardDescription>
						{#if isAuthenticated}
							Choose the group, the people who shared, and who paid.
						{:else}
							Connect Splitwise to import groups, or use manual entry.
						{/if}
					</CardDescription>
				</div>
				{#if isAuthenticated && page.data.user}
					<div class="text-right text-xs text-fg-muted">
						<div>Connected as</div>
						<div class="font-medium text-fg">
							{page.data.user.firstName} {page.data.user.lastName}
						</div>
					</div>
				{/if}
			</div>
		</CardHeader>

		<CardContent>
			<div class="flex flex-col gap-6">
				{#if !isAuthenticated}
					<EmptyState
						title="Not connected to Splitwise"
						description="Sign in with your Splitwise account to load groups and members. Or skip ahead with manual entry."
						icon={Plug}
					>
						{#snippet action()}
							<Button href="/auth/login">
								<Plug class="size-4" />
								Connect Splitwise
							</Button>
						{/snippet}
					</EmptyState>
				{:else}
					<div class="flex flex-col gap-2">
						<Label class="flex items-center gap-2">
							<Sitemap class="size-4 text-primary" />
							Select your group
						</Label>
						<Select
							options={groupOptions}
							value={splitStore.selectedGroup}
							placeholder="🔍 Search and select a group"
							emptyText={groups.length === 0
								? 'No groups found in your Splitwise account.'
								: 'No matches.'}
							onValueChange={(v) => (splitStore.selectedGroup = v ?? null)}
						/>
					</div>

					{#if splitStore.selectedGroup}
						<div class="flex flex-col gap-2">
							<Label class="flex items-center gap-2">
								<UserCheck class="size-4 text-success" />
								Select members
							</Label>
							<MultiSelect
								options={memberOptions}
								value={splitStore.selectedGroupMembers}
								placeholder="👥 Select members for this bill"
								emptyText="No members in this group."
								onValueChange={(v) => (splitStore.selectedGroupMembers = v)}
							/>
						</div>
					{/if}

					{#if splitStore.selectedGroupMembers.length > 0}
						<div class="flex flex-col gap-2">
							<Label class="flex items-center gap-2">
								<Wallet class="size-4 text-warning" />
								Who paid?
							</Label>
							<Select
								options={payerOptions}
								value={splitStore.selectedPayer}
								placeholder="💳 Select who paid"
								onValueChange={(v) => (splitStore.selectedPayer = v ?? null)}
							/>
						</div>
					{/if}
				{/if}
			</div>
		</CardContent>

		<CardFooter>
			<div class="flex w-full flex-wrap items-center justify-between gap-3">
				<Button variant="ghost" size="sm" onclick={reset}>
					<RefreshCw class="size-4" />
					Reset all
				</Button>
				<div class="flex flex-wrap items-center gap-2">
					{#if canCreateBill}
						<Button onclick={createBillFromGroup}>
							Create bill ({splitStore.selectedGroupMembers.length} members)
						</Button>
					{:else}
						<Button variant="secondary" onclick={() => (manualOpen = true)}>
							<Edit3 class="size-4" />
							Manual entry
						</Button>
					{/if}
				</div>
			</div>
		</CardFooter>
	</Card>

	{#if splitStore.showBillCards}
		<BillConfigurationCard
			onOpenMultiItem={() => (multiItemOpen = true)}
			onOpenAddNonGroup={() => (nonGroupOpen = true)}
		/>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
			{#each splitStore.persons as person (person.id)}
				<PersonBillCard {person} />
			{/each}
		</div>

		<GrandTotalCard
			canPost={canPostToSplitwise}
			{posting}
			onPostToSplitwise={() => {
				if (!splitStore.selectedPayer) {
					toast.warning('Select a payer first');
					return;
				}
				descriptionOpen = true;
			}}
		/>
	{/if}
</div>

<ManualEntryDialog
	bind:open={manualOpen}
	onOpenChange={(v) => (manualOpen = v)}
/>
<MultiPersonItemDialog
	bind:open={multiItemOpen}
	onOpenChange={(v) => (multiItemOpen = v)}
/>
<AddNonGroupMemberDialog
	bind:open={nonGroupOpen}
	onOpenChange={(v) => (nonGroupOpen = v)}
/>
<DescriptionDialog
	bind:open={descriptionOpen}
	onOpenChange={(v) => (descriptionOpen = v)}
	onConfirm={postToSplitwise}
	{posting}
/>
<NonGroupSharesDialog
	bind:open={nonGroupSharesOpen}
	onOpenChange={(v) => (nonGroupSharesOpen = v)}
	shares={nonGroupShares}
/>
