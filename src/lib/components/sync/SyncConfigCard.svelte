<script lang="ts">
	import { Calendar, RefreshCw, Settings, Trash2 } from '@lucide/svelte';
	import DashboardCard from '$lib/components/ui/DashboardCard.svelte';
	import SyncStatusIndicator from './SyncStatusIndicator.svelte';

	export let config: {
		id: string;
		providerId: string;
		providerType: string;
		direction: string;
		enabled: boolean;
		lastSyncAt: Date | null;
		webhookId: string | null;
		createdAt: Date;
	};
	export let syncing: boolean = false;
	export let onSync: (() => void) | undefined = undefined;
	export let onToggle: (() => void) | undefined = undefined;
	export let onDelete: (() => void) | undefined = undefined;

	function getProviderLabel(providerType: string) {
		if (providerType === 'google-calendar') return 'Google Calendar';
		if (providerType === 'microsoft-calendar') return 'Microsoft Calendar';
		return providerType;
	}

	function getDirectionLabel(direction: string) {
		if (direction === 'pull') return 'Pull Only';
		if (direction === 'push') return 'Push Only';
		if (direction === 'bidirectional') return 'Bidirectional';
		return direction;
	}

	function getProviderIcon(providerType: string) {
		return Calendar;
	}

	function formatDate(date: Date) {
		return new Date(date).toLocaleDateString();
	}
</script>

<div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
	<div class="space-y-4">
		<!-- Header -->
		<div class="flex items-start justify-between">
			<div class="flex items-center gap-3">
				<div class="rounded-lg bg-blue-100 p-2">
					<svelte:component
						this={getProviderIcon(config.providerType)}
						class="h-6 w-6 text-blue-600"
					/>
				</div>
				<div>
					<h3 class="font-semibold text-lg">
						{getProviderLabel(config.providerType)}
					</h3>
					<p class="text-sm text-gray-500">{config.providerId}</p>
				</div>
			</div>
			<SyncStatusIndicator enabled={config.enabled} lastSyncAt={config.lastSyncAt} {syncing} />
		</div>

		<!-- Details -->
		<div class="space-y-2 text-sm">
			<div class="flex justify-between">
				<span class="text-gray-600">Direction:</span>
				<span class="font-medium">{getDirectionLabel(config.direction)}</span>
			</div>
			<div class="flex justify-between">
				<span class="text-gray-600">Status:</span>
				<span class={`font-medium ${config.enabled ? 'text-green-600' : 'text-gray-400'}`}>
					{config.enabled ? 'Enabled' : 'Disabled'}
				</span>
			</div>
			{#if config.webhookId}
				<div class="flex justify-between">
					<span class="text-gray-600">Webhooks:</span>
					<span class="font-medium text-green-600">Active</span>
				</div>
			{/if}
			<div class="flex justify-between">
				<span class="text-gray-600">Created:</span>
				<span class="font-medium">{formatDate(config.createdAt)}</span>
			</div>
		</div>

		<!-- Actions -->
		<div class="flex items-center gap-2 pt-2 border-t">
			{#if onSync}
				<button
					type="button"
					onclick={onSync}
					disabled={syncing}
					class="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
				>
					<RefreshCw class="h-4 w-4 {syncing ? 'animate-spin' : ''}" />
					{syncing ? 'Syncing...' : 'Sync'}
				</button>
			{/if}
			{#if onToggle}
				<button
					type="button"
					onclick={onToggle}
					class="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
				>
					<Settings class="h-4 w-4" />
					{config.enabled ? 'Disable' : 'Enable'}
				</button>
			{/if}
			{#if onDelete}
				<button
					type="button"
					onclick={onDelete}
					class="flex items-center gap-2 px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 ml-auto"
				>
					<Trash2 class="h-4 w-4" />
					Delete
				</button>
			{/if}
		</div>
	</div>
</div>
