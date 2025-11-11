<script lang="ts">
	import { list } from './list.remote';
	import { remove, removeBulk } from './[id]/delete.remote';
	import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
	import ListCard from '$lib/components/ui/ListCard.svelte';
	import BulkActionToolbar from '$lib/components/ui/BulkActionToolbar.svelte';
	import { createMultiSelect } from '$lib/hooks/multiSelect.svelte';
	import { Calendar, Plus, RefreshCw, AlertCircle, CheckCircle2 } from '@lucide/svelte';

	// Multi-select state
	const selection = createMultiSelect<any>();

	let configs = $state<any>(null);
	let loading = $state(true);
	let error = $state<Error | null>(null);

	async function loadConfigs() {
		loading = true;
		error = null;
		try {
			configs = await list();
		} catch (e: any) {
			error = e;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadConfigs();
	});

	async function handleBulkDelete() {
		if (selection.count === 0) return;
		if (!confirm(`Delete ${selection.count} sync configuration(s)?`)) return;

		try {
			await removeBulk(selection.getSelectedArray()).updates(list());
			selection.deselectAll();
			await loadConfigs();
		} catch (error) {
			alert('Failed to delete sync configurations');
		}
	}

	function formatDate(date: Date | null) {
		if (!date) return 'Never';
		return new Date(date).toLocaleString();
	}

	function getProviderIcon(providerType: string) {
		if (providerType === 'google-calendar') return Calendar;
		return Calendar;
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

	function getStatusColor(enabled: boolean, lastSyncAt: Date | null) {
		if (!enabled) return 'text-gray-400';
		if (!lastSyncAt) return 'text-yellow-500';
		const hoursSinceSync = (Date.now() - new Date(lastSyncAt).getTime()) / (1000 * 60 * 60);
		if (hoursSinceSync > 24) return 'text-orange-500';
		return 'text-green-500';
	}
</script>

<svelte:head>
	<title>Synchronizations</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<Breadcrumb feature="synchronizations" />
	
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Synchronizations</h1>
			<p class="text-gray-600 mt-2">Manage your calendar synchronization connections</p>
		</div>
		{#if configs && !loading}
			<BulkActionToolbar
				selectedCount={selection.count}
				totalCount={configs.length}
				onSelectAll={() => selection.selectAll(configs)}
				onDeselectAll={() => selection.deselectAll()}
				onDelete={handleBulkDelete}
				newItemHref="/synchronizations/new"
				newItemLabel="Add Sync"
			/>
		{:else}
			<a
				href="/synchronizations/new"
				class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
			>
				<Plus class="h-5 w-5" />
				Add Sync
			</a>
		{/if}
	</div>

	{#if loading}
		<div class="flex justify-center py-12">
			<RefreshCw class="h-8 w-8 animate-spin text-gray-400" />
		</div>
	{:else if error}
		<div class="rounded-lg border border-red-200 bg-red-50 p-4">
			<div class="flex items-center gap-2 text-red-600">
				<AlertCircle class="h-5 w-5" />
				<p>Failed to load sync configurations: {error}</p>
			</div>
		</div>
	{:else if configs && configs.length === 0}
		<div class="rounded-lg border border-gray-200 bg-white p-8 text-center">
			<div class="text-center py-8">
				<Calendar class="h-16 w-16 text-gray-300 mx-auto mb-4" />
				<h2 class="text-xl font-semibold text-gray-700 mb-2">No Synchronizations</h2>
				<p class="text-gray-500 mb-4">
					Get started by connecting your first calendar service
				</p>
				<a
					href="/synchronizations/new"
					class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
				>
					<Plus class="h-5 w-5" />
					Add Your First Sync
				</a>
			</div>
		</div>
	{:else if configs}
		<div class="grid gap-4">
			{#each configs as config}
				{@const Icon = getProviderIcon(config.providerType)}
				{@const statusColor = getStatusColor(config.enabled, config.lastSyncAt)}
				<ListCard
					id={config.id}
					href="/synchronizations/{config.id}"
					selected={selection.isSelected(config.id)}
					onToggle={selection.toggleSelection}
					editHref="/synchronizations/{config.id}"
					onDelete={async (id) => {
						await remove(id).updates(list());
						await loadConfigs();
					}}
					deleteLabel="Delete"
				>
					{#snippet title()}
						<a 
							href="/synchronizations/{config.id}" 
							class="flex items-center gap-3 hover:opacity-80"
							onclick={(e) => e.stopPropagation()}
						>
							<div class="rounded-lg bg-blue-100 p-2">
								<Icon class="h-6 w-6 text-blue-600" />
							</div>
							<div>
								<h3 class="font-semibold text-lg text-blue-600">
									{getProviderLabel(config.providerType)}
								</h3>
								<p class="text-sm text-gray-500">{config.providerId}</p>
							</div>
						</a>
					{/snippet}

					{#snippet badge()}
						<div class={statusColor}>
							{#if config.enabled}
								<CheckCircle2 class="h-5 w-5" />
							{:else}
								<AlertCircle class="h-5 w-5" />
							{/if}
						</div>
					{/snippet}

					{#snippet content()}
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
							<div class="flex justify-between">
								<span class="text-gray-600">Last Sync:</span>
								<span class="font-medium">{formatDate(config.lastSyncAt)}</span>
							</div>
							{#if config.webhookId}
								<div class="flex justify-between">
									<span class="text-gray-600">Webhooks:</span>
									<span class="font-medium text-green-600">Active</span>
								</div>
							{/if}
						</div>
					{/snippet}

					{#snippet metadata()}
						<p class="text-xs text-gray-500">
							Created {formatDate(config.createdAt)}
						</p>
					{/snippet}
				</ListCard>
			{/each}
		</div>
	{/if}
</div>
