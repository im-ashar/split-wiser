<script lang="ts">
	import { Toaster as SonnerToaster } from 'svelte-sonner';
</script>

<SonnerToaster
	position="top-right"
	richColors
	closeButton
	toastOptions={{
		classes: {
			toast: 'border border-default bg-surface text-fg shadow-token-md rounded-lg',
			title: 'font-semibold',
			description: 'text-fg-muted'
		}
	}}
/>
