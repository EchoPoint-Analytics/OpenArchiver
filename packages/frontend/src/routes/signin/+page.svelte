<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { api } from '$lib/api.client';

	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);

	async function handleSubmit() {
		isLoading = true;
		try {
			const response = await api('/auth/login', {
				method: 'POST',
				body: JSON.stringify({ email, password }),
			});
			const loginData = await response.json();
			
			document.cookie = `accessToken=${loginData.accessToken}; path=/; max-age=604800; samesite=lax`;
			localStorage.setItem('accessToken', loginData.accessToken);
			localStorage.setItem('user', JSON.stringify(loginData.user));
			
			window.location.href = '/dashboard';
		} catch (e: any) {
			console.error('Login error:', e);
			isLoading = false;
			alert('Login failed: ' + e.message);
		}
	}
</script>

<svelte:head>
	<title>Login - ProofArchive</title>
	<meta name="description" content="Login to your ProofArchive account." />
</svelte:head>

<div class="flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900" style="height: 100vh; overflow: hidden;">
	<div>
		<a href="https://ProofArchive.co.za/" target="_blank" class="flex flex-row items-center gap-3">
			<img src="/logos/logo-sq.png" alt="ProofArchive Logo" class="h-16 w-auto" />
		</a>
	</div>
	<Card.Root class="w-full max-w-md mt-8">
		<Card.Header>
			<Card.Title class="text-2xl text-center">Login</Card.Title>
		</Card.Header>
		<Card.Content>
			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="grid gap-4">
				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input id="email" type="email" placeholder="m@example.com" required bind:value={email} />
				</div>
				<div class="grid gap-2">
					<Label for="password">Password</Label>
					<Input id="password" type="password" required bind:value={password} />
				</div>
				<Button type="submit" class="w-full" disabled={isLoading}>
					{isLoading ? 'Working...' : 'Login'}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>
