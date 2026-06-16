<script lang="ts">
	import { page } from '$app/state';
	import Card from '$lib/components/ui/card.svelte';
	import CardHeader from '$lib/components/ui/card-header.svelte';
	import CardTitle from '$lib/components/ui/card-title.svelte';
	import CardContent from '$lib/components/ui/card-content.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
</script>

<div class="flex min-h-[60vh] items-center justify-center">
	<Card class="max-w-md">
		<CardHeader>
			<div class="mb-2 flex size-10 items-center justify-center rounded-lg bg-danger-soft">
				<TriangleAlert class="size-5 text-danger" />
			</div>
			<CardTitle>{page.status} · Something went wrong</CardTitle>
		</CardHeader>
		<CardContent>
			<p class="mb-4 text-sm text-fg-muted">
				{page.error?.message ?? 'An unexpected error occurred.'}
			</p>
			<div class="flex gap-2">
				<Button href="/" variant="primary" size="sm">Back to home</Button>
				<Button onclick={() => location.reload()} variant="secondary" size="sm">
					Try again
				</Button>
			</div>
		</CardContent>
	</Card>
</div>
