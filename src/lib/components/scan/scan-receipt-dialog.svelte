<script lang="ts">
	import { onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import EmptyState from '$lib/components/ui/empty-state.svelte';
	import ReceiptUploader from '$lib/components/scan/receipt-uploader.svelte';
	import GstPanel from '$lib/components/scan/gst-panel.svelte';
	import ItemsTable, {
		type ScanItemRow
	} from '$lib/components/scan/items-table.svelte';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Clipboard from '@lucide/svelte/icons/clipboard';
	import Settings2 from '@lucide/svelte/icons/settings-2';
	import { splitStore } from '$lib/stores/split-store.svelte';
	import { toNetForBill, type GstSettings } from '$lib/scan/gst';
	import type { ApiEnvelope } from '$lib/server/respond';

	type ScanResult = {
		items: Array<{ name: string; price: number }>;
		currency: string | null;
		gstRate: number | null;
		pricesInclude: 'gst' | 'no-gst' | 'unknown';
		subtotal: number | null;
		total: number | null;
	};

	type Props = {
		open: boolean;
		onOpenChange: (open: boolean) => void;
	};

	let { open = $bindable(), onOpenChange }: Props = $props();

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

	const persons = $derived(splitStore.persons);
	const hasPersons = $derived(persons.length > 0);
	const allItemsAssigned = $derived(items.every((r) => r.assigneeIds.length > 0));
	const hasItems = $derived(items.length > 0);
	const canApply = $derived(hasItems && hasPersons && allItemsAssigned);

	function revokePreview() {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = null;
	}

	onDestroy(revokePreview);

	function handlePick(file: File) {
		if (!file.type.startsWith('image/')) {
			extractError = 'That file is not an image.';
			return;
		}
		revokePreview();
		pickedFile = file;
		previewUrl = URL.createObjectURL(file);
		extractError = null;
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

	function close() {
		reset();
		onOpenChange(false);
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
		currency = r.currency || 'PKR';
		const inclusive = r.pricesInclude === 'gst';
		const rate = r.gstRate ?? 0;
		detectedGst = r.gstRate != null || r.pricesInclude !== 'unknown';
		applyGst = rate > 0;
		gstSettings = { rate, pricesInclude: inclusive };
		items = r.items.map((it, i) => ({
			id: Date.now() + i,
			name: it.name,
			price: it.price,
			assigneeIds: [],
			divide: true
		}));
	}

	function applyToBill() {
		if (!canApply) return;
		const effectiveGst: GstSettings = applyGst
			? gstSettings
			: { rate: 0, pricesInclude: false };

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

		for (const [pid, amounts] of additions.entries()) {
			for (const a of amounts) {
				splitStore.addAmount(pid);
				const person = splitStore.persons.find((p) => p.id === pid);
				const lastRow = person?.listOfAmounts[person.listOfAmounts.length - 1];
				if (lastRow) splitStore.setAmount(pid, lastRow.id, a);
			}
		}

		if (applyGst && gstSettings.rate > 0) {
			splitStore.gstPercentage = gstSettings.rate;
		}

		toast.success('Receipt applied to bill', {
			description: 'Review the per-person amounts below.'
		});
		close();
	}

	// Paste-from-clipboard support: when the dialog is open and the user
	// presses Ctrl/Cmd+V (or pastes into the page), pull the first image
	// off the clipboard.
	function handlePaste(e: ClipboardEvent) {
		if (!open) return;
		const items = e.clipboardData?.items;
		if (!items) return;
		for (const item of items) {
			if (item.kind === 'file' && item.type.startsWith('image/')) {
				const file = item.getAsFile();
				if (file) {
					handlePick(file);
					e.preventDefault();
					toast.success('Image pasted', {
						description: `${(file.size / 1_000_000).toFixed(1)} MB · ready to extract`
					});
					return;
				}
			}
		}
	}

	async function pasteFromButton() {
		try {
			if (!navigator.clipboard?.read) {
				toast.info('Press Ctrl+V (Cmd+V on Mac) to paste an image.');
				return;
			}
			const items = await navigator.clipboard.read();
			for (const item of items) {
				const type = item.types.find((t) => t.startsWith('image/'));
				if (type) {
					const blob = await item.getType(type);
					const file = new File([blob], `pasted-${Date.now()}.png`, { type });
					handlePick(file);
					toast.success('Image pasted from clipboard');
					return;
				}
			}
			toast.info('No image found on the clipboard.');
		} catch {
			toast.info('Press Ctrl+V (Cmd+V on Mac) to paste an image.');
		}
	}

	$effect(() => {
		if (typeof window === 'undefined') return;
		if (!open) return;
		window.addEventListener('paste', handlePaste);
		return () => window.removeEventListener('paste', handlePaste);
	});

	$effect(() => {
		if (!open) reset();
	});
</script>

<Dialog
	bind:open
	onOpenChange={(v) => {
		if (!v) reset();
		onOpenChange(v);
	}}
	size="xl"
	title="Scan a receipt"
	description="Upload, take a photo, or paste an image. We'll extract items and prices for you to assign."
>
	{#if !hasPersons}
		<EmptyState
			icon={Settings2}
			title="Set up the bill first"
			description="Pick a Splitwise group + members on the Home page (or use Manual entry), then come back to scan."
		/>
	{:else if stage === 'idle' || stage === 'extracting'}
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<div class="flex flex-col gap-3">
				<ReceiptUploader
					disabled={stage === 'extracting'}
					onPick={handlePick}
				/>
				<div class="flex items-center justify-between rounded-md border border-default bg-surface-muted px-3 py-2 text-xs">
					<div class="text-fg-muted">
						Tip: paste a screenshot with
						<kbd class="rounded border border-default bg-surface px-1.5 py-0.5 font-mono text-[10px]">Ctrl</kbd>
						<span class="text-fg-subtle">+</span>
						<kbd class="rounded border border-default bg-surface px-1.5 py-0.5 font-mono text-[10px]">V</kbd>
					</div>
					<Button variant="ghost" size="sm" onclick={pasteFromButton}>
						<Clipboard class="size-3.5" />
						Paste image
					</Button>
				</div>
			</div>

			{#if previewUrl}
				<div class="flex flex-col gap-3">
					<div class="overflow-hidden rounded-xl border border-default bg-surface-muted">
						<img
							src={previewUrl}
							alt="Selected receipt"
							class="max-h-80 w-full object-contain"
						/>
					</div>
					<div class="flex flex-wrap items-center justify-between gap-2">
						<div class="text-xs text-fg-muted">
							{pickedFile?.name ?? 'pasted image'} · {pickedFile ? (pickedFile.size / 1_000_000).toFixed(1) : '0'} MB
						</div>
						<div class="flex gap-2">
							<Button
								variant="secondary"
								size="sm"
								onclick={() => {
									revokePreview();
									pickedFile = null;
								}}
								disabled={stage === 'extracting'}
							>
								Remove
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
	{:else if stage === 'review' && scanResult}
		<div class="flex flex-col gap-4">
			<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<div class="flex flex-col gap-3 lg:col-span-1">
					<div class="overflow-hidden rounded-xl border border-default bg-surface-muted">
						{#if previewUrl}
							<img
								src={previewUrl}
								alt="Scanned receipt"
								class="max-h-[24rem] w-full object-contain"
							/>
						{/if}
					</div>
					{#if scanResult.subtotal != null || scanResult.total != null}
						<div class="rounded-md border border-default px-3 py-2 text-xs text-fg-muted">
							{#if scanResult.subtotal != null}Subtotal {scanResult.subtotal.toFixed(2)}{/if}
							{#if scanResult.total != null}{#if scanResult.subtotal != null} · {/if}Total {scanResult.total.toFixed(2)}{/if}
							{#if scanResult.currency}{' '}{scanResult.currency}{/if}
						</div>
					{/if}
				</div>

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

					<div class="flex flex-col gap-3">
						<div class="flex items-end justify-between gap-3">
							<div>
								<h3 class="font-semibold text-fg">Items</h3>
								<p class="text-xs text-fg-muted">
									Edit if needed, then assign each item to people.
								</p>
							</div>
							<label class="flex flex-col items-end text-right text-xs">
								<span class="uppercase tracking-wide text-fg-muted">Currency</span>
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
							</label>
						</div>

						<ItemsTable
							items={items}
							persons={persons}
							gst={{ applyGst, settings: gstSettings }}
							{currency}
							onItemsChange={(next) => (items = next)}
						/>
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#snippet footer()}
		{#if stage === 'review'}
			<Button variant="ghost" onclick={reset}>
				<RefreshCw class="size-4" /> Start over
			</Button>
			<Button onclick={applyToBill} disabled={!canApply}>
				Apply to bill
				<ChevronRight class="size-4" />
			</Button>
		{:else}
			<Button variant="ghost" onclick={close}>Cancel</Button>
			{#if pickedFile}
				<Button
					onclick={extract}
					loading={stage === 'extracting'}
				>
					<Sparkles class="size-4" />
					Extract items
				</Button>
			{/if}
		{/if}
	{/snippet}
</Dialog>
