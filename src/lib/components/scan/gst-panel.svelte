<script lang="ts">
	import type { GstSettings } from '$lib/scan/gst';
	import { cn } from '$lib/utils/cn';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import Percent from '@lucide/svelte/icons/percent';

	type Props = {
		settings: GstSettings;
		applyGst: boolean;
		detected: boolean;
		class?: string;
		onChange: (next: { applyGst: boolean; settings: GstSettings }) => void;
	};

	let {
		settings,
		applyGst,
		detected,
		class: className,
		onChange
	}: Props = $props();

	let mode: 'inclusive' | 'exclusive' = $derived(
		settings.pricesInclude ? 'inclusive' : 'exclusive'
	);

	function update(next: Partial<{ applyGst: boolean; settings: GstSettings }>) {
		const merged = {
			applyGst: next.applyGst ?? applyGst,
			settings: { ...settings, ...next.settings }
		};
		onChange(merged);
	}
</script>

<div
	class={cn(
		'flex flex-col gap-4 rounded-xl border border-default bg-surface p-4',
		className
	)}
>
	<div class="flex items-start gap-3">
		<div class="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
			<Percent class="size-4" />
		</div>
		<div class="flex-1">
			<div class="flex items-center gap-2">
				<h3 class="font-semibold text-fg">GST / tax</h3>
				{#if detected}
					<span class="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success">
						<Sparkles class="size-3" /> Detected
					</span>
				{/if}
			</div>
			<p class="text-xs text-fg-muted">
				{#if detected}
					Found on the receipt. You can override the rate or treatment if needed.
				{:else}
					Not mentioned on this receipt. Apply manually if it should still be added.
				{/if}
			</p>
		</div>
	</div>

	<label class="flex cursor-pointer items-start gap-3 rounded-lg border border-default bg-surface-muted p-3 text-sm">
		<input
			type="checkbox"
			class="mt-0.5 size-4"
			checked={applyGst}
			onchange={(e) =>
				update({ applyGst: (e.currentTarget as HTMLInputElement).checked })}
		/>
		<span class="flex-1">
			<span class="block font-medium text-fg">Apply GST to this bill</span>
			<span class="block text-xs text-fg-muted">
				When off, line prices are taken as-is with no tax math.
			</span>
		</span>
	</label>

	{#if applyGst}
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			<div class="flex flex-col gap-1.5">
				<Label for="gst-rate">Rate</Label>
				<div class="relative">
					<Input
						id="gst-rate"
						type="number"
						min="0"
						max="100"
						step="0.01"
						value={settings.rate}
						oninput={(e) =>
							update({
								settings: {
									rate: Number((e.currentTarget as HTMLInputElement).value),
									pricesInclude: settings.pricesInclude
								}
							})}
					/>
					<span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-fg-muted">
						%
					</span>
				</div>
			</div>

			<div class="flex flex-col gap-1.5">
				<Label for="gst-mode">Prices on receipt are</Label>
				<select
					id="gst-mode"
					class="flex h-10 w-full rounded-md border border-default bg-surface-muted px-3 text-sm focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
					value={mode}
					onchange={(e) =>
						update({
							settings: {
								rate: settings.rate,
								pricesInclude: (e.currentTarget as HTMLSelectElement).value === 'inclusive'
							}
						})}
				>
					<option value="exclusive">Net (GST not included)</option>
					<option value="inclusive">Gross (GST already included)</option>
				</select>
			</div>
		</div>
	{/if}
</div>
