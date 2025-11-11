<script lang="ts">
	import { onMount } from 'svelte';

	let apiStatus = $state<{
		health: string;
		session: string;
		authClient: string;
	}>({
		health: 'checking...',
		session: 'checking...',
		authClient: 'checking...'
	});

	let showDebug = $state(false);

	onMount(async () => {
		try {
			// Test health endpoint
			const healthRes = await fetch('/api/health');
			apiStatus.health = healthRes.ok ? '✓ OK' : `✗ Error: ${healthRes.status}`;

			// Test session endpoint
			const sessionRes = await fetch('/api/auth/get-session');
			apiStatus.session = sessionRes.ok ? '✓ OK' : `✗ Error: ${sessionRes.status}`;

			// Test auth client
			const { authClient } = await import('$lib/auth-client');
			apiStatus.authClient = authClient ? '✓ Loaded' : '✗ Failed';
		} catch (error) {
			apiStatus.health = `✗ ${error instanceof Error ? error.message : 'Failed'}`;
			apiStatus.session = `✗ ${error instanceof Error ? error.message : 'Failed'}`;
		}
	});
</script>

<div class="fixed bottom-4 right-4 z-40">
	<button
		onclick={() => (showDebug = !showDebug)}
		class="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-xs hover:bg-gray-800 transition-colors"
		title="Toggle debug info"
	>
		?
	</button>

	{#if showDebug}
		<div class="absolute bottom-14 right-0 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 text-sm">
			<h3 class="font-bold text-gray-900 mb-3">🔧 Auth Debug Info</h3>

			<div class="space-y-2 bg-gray-50 p-3 rounded mb-3">
				<div class="flex justify-between">
					<span class="text-gray-700">Health Endpoint:</span>
					<span class="font-mono text-sm">{apiStatus.health}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-700">Session Endpoint:</span>
					<span class="font-mono text-sm">{apiStatus.session}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-700">Auth Client:</span>
					<span class="font-mono text-sm">{apiStatus.authClient}</span>
				</div>
			</div>

			<div class="text-xs text-gray-600 space-y-1">
				<p><strong>Environment:</strong></p>
				<p class="font-mono">Base URL: {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</p>
				<p class="font-mono">Path: /api/auth</p>
			</div>

		</div>
	{/if}
</div>
