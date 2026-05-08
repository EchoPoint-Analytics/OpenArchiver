import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { User } from '@ProofArchive/types';

interface AuthState {
	accessToken: string | null;
	user: Omit<User, 'passwordHash'> | null;
}

const initialValue: AuthState = {
	accessToken: null,
	user: null,
};

const createAuthStore = () => {
	const { subscribe, set } = writable<AuthState>(initialValue);

	return {
		subscribe,
		login: (accessToken: string, user: Omit<User, 'passwordHash'>) => {
			if (browser) {
				// Store in localStorage as primary
				localStorage.setItem('accessToken', accessToken);
				localStorage.setItem('user', JSON.stringify(user));
				// Also set cookie for SSR compatibility
				document.cookie = `accessToken=${accessToken}; path=/; max-age=604800; samesite=lax`;
			}
			set({ accessToken, user });
		},
		logout: () => {
			if (browser) {
				localStorage.removeItem('accessToken');
				localStorage.removeItem('user');
				document.cookie = 'accessToken=; path=/; max-age=-1; samesite=lax';
			}
			set(initialValue);
		},
		syncWithServer: (user: Omit<User, 'passwordHash'> | null, accessToken: string | null) => {
			if (user && accessToken) {
				set({ accessToken, user });
			} else {
				set(initialValue);
			}
		},
	};
};

export const authStore = createAuthStore();
