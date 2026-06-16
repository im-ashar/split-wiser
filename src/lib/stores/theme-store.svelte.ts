import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'split-wiser-theme';

function readInitial(): Theme {
	if (!browser) return 'light';
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === 'light' || stored === 'dark') return stored;
	return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function apply(theme: Theme): void {
	if (!browser) return;
	document.documentElement.dataset.theme = theme;
}

function makeStore() {
	const initial = readInitial();
	let value = $state<Theme>(initial);

	if (browser) {
		apply(initial);
	}

	return {
		get current() {
			return value;
		},
		set(next: Theme) {
			value = next;
			if (browser) {
				localStorage.setItem(STORAGE_KEY, next);
				apply(next);
			}
		},
		toggle() {
			this.set(value === 'light' ? 'dark' : 'light');
		}
	};
}

export const themeStore = makeStore();
