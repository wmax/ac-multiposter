<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { onMount } from 'svelte';

	let user = $state<any>(null);
	let loading = $state(true);
	let userClaims = $state<any>(null);
	let userRoles = $state<string[]>([]);

	onMount(async () => {
		try {
			const session = await authClient.getSession();
			user = session?.data?.user;
			console.log('User object:', user);
			console.log('user.roles:', user?.roles);
			console.log('user.claims:', user?.claims);
			
			// Parse roles
			if (user?.roles) {
				try {
					userRoles = typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles;
					console.log('Parsed roles:', userRoles);
				} catch (e) {
					console.error('Failed to parse roles:', e);
				}
			}
			
			// Parse claims
			if (user?.claims) {
				try {
					userClaims = typeof user.claims === 'string' ? JSON.parse(user.claims) : user.claims;
					console.log('Parsed claims:', userClaims);
				} catch (e) {
					console.error('Failed to parse claims:', e);
				}
			}
		} catch (error) {
			console.error('Failed to load session:', error);
		} finally {
			loading = false;
		}
	});
</script>

<div class="space-y-8">
	{#if loading}
		<div class="flex justify-center items-center min-h-[400px]">
			<div class="text-gray-600">Loading...</div>
		</div>
	{:else if user}
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
			
			<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
				<h3 class="font-semibold text-blue-900 mb-2">Welcome to AC Multiposter!</h3>
				<p class="text-blue-800 text-sm">
					You're successfully signed in. This is your dashboard where you can manage your calendar syncs and events.
				</p>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-stretch">
				<div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100 flex flex-col justify-between h-full">
					<div>
						<div class="flex items-center gap-2 mb-3">
							<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							<h3 class="font-semibold text-gray-900">Calendar Syncs</h3>
						</div>
						<p class="text-sm text-gray-600 mb-4">Connect and sync your Google Calendar and Microsoft 365 calendars.</p>
					</div>
					<div>
						<a href="/calendar-syncs" class="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
							Manage Syncs
						</a>
					</div>
				</div>

				<div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-100 flex flex-col justify-between h-full">
					<div>
						<div class="flex items-center gap-2 mb-3">
							<svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
							</svg>
							<h3 class="font-semibold text-gray-900">Events</h3>
						</div>
						<p class="text-sm text-gray-600 mb-4">Create, edit, and manage your events across multiple calendars.</p>
					</div>
					<div>
						<a href="/events" class="inline-block px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium">
							View Events
						</a>
					</div>
				</div>
				{#if userRoles.includes('admin') || userClaims?.campaigns}
					<div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-emerald-100 flex flex-col justify-between h-full">
						<div>
							<div class="flex items-center gap-2 mb-3">
								<svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7 7h10v10H7z" />
								</svg>
								<h3 class="font-semibold text-gray-900">Campaigns</h3>
							</div>
							<p class="text-sm text-gray-600 mb-4">Create and manage message campaigns to post across your connected calendars.</p>
						</div>
						<div>
							<a href="/campaigns" class="inline-block px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm font-medium">
								Manage Campaigns
							</a>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
			<svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<h2 class="text-2xl font-bold text-gray-900 mb-2">Welcome to AC Multiposter</h2>
			<p class="text-gray-600 mb-6">Sign in using the button in the top right to get started with your calendar management.</p>
			<p class="text-sm text-gray-500">
				AC Multiposter helps you manage and sync your Google Calendar and Microsoft 365 calendars in one place.
			</p>
		</div>
	{/if}
</div>

<style>
	:global(main) {
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
		min-height: 100vh;
	}
</style>
