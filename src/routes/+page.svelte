<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { onMount } from 'svelte';
	import DashboardCard from '$lib/components/ui/DashboardCard.svelte';
	import { hasAccess, parseRoles, parseClaims } from '$lib/authorization';
	import { FEATURES, getVisibleFeatures } from '$lib/features';

	let user = $state<any>(null);
	let loading = $state(true);
	let userClaims = $state<any>(null);
	let userRoles = $state<string[]>([]);

	const isAdmin = () => userRoles.includes('admin');

	onMount(async () => {
		try {
			const session = await authClient.getSession();
			user = session?.data?.user;
            
			// Parse roles
			userRoles = parseRoles(user);
			userClaims = parseClaims(user);
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
				{#each getVisibleFeatures(user, hasAccess) as f (f.key)}
					<DashboardCard
						title={f.title}
						description={f.description}
						href={f.href}
						buttonText={f.buttonText}
						visible={true}
						gradientFrom={f.gradientFrom}
						gradientTo={f.gradientTo}
						borderClass={f.borderClass}
						buttonClass={f.buttonClass}
						icon={f.icon}
						iconClass={f.icon === 'calendar' ? 'text-blue-600' : f.icon === 'plus' ? 'text-purple-600' : 'text-emerald-600'}
					/>
				{/each}
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
