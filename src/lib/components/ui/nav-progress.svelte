<script lang="ts">
	import { navigating } from '$app/state';

	// `navigating` is null when idle, or an object during a navigation.
	// We animate width via CSS while it's truthy and fade it out when done.
	const isNavigating = $derived(navigating.to !== null);
</script>

<div
	class="pointer-events-none fixed left-0 right-0 top-16 z-30 h-0.5"
	aria-hidden="true"
>
	{#if isNavigating}
		<div
			class="h-full origin-left bg-primary shadow-[0_0_8px_var(--primary)]"
			style="animation: progress-grow 5s cubic-bezier(0.05, 0.7, 0.1, 1) forwards;"
		></div>
	{/if}
</div>

<style>
	@keyframes progress-grow {
		0% {
			width: 0%;
		}
		20% {
			width: 30%;
		}
		50% {
			width: 60%;
		}
		80% {
			width: 85%;
		}
		100% {
			width: 95%;
		}
	}
</style>
