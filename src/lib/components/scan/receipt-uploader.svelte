<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/cn';
	import Button from '$lib/components/ui/button.svelte';
	import Upload from '@lucide/svelte/icons/upload';
	import Camera from '@lucide/svelte/icons/camera';

	type Props = {
		accept?: string;
		disabled?: boolean;
		onPick: (file: File) => void;
		class?: string;
		hint?: Snippet;
	};

	let {
		accept = 'image/*',
		disabled = false,
		onPick,
		class: className,
		hint
	}: Props = $props();

	let dragOver = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);
	let cameraEl = $state<HTMLInputElement | null>(null);

	function handleFiles(files: FileList | null | undefined) {
		if (!files || files.length === 0) return;
		const file = files[0];
		if (file) onPick(file);
	}
</script>

<div
	class={cn(
		'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors',
		dragOver ? 'border-primary bg-primary-soft' : 'border-default bg-surface',
		disabled && 'pointer-events-none opacity-60',
		className
	)}
	role="region"
	aria-label="Upload a receipt image"
	ondragover={(e) => {
		e.preventDefault();
		dragOver = true;
	}}
	ondragleave={() => (dragOver = false)}
	ondrop={(e) => {
		e.preventDefault();
		dragOver = false;
		handleFiles(e.dataTransfer?.files);
	}}
>
	<div
		class="inline-flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary"
	>
		<Upload class="size-5" />
	</div>
	<div class="flex flex-col gap-1">
		<p class="font-medium text-fg">Drop a receipt photo, or pick one</p>
		<p class="text-sm text-fg-muted">JPEG, PNG, WebP, or HEIC up to 5MB</p>
	</div>

	<div class="mt-1 flex flex-wrap gap-2">
		<Button variant="primary" size="md" onclick={() => inputEl?.click()} {disabled}>
			<Upload class="size-4" />
			Choose file
		</Button>
		<Button variant="secondary" size="md" onclick={() => cameraEl?.click()} {disabled}>
			<Camera class="size-4" />
			Use camera
		</Button>
	</div>

	{#if hint}
		<div class="mt-1 text-xs text-fg-subtle">{@render hint()}</div>
	{/if}

	<input
		bind:this={inputEl}
		type="file"
		{accept}
		class="sr-only"
		onchange={(e) => {
			handleFiles((e.currentTarget as HTMLInputElement).files);
			(e.currentTarget as HTMLInputElement).value = '';
		}}
	/>
	<input
		bind:this={cameraEl}
		type="file"
		{accept}
		capture="environment"
		class="sr-only"
		onchange={(e) => {
			handleFiles((e.currentTarget as HTMLInputElement).files);
			(e.currentTarget as HTMLInputElement).value = '';
		}}
	/>
</div>
