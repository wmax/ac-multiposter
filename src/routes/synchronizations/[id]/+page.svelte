<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { view, getOperations } from './view.remote';
	import { update, type UpdateSyncInput } from './update.remote';
	import { remove } from './delete.remote';
	import { sync } from './sync.remote';
	import DashboardCard from '$lib/components/ui/DashboardCard.svelte';
	import {
		Calendar,
		RefreshCw,
		Settings,
		Trash2,
		CheckCircle2,
		XCircle,
		Clock,
		AlertCircle,
		ArrowLeft
	} from '@lucide/svelte';

	const configId = $page.params.id!;
	type SyncSettings = { calendarId?: string; syncIntervalMinutes?: number };

	let config = $state<Awaited<ReturnType<typeof view>> | null>(null);
	let operations = $state<Awaited<ReturnType<typeof getOperations>> | null>(null);
	let configLoading = $state(true);
	let operationsLoading = $state(true);
	let configError = $state<string | null>(null);
	let operationsError = $state<string | null>(null);
	let isUpdating = $state(false);
	let isDeleting = $state(false);
	let isSyncing = $state(false);
	let updateError = $state<string | null>(null);
	let deleteError = $state<string | null>(null);
	let syncError = $state<string | null>(null);

	async function loadConfig() {
		try {
			configLoading = true;
			configError = null;
			config = await view(configId);
		} catch (e: any) {
			configError = e.message;
		} finally {
			configLoading = false;
		}
	}

	async function loadOperations() {
		try {
			operationsLoading = true;
			operationsError = null;
			operations = await getOperations(configId);
		} catch (e: any) {
			operationsError = e.message;
		} finally {
			operationsLoading = false;
		}
	}

	$effect(() => {
		if (configId) {
			loadConfig();
			loadOperations();
		}
	});

	async function toggleEnabled() {
		if (!config) return;
		const input = {
			enabled: !config.enabled
		};
		try {
			isUpdating = true;
			updateError = null;
			await update({ id: configId, input });
			await loadConfig();
		} catch (e: any) {
			updateError = e.message;
		} finally {
			isUpdating = false;
		}
	}

	async function triggerSync() {
		try {
			isSyncing = true;
			syncError = null;
			await sync(configId);
			await loadConfig();
			await loadOperations();
		} catch (e: any) {
			syncError = e.message;
		} finally {
			isSyncing = false;
		}
	}

	async function confirmDelete() {
		if (confirm('Are you sure you want to delete this sync configuration?')) {
			try {
				isDeleting = true;
				deleteError = null;
				await remove(configId);
				goto('/synchronizations');
			} catch (e: any) {
				deleteError = e.message;
				isDeleting = false;
			}
		}
	}

	function formatDate(date: Date | null) {
		if (!date) return 'Never';
		return new Date(date).toLocaleString();
	}

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

	function getStatusIcon(status: string) {
		if (status === 'completed') return CheckCircle2;
		if (status === 'failed') return XCircle;
		if (status === 'pending') return Clock;
		return AlertCircle;
	}

	function getStatusColor(status: string) {
		if (status === 'completed') return 'text-green-600';
		if (status === 'failed') return 'text-red-600';
		if (status === 'pending') return 'text-yellow-600';
		return 'text-gray-600';
	}

	function getOperationLabel(operation: string) {
		if (operation === 'pull') return 'Pull';
		if (operation === 'push') return 'Push';
		if (operation === 'delete') return 'Delete';
		return operation;
	}
</script>

