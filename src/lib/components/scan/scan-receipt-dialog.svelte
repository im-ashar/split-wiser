<script lang="ts">
	import { onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import EmptyState from '$lib/components/ui/empty-state.svelte';
	import ReceiptUploader from '$lib/components/scan/receipt-uploader.svelte';
	import GstPanel from '$lib/components/scan/gst-panel.svelte';
	import ItemsList, {
		type ScanItemRow
	} from '$lib/components/scan/items-list.svelte';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Clipboard from '@lucide/svelte/icons/clipboard';
	import Settings2 from '@lucide/svelte/icons/settings-2';
	import ImageIcon from '@lucide/svelte/icons/image';
	import X from '@lucide/svelte/icons/x';
	import DiscountIcon from '@lucide/svelte/icons/badge-percent';
	import { splitStore } from '$lib/stores/split-store.svelte';
	import { toNetForBill, type GstSettings } from '$lib/scan/gst';
	import { applyDiscount, type DiscountValue } from '$lib/split/discount';
	import DiscountInput from '$lib/components/ui/discount-input.svelte';
	import type { ApiEnvelope } from '$lib/server/respond';

	type ScanResult = {
		items: Array<{ name: string; price: number; discountPct: number }>;
		currency: string | null;
		gstRate: number | null;
		pricesInclude: 'gst' | 'no-gst' | 'unknown';
		billDiscountPct: number;
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
	let billDiscountPct = $state(0); // raw % value detected by AI (used to flag the "Detected" badge)
	let billDiscount = $state<DiscountValue>({ value: 0, unit: 'pct' });

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
		billDiscountPct = 0;
		billDiscount = { value: 0, unit: 'pct' };
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
		billDiscountPct = r.billDiscountPct ?? 0;
		billDiscount = { value: billDiscountPct, unit: 'pct' };
		items = r.items.map((it, i) => ({
			id: Date.now() + i,
			name: it.name,
			price: it.price,
			discount: { value: it.discountPct ?? 0, unit: 'pct' },
			excludeGst: false,
			assigneeIds: [],
			divide: true
		}));
	}

	function applyToBill() {
		if (!canApply) return;
		const effectiveGst: GstSettings = applyGst
			? gstSettings
			: { rate: 0, pricesInclude: false };

		// Map: personId → [{amount, noGst}]
		const additions = new Map<number, Array<{ amount: number; noGst: boolean }>>();

		for (const row of items) {
			if (row.assigneeIds.length === 0 || !Number.isFinite(row.price) || row.price <= 0) continue;

			// 1. Apply item-level discount (% or fixed amount).
			const afterDiscount =
				row.discount.value > 0
					? Math.round(applyDiscount(row.price, row.discount) * 100) / 100
					: row.price;

			// 2. Convert to net so the bill-level GST reconstructs the correct gross.
			//    For excluded items, push the discounted price as-is and mark noGst.
			const net = row.excludeGst
				? afterDiscount
				: toNetForBill([afterDiscount], effectiveGst)[0] ?? afterDiscount;

			const perPerson = row.divide ? net / row.assigneeIds.length : net;
			const rounded = Math.round(perPerson * 100) / 100;

			for (const pid of row.assigneeIds) {
				const list = additions.get(pid) ?? [];
				list.push({ amount: rounded, noGst: row.excludeGst });
				additions.set(pid, list);
			}
		}

		for (const [pid, rows] of additions.entries()) {
			for (const { amount, noGst } of rows) {
				splitStore.addAmount(pid);
				const person = splitStore.persons.find((p) => p.id === pid);
				const lastRow = person?.listOfAmounts[person.listOfAmounts.length - 1];
				if (lastRow) {
					// Patch the noGst flag directly; setAmount only takes the numeric value.
					splitStore.setAmount(pid, lastRow.id, amount);
					if (noGst) {
						// Mark the row so calculateTotals skips GST for it.
						const p = splitStore.persons.find((x) => x.id === pid);
						if (p) {
							const rowIdx = p.listOfAmounts.findIndex((r) => r.id === lastRow.id);
							if (rowIdx !== -1 && p.listOfAmounts[rowIdx]) {
								p.listOfAmounts[rowIdx] = { ...p.listOfAmounts[rowIdx]!, noGst: true };
								splitStore.recompute();
							}
						}
					}
				}
			}
		}

		if (applyGst && gstSettings.rate > 0) {
			splitStore.gstPercentage = gstSettings.rate;
		}

		// Apply bill-level discount if the user kept it.
		if (billDiscount.value > 0) {
			splitStore.discountOnTotalBill = billDiscount;
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
		<div class="flex flex-col gap-4">
			<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<!-- Upload column -->
				<div class="flex flex-col gap-3">
					<ReceiptUploader
						disabled={stage === 'extracting'}
						onPick={handlePick}
						class="min-h-[20rem]"
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

				<!-- Preview column — always present so layout doesn't jump -->
				<div class="flex flex-col gap-3">
					<div
						class="flex min-h-[20rem] items-center justify-center overflow-hidden rounded-xl border border-default bg-surface-muted p-3"
					>
						{#if previewUrl}
							<img
								src={previewUrl}
								alt="Selected receipt"
								class="max-h-[18rem] w-full object-contain"
							/>
						{:else}
							<div class="flex flex-col items-center gap-2 px-6 py-10 text-center">
								<ImageIcon class="size-8 text-fg-subtle" aria-hidden="true" />
								<p class="text-sm font-medium text-fg-muted">
									Your receipt preview will appear here
								</p>
								<p class="text-xs text-fg-subtle">
									Choose, photograph, or paste an image to begin.
								</p>
							</div>
						{/if}
					</div>
					<div
						class="flex h-10 items-center justify-between rounded-md border border-default bg-surface-muted px-3 text-xs"
					>
						{#if pickedFile}
							<span class="truncate text-fg-muted">
								{pickedFile.name} · {(pickedFile.size / 1_000_000).toFixed(1)} MB
							</span>
							<Button
								variant="ghost"
								size="sm"
								onclick={() => {
									revokePreview();
									pickedFile = null;
								}}
								disabled={stage === 'extracting'}
							>
								<X class="size-3.5" />
								Remove
							</Button>
						{:else}
							<span class="text-fg-subtle">No image selected.</span>
						{/if}
					</div>
				</div>
			</div>

			{#if extractError}
				<div class="rounded-md border border-default bg-danger-soft px-3 py-2 text-sm text-danger">
					{extractError}
				</div>
			{/if}
		</div>
	{:else if stage === 'review' && scanResult}
		<div class="flex flex-col gap-4">
			<!-- Top strip: receipt thumbnail + GST panel side-by-side -->
			<div class="grid grid-cols-1 gap-4 lg:grid-cols-[18rem_1fr]">
				<div class="flex flex-col gap-2">
					<div class="overflow-hidden rounded-xl border border-default bg-surface-muted">
						{#if previewUrl}
							<img
								src={previewUrl}
								alt="Scanned receipt"
								class="max-h-72 w-full object-contain"
							/>
						{/if}
					</div>
					{#if scanResult.subtotal != null || scanResult.total != null}
						<div class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-default px-3 py-2 font-mono text-xs text-fg-muted">
							{#if scanResult.subtotal != null}
								<span>Subtotal <span class="text-fg">{scanResult.subtotal.toFixed(2)}</span></span>
							{/if}
							{#if scanResult.total != null}
								<span>Total <span class="text-fg">{scanResult.total.toFixed(2)}</span></span>
							{/if}
							{#if scanResult.currency}
								<span class="ml-auto rounded-full bg-surface-muted px-2 py-0.5 text-[10px] uppercase tracking-wide">
									{scanResult.currency}
								</span>
							{/if}
						</div>
					{/if}
				</div>

				<GstPanel
					applyGst={applyGst}
					detected={detectedGst}
					settings={gstSettings}
					onChange={(next) => {
						applyGst = next.applyGst;
						gstSettings = next.settings;
					}}
				/>
			</div>

			<!-- Bill-level discount — full width below the receipt + GST row -->
			<div
				class="flex flex-col gap-3 rounded-xl border border-default bg-surface p-4 sm:flex-row sm:items-center sm:gap-4"
			>
				<div class="flex items-start gap-3 sm:flex-1">
					<div class="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-success-soft text-success">
						<DiscountIcon class="size-4" />
					</div>
					<div class="flex flex-1 flex-col gap-1">
						<div class="flex flex-wrap items-center gap-2">
							<span class="text-sm font-semibold text-fg">Bill discount</span>
							{#if billDiscountPct > 0 && billDiscount.unit === 'pct' && billDiscount.value === billDiscountPct}
								<span class="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success">
									<Sparkles class="size-3" /> Detected
								</span>
							{/if}
						</div>
						<p class="text-xs text-fg-muted">
							Applied to the whole bill after all items are totalled. Toggle % or {currency} as needed.
						</p>
					</div>
				</div>
				<div class="w-full sm:w-52 sm:shrink-0">
					<DiscountInput
						value={billDiscount}
						{currency}
						ariaLabel="Bill discount"
						onChange={(next) => (billDiscount = next)}
					/>
				</div>
			</div>

			<!-- Full-width items section -->
			<div class="flex flex-col gap-3">
				<div class="flex items-end justify-between gap-3">
					<div>
						<h3 class="font-semibold text-fg">Items</h3>
						<p class="text-xs text-fg-muted">
							Edit if needed, then assign each item to the people who shared it.
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

				<ItemsList
					items={items}
					persons={persons}
					gst={{ applyGst, settings: gstSettings }}
					{currency}
					billDiscount={billDiscount}
					onItemsChange={(next) => (items = next)}
				/>
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
			<Button
				onclick={extract}
				loading={stage === 'extracting'}
				disabled={!pickedFile}
			>
				<Sparkles class="size-4" />
				Extract items
			</Button>
		{/if}
	{/snippet}
</Dialog>
