<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/ui/button.svelte';
	import Menu from '@lucide/svelte/icons/menu';
	import X from '@lucide/svelte/icons/x';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Plug from '@lucide/svelte/icons/plug';
	import Wallet from '@lucide/svelte/icons/wallet';
	import Users from '@lucide/svelte/icons/users';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import Bell from '@lucide/svelte/icons/bell';
	import Receipt from '@lucide/svelte/icons/receipt';
	import Info from '@lucide/svelte/icons/info';
	import { themeStore } from '$lib/stores/theme-store.svelte';
	import { cn } from '$lib/utils/cn';

	const navItems = [
		{ href: '/', label: 'Home', icon: Wallet },
		{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/expenses', label: 'Expenses', icon: Receipt },
		{ href: '/friends', label: 'Friends', icon: Users },
		{ href: '/notifications', label: 'Inbox', icon: Bell },
		{ href: '/about', label: 'About', icon: Info }
	] as const;

	let mobileOpen = $state(false);

	function isActive(href: string): boolean {
		const path = page.url.pathname;
		return href === '/' ? path === '/' : path.startsWith(href);
	}

	function closeMobile() {
		mobileOpen = false;
	}
</script>

<header class="sticky top-0 z-40 border-b border-default bg-surface/80 backdrop-blur">
	<div class="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
		<a href="/" class="flex items-center gap-2 text-lg font-semibold tracking-tight">
			<span
				class="inline-flex size-7 items-center justify-center rounded-lg bg-primary text-primary-fg"
				aria-hidden="true"
			>
				<Wallet class="size-4" />
			</span>
			<span>Split-Wiser</span>
		</a>

		<nav class="ml-6 hidden md:flex md:items-center md:gap-1">
			{#each navItems as item (item.href)}
				<a
					href={item.href}
					class={cn(
						'inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors',
						isActive(item.href)
							? 'bg-primary-soft text-primary'
							: 'text-fg-muted hover:bg-surface-muted hover:text-fg'
					)}
				>
					<item.icon class="size-4" aria-hidden="true" />
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>

		<div class="ml-auto flex items-center gap-2">
			<Button
				variant="ghost"
				size="icon"
				onclick={() => themeStore.toggle()}
				aria-label="Toggle theme"
			>
				{#if themeStore.current === 'dark'}
					<Sun class="size-4" />
				{:else}
					<Moon class="size-4" />
				{/if}
			</Button>

			{#if page.data.isAuthenticated}
				{#if page.data.user}
					<div class="hidden items-center gap-2 sm:flex">
						{#if page.data.user.avatar}
							<img
								src={page.data.user.avatar}
								alt=""
								class="size-8 rounded-full border border-default"
							/>
						{:else}
							<div
								class="inline-flex size-8 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary"
								aria-hidden="true"
							>
								{(page.data.user.firstName[0] ?? '?').toUpperCase()}
							</div>
						{/if}
						<div class="text-sm leading-tight">
							<div class="font-medium text-fg">{page.data.user.firstName}</div>
							<div class="text-xs text-fg-muted">Connected</div>
						</div>
					</div>
				{/if}
				<form method="POST" action="/auth/logout">
					<Button type="submit" variant="ghost" size="sm">
						<LogOut class="size-4" />
						<span class="hidden sm:inline">Logout</span>
					</Button>
				</form>
			{:else}
				<Button href="/auth/login" size="sm">
					<Plug class="size-4" />
					<span>Connect Splitwise</span>
				</Button>
			{/if}

			<Button
				variant="ghost"
				size="icon"
				class="md:hidden"
				onclick={() => (mobileOpen = !mobileOpen)}
				aria-label="Toggle menu"
				aria-expanded={mobileOpen}
			>
				{#if mobileOpen}
					<X class="size-5" />
				{:else}
					<Menu class="size-5" />
				{/if}
			</Button>
		</div>
	</div>

	{#if mobileOpen}
		<nav class="border-t border-default bg-surface md:hidden">
			<ul class="flex flex-col gap-1 p-3">
				{#each navItems as item (item.href)}
					<li>
						<a
							href={item.href}
							onclick={closeMobile}
							class={cn(
								'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
								isActive(item.href)
									? 'bg-primary-soft text-primary'
									: 'text-fg-muted hover:bg-surface-muted hover:text-fg'
							)}
						>
							<item.icon class="size-4" aria-hidden="true" />
							{item.label}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	{/if}
</header>
