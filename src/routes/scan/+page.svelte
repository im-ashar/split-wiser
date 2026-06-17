<script lang="ts">
	import { goto } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardDescription from '$lib/components/ui/card-description.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import EmptyState from '$lib/components/ui/empty-state.svelte';
	import ReceiptUploader from '$lib/components/scan/receipt-uploader.svelte';
	import GstPanel from '$lib/components/scan/gst-panel.svelte';
	import ItemsTable, {
		type ScanItemRow
	} from '$lib/components/scan/items-table.svelte';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Wand2 from '@lucide/svelte/icons/wand-2';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Settings2 from '@lucide/svelte/icons/settings-2';
	import { splitStore } from '$lib/stores/split-store.svelte';
	import { toNetForBill, type GstSettings } from '$lib/scan/gst';
	import type { ApiEnvelope } from '$lib/server/respond';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type ScanResult = {
		items: Array<{ name: string; price: number }>;
		currency: string | null;
		gstRate: number | null;
		pricesInclude: 'gst' | 'no-gst' | 'unknown';
		subtotal: number | null;
		total: number | null;
	};

	let stage = $state<'idle' | 'extracting' | 'review'>('idle');
	let pickedFile = $state<File | null>(null);
	let previewUrl = $state<string | null>(null);
	let extractError = $state<string | null>(null);

	let scanResult = $state<ScanResult | null>(null);
	let detectedGst = $state(false);
	let applyGst = $state(false);
	let gstSettings = $state<GstSettings>({ rate: 0, pricesInclude: false });
	let currency = $state('PKR');
	let items = $state<ScanItemRow[]>([]);

	function revokePreview() {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = null;
	}

	onDestroy(revokePreview);

	function handlePick(file: File) {
		revokePreview();
		pickedFile = file;
		previewUrl = URL.createObjectURL(file);
		extractError = null;
	}

	async function extract() {
		if (!pickedFile) return;
		stage = 'extracting';
		extractError = null;
		try {
			const fd = new FormData();
			fd.append('image', pickedFile);
			const res = await fetch('/api/scan/parse', { method: 'POST', body: fd });
			const json = (await res.json()) as ApiEnvelope<ScanResult>;
			if (!json.ok) {
				extractError = json.error.message ?? 'Could not read this receipt.';
				stage = 'idle';
				return;
			}
			scanResult = json.data;
			applyResult(json.data);
			stage = 'review';
		} catch (e) {
			extractError =
				e instanceof Error ? e.message : 'Network error while reading the receipt.';
			stage = 'idle';
		}
	}

	function applyResult(r: ScanResult) {
		// Pre-fill currency: receipt's, else user's group default, else PKR.
		const fallback = splitStore.persons[0]?.splitwiseMember
			? 'PKR'
			: 'PKR';
		currency = r.currency || fallback;

		// Pre-fill GST settings.
		const inclusive = r.pricesInclude === 'gst';
		const rate = r.gstRate ?? 0;
		detectedGst = r.gstRate != null || r.pricesInclude !== 'unknown';
		applyGst = rate > 0;
		gstSettings = { rate, pricesInclude: inclusive };

		// Map each parsed item into a table row, no assignees yet.
		items = r.items.map((it, i) => ({
			id: Date.now() + i,
			name: it.name,
			price: it.price,
			assigneeIds: [],
			divide: true
		}));
	}

	function reset() {
		revokePreview();
		pickedFile = null;
		scanResult = null;
		items = [];
		applyGst = false;
		detectedGst = false;
		gstSettings = { rate: 0, pricesInclude: false };
		extractError = null;
		stage = 'idle';
	}

	const persons = $derived(splitStore.persons);
	const hasPersons = $derived(persons.length > 0);

	const allItemsAssigned = $derived(items.every((r) => r.assigneeIds.length > 0));
	const hasItems = $derived(items.length > 0);
	const canApply = $derived(hasItems && hasPersons && allItemsAssigned);

	function applyToBill() {
		if (!canApply) return;

		// Compute the net price each assignee should pay for each item.
		const effectiveGst: GstSettings = applyGst
			? gstSettings
			: { rate: 0, pricesInclude: false };

		// Build a map from personId → list of net amounts to add.
		const additions = new Map<number, number[]>();

		for (const row of items) {
			if (row.assigneeIds.length === 0 || !Number.isFinite(row.price) || row.price <= 0) continue;
			const [netForRow] = toNetForBill([row.price], effectiveGst);
			if (netForRow == null) continue;

			const perPerson = row.divide ? netForRow / row.assigneeIds.length : netForRow;
			const rounded = Math.round(perPerson * 100) / 100;

			for (const pid of row.assigneeIds) {
				const list = additions.get(pid) ?? [];
				list.push(rounded);
				additions.set(pid, list);
			}
		}

		// Push amounts onto each person's listOfAmounts.
		for (const [pid, amounts] of additions.entries()) {
			for (const a of amounts) {
				splitStore.addAmount(pid);
				const person = splitStore.persons.find((p) => p.id === pid);
				const lastRow = person?.listOfAmounts[person.listOfAmounts.length - 1];
				if (lastRow) splitStore.setAmount(pid, lastRow.id, a);
			}
		}

		// Set bill-level GST so the existing math reconstructs the gross.
		if (applyGst && gstSettings.rate > 0) {
			splitStore.gstPercentage = gstSettings.rate;
		}

		toast.success('Receipt applied to bill', {
			description: 'Review the per-person amounts on the Home page.'
		});
		goto('/');
	}
