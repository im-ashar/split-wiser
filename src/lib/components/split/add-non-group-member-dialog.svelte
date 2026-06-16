<script lang="ts">
	import Dialog from '$lib/components/ui/dialog.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import { capitalizeFullName } from '$lib/utils/capitalize';
	import { splitStore } from '$lib/stores/split-store.svelte';
	import { toast } from 'svelte-sonner';

	type Props = { open: boolean; onOpenChange: (open: boolean) => void };
	let { open = $bindable(), onOpenChange }: Props = $props();

	let name = $state('');

	function close() {
		name = '';
		onOpenChange(false);
	}

	function add() {
		const trimmed = capitalizeFullName(name.trim());
		if (!trimmed) return;
		const ok = splitStore.addNonGroupPerson(trimmed);
		if (!ok) {
			toast.warning('Duplicate name', {
				description: 'A person with this name already exists.'
			});
			return;
		}
		toast.success('Person added', {
			description: `${trimmed} has been added to the bill.`
		});
		close();
	}
</script>

<Dialog
	bind:open
	{onOpenChange}
	title="Add non-group member"
	description="Track people who aren’t in your Splitwise group. They’ll be settled in cash."
	size="sm"
>
	<div class="flex flex-col gap-2">
		<Label for="non-group-name">Name</Label>
		<Input
			id="non-group-name"
			placeholder="Enter their name"
			bind:value={name}
			autofocus
			onkeydown={(e) => e.key === 'Enter' && add()}
		/>
	</div>

	{#snippet footer()}
		<Button variant="ghost" onclick={close}>Cancel</Button>
		<Button onclick={add} disabled={!name.trim()}>Add person</Button>
	{/snippet}
</Dialog>
