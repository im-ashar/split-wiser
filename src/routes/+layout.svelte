<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/navbar.svelte';
	import Toaster from '$lib/components/ui/toaster.svelte';
	import NavProgress from '$lib/components/ui/nav-progress.svelte';

	let { children } = $props();
</script>

<NavProgress />

<div class="flex min-h-dvh flex-col bg-bg">
	<Navbar />
	<main class="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
		{@render children()}
	</main>
	<footer class="border-t border-default py-6 text-center text-xs text-fg-muted">
		<p>Split-Wiser · Calculate fair, post to Splitwise.</p>
	</footer>
</div>

<Toaster />