<svelte:head>
	<title>{config ? getProviderLabel(config.providerType) + ' Sync' : 'Calendar Sync'}</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8">
		<button onclick={() => goto('/synchronizations')} class="text-blue-600 hover:text-blue-700 mb-4 inline-block">
			← Back to Synchronizations
		</button>

		{#if configLoading}
			<div class="flex justify-center py-12">
				<RefreshCw class="h-8 w-8 animate-spin text-gray-400" />
			</div>
		{:else if configError}
			<div class="rounded-lg border border-red-200 bg-red-50 p-4">
				<div class="flex items-center gap-2 text-red-600">
					<AlertCircle class="h-5 w-5" />
					<p>Failed to load sync configuration: {configError}</p>
				</div>
			</div>
		{:else if config}
			<div class="space-y-6">
				<!-- Header -->
				<div class="flex items-start justify-between">
					<div class="flex items-center gap-4">
						<div class="rounded-lg bg-blue-100 p-3">
							<Calendar class="h-8 w-8 text-blue-600" />
						</div>
						<div>
							<h1 class="text-3xl font-bold">{getProviderLabel(config.providerType)}</h1>
							<p class="text-gray-600">{config.providerId}</p>
						</div>
					</div>
					<div class="flex gap-2">
						<button
													type="button"
													onclick={triggerSync}
							disabled={isSyncing}
							class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
						>
							<RefreshCw class="h-4 w-4 {isSyncing ? 'animate-spin' : ''}" />
							{isSyncing ? 'Syncing...' : 'Sync Now'}
						</button>
						<button
													type="button"
													onclick={toggleEnabled}
							disabled={isUpdating}
							class="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
						>
							{config.enabled ? 'Disable' : 'Enable'}
						</button>
						<button
													type="button"
													onclick={confirmDelete}
							disabled={isDeleting}
							class="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
						>
							<Trash2 class="h-4 w-4" />
							Delete
						</button>
					</div>
				</div>

				<!-- Status Info -->
				<div class="grid gap-6 md:grid-cols-2">
					<div class="rounded-lg border border-gray-200 bg-white p-6">
						<h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
							<Settings class="h-5 w-5" />
							Configuration
						</h2>
						<div class="space-y-3 text-sm">
							<div class="flex justify-between">
								<span class="text-gray-600">Status:</span>
								<span
									class="font-medium {config.enabled
										? 'text-green-600'
										: 'text-gray-400'}"
								>
									{config.enabled ? 'Enabled' : 'Disabled'}
								</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Direction:</span>
								<span class="font-medium">{getDirectionLabel(config.direction)}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Calendar ID:</span>
								<span class="font-medium">
									{(config.settings as SyncSettings)?.calendarId || 'primary'}
								</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Sync Interval:</span>
								<span class="font-medium">
									{(config.settings as SyncSettings)?.syncIntervalMinutes || 60} minutes
								</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Webhooks:</span>
								<span
									class="font-medium {config.webhookId
										? 'text-green-600'
										: 'text-gray-400'}"
								>
									{config.webhookId ? 'Active' : 'Inactive'}
								</span>
							</div>
						</div>
					</div>

					<div class="rounded-lg border border-gray-200 bg-white p-6">
						<h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
							<Clock class="h-5 w-5" />
							Sync Status
						</h2>
						<div class="space-y-3 text-sm">
							<div class="flex justify-between">
								<span class="text-gray-600">Last Sync:</span>
								<span class="font-medium">{formatDate(config.lastSyncAt)}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Next Sync:</span>
								<span class="font-medium">{formatDate(config.nextSyncAt)}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Created:</span>
								<span class="font-medium">{formatDate(config.createdAt)}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">Updated:</span>
								<span class="font-medium">{formatDate(config.updatedAt)}</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Sync Result Messages -->
				{#if syncError}
					<div class="rounded-lg border border-red-200 bg-red-50 p-4">
						<div class="flex items-center gap-2 text-red-600">
							<AlertCircle class="h-5 w-5" />
							<p>Sync failed: {syncError}</p>
						</div>
					</div>
				{/if}

				{#if updateError}
					<DashboardCard>
						<div class="flex items-center gap-2 text-red-600">
							<AlertCircle class="h-5 w-5" />
							<p>Update failed: {updateError}</p>
						</div>
					</DashboardCard>
				{/if}

				<!-- Recent Operations -->
					<div class="rounded-lg border border-gray-200 bg-white p-6">
					<h2 class="text-lg font-semibold mb-4">Recent Sync Operations</h2>
					{#if operationsLoading}
						<div class="flex justify-center py-8">
							<RefreshCw class="h-6 w-6 animate-spin text-gray-400" />
						</div>
					{:else if operationsError}
						<div class="flex items-center gap-2 text-red-600">
							<AlertCircle class="h-5 w-5" />
							<p>Failed to load operations: {operationsError}</p>
						</div>
					{:else if operations && operations.length === 0}
						<p class="text-gray-500 text-center py-8">No sync operations yet</p>
					{:else if operations}
						<div class="space-y-2">
							{#each operations as operation}
								{@const Icon = getStatusIcon(operation.status)}
								{@const statusColor = getStatusColor(operation.status)}
								<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
									<div class="flex items-center gap-3">
										<Icon class="h-5 w-5 {statusColor}" />
										<div>
											<div class="font-medium">
												{getOperationLabel(operation.operation)}
												{operation.entityType}
											</div>
											<div class="text-xs text-gray-500">
												{formatDate(operation.startedAt)}
												{#if operation.completedAt}
													→ {formatDate(operation.completedAt)}
												{/if}
											</div>
										</div>
									</div>
									<div class="text-sm">
										<span class={`font-medium ${statusColor}`}>
											{operation.status}
										</span>
										{#if operation.retryCount > 0}
											<span class="text-gray-500 ml-2">
												(retried {operation.retryCount}x)
											</span>
										{/if}
									</div>
								</div>
								{#if operation.error}
									<div class="ml-8 text-sm text-red-600 bg-red-50 p-2 rounded">
										{operation.error}
									</div>
								{/if}
							{/each}
						</div>
					{/if}
					</div>
			</div>
		{/if}
	</div>
</div>
