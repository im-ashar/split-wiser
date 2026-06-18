<script lang="ts">
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';

	type Props = {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		onConfirm: (description: string) => void;
		posting?: boolean;
	};

	let { open = $bindable(), onOpenChange, onConfirm, posting = false }: Props = $props();
	let description = $state('');

	function close() {
		description = '';
		onOpenChange(false);
	}

	function confirm() {
		const trimmed = description.trim();
		if (!trimmed) return;
		onConfirm(trimmed);
	}
</script>

<Dialog
	bind:open
	{onOpenChange}
	title="Describe this expense"
	description="A short summary that will appear on Splitwise."
	size="sm"
>
	<div class="flex flex-col gap-2">
		<Label for="expense-description">Description</Label>
		<Input
			id="expense-description"
			placeholder="e.g. Dinner at La Casa"
			bind:value={description}
			onkeydown={(e) => e.key === 'Enter' && confirm()}
			autofocus
		/>
	</div>

	{#snippet footer()}
		<Button variant="ghost" onclick={close}>Cancel</Button>
		<Button onclick={confirm} disabled={!description.trim() || posting} loading={posting}>
			Post expense
		</Button>
	{/snippet}
</Dialog>