</script>

<svelte:head>
	<title>Scan receipt · Split-Wiser</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div>
		<h1 class="text-3xl font-semibold tracking-tight">Scan a receipt</h1>
		<p class="text-fg-muted">
			Snap or upload a receipt — we'll extract items and prices, then you assign each item.
		</p>
	</div>

	{#if !data.scanEnabled}
		<Card>
			<CardContent>
				<div class="px-0 py-2">
					<EmptyState
						icon={Wand2}
						title="Scanning isn't configured on this server"
						description="Add a free Gemini API key to GEMINI_API_KEY in the server's environment to enable AI receipt scanning."
					>
						{#snippet action()}
							<Button href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">
								Get a free key
							</Button>
						{/snippet}
					</EmptyState>
				</div>
			</CardContent>
		</Card>
	{:else if !hasPersons}
		<Card>
			<CardContent>
				<div class="px-0 py-2">
					<EmptyState
						icon={Settings2}
						title="Set up the bill first"
						description="Pick a Splitwise group + members on the Home page (or use Manual entry), then come back to scan."
					>
						{#snippet action()}
							<Button href="/">Go to Home</Button>
						{/snippet}
					</EmptyState>
				</div>
			</CardContent>
		</Card>
	{:else if stage === 'idle' || stage === 'extracting'}
		<Card>
			<CardHeader>
				<CardTitle>Upload a receipt</CardTitle>
				<CardDescription>
					Best results: flat, well-lit, no glare. JPEG/PNG/WebP/HEIC up to 5MB.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<ReceiptUploader
						disabled={stage === 'extracting'}
						onPick={handlePick}
					/>
					{#if previewUrl}
						<div class="flex flex-col gap-3">
							<div class="overflow-hidden rounded-xl border border-default bg-surface-muted">
								<img
									src={previewUrl}
									alt="Selected receipt"
									class="max-h-96 w-full object-contain"
								/>
							</div>
							<div class="flex flex-wrap items-center justify-between gap-2">
								<div class="text-xs text-fg-muted">
									{pickedFile?.name} · {pickedFile ? (pickedFile.size / 1_000_000).toFixed(1) : '0'} MB
								</div>
								<div class="flex gap-2">
									<Button
										variant="secondary"
										size="sm"
										onclick={reset}
										disabled={stage === 'extracting'}
									>
										Choose another
									</Button>
									<Button
										onclick={extract}
										loading={stage === 'extracting'}
										disabled={!pickedFile}
									>
										<Sparkles class="size-4" />
										Extract items
									</Button>
								</div>
							</div>
						</div>
					{/if}
				</div>

				{#if extractError}
					<div class="mt-4 rounded-md border border-default bg-danger-soft px-3 py-2 text-sm text-danger">
						{extractError}
					</div>
				{/if}
			</CardContent>
		</Card>
	{:else if stage === 'review' && scanResult}
		<div class="flex flex-col gap-4">
			<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<Card class="lg:col-span-1">
					<CardHeader>
						<CardTitle>Receipt</CardTitle>
						<CardDescription>
							{#if scanResult.subtotal != null || scanResult.total != null}
								{#if scanResult.subtotal != null}Subtotal {scanResult.subtotal.toFixed(2)}{/if}
								{#if scanResult.total != null}{#if scanResult.subtotal != null} · {/if}Total {scanResult.total.toFixed(2)}{/if}
								{#if scanResult.currency}{scanResult.currency}{/if}
							{:else}
								Verify the values below match your receipt.
							{/if}
						</CardDescription>
					</CardHeader>
					<CardContent>
						{#if previewUrl}
							<img
								src={previewUrl}
								alt="Scanned receipt"
								class="max-h-[28rem] w-full rounded-lg border border-default object-contain"
							/>
						{/if}
					</CardContent>
				</Card>

				<div class="flex flex-col gap-4 lg:col-span-2">
					<GstPanel
						applyGst={applyGst}
						detected={detectedGst}
						settings={gstSettings}
						onChange={(next) => {
							applyGst = next.applyGst;
							gstSettings = next.settings;
						}}
					/>

					<Card>
						<CardHeader>
							<div class="flex flex-wrap items-start justify-between gap-3">
								<div>
									<CardTitle>Items</CardTitle>
									<CardDescription>
										Edit if needed, then assign each item to people.
									</CardDescription>
								</div>
								<div class="flex flex-col items-end text-right">
									<span class="text-xs uppercase tracking-wide text-fg-muted">
										Currency
									</span>
									<select
										class="mt-1 inline-flex h-9 items-center rounded-md border border-default bg-surface-muted px-2 text-sm focus-visible:outline-none focus-visible:border-primary"
										value={currency}
										onchange={(e) =>
											(currency = (e.currentTarget as HTMLSelectElement).value)}
									>
										{#each ['PKR', 'USD', 'EUR', 'GBP', 'INR', 'AED', 'SAR'] as c (c)}
											<option value={c}>{c}</option>
										{/each}
									</select>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<ItemsTable
								items={items}
								persons={persons}
								gst={{ applyGst, settings: gstSettings }}
								{currency}
								onItemsChange={(next) => (items = next)}
							/>
						</CardContent>
					</Card>
				</div>
			</div>

			<Card class="border-primary/40 bg-primary-soft/30">
				<CardContent>
					<div class="flex flex-col items-stretch justify-between gap-3 px-0 py-3 sm:flex-row sm:items-center">
						<div>
							<div class="text-sm font-medium text-fg">
								Ready to apply to the bill?
							</div>
							<div class="text-xs text-fg-muted">
								{items.length} item{items.length === 1 ? '' : 's'}
								{#if !allItemsAssigned}
									· some items have no people assigned yet
								{/if}
							</div>
						</div>
						<div class="flex flex-wrap items-center gap-2">
							<Button variant="ghost" onclick={reset}>
								<RefreshCw class="size-4" /> Start over
							</Button>
							<Button onclick={applyToBill} disabled={!canApply}>
								Apply to bill
								<ChevronRight class="size-4" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	{/if}
</div>
