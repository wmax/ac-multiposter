<script lang="ts">
	import { listCampaigns } from './list.remote';
	import { deleteCampaigns } from './[id]/delete.remote';
	import type { Campaign } from './list.remote';
	// Inlined ListPageLayout, BulkActionToolbar, EmptyState, Spinner
	import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import AsyncButton from '$lib/components/ui/AsyncButton.svelte';
	import { Megaphone } from '@lucide/svelte';
    import BulkActionToolbar from '$lib/components/ui/BulkActionToolbar.svelte';



	let itemsPromise = $state<Promise<Campaign[]>>(listCampaigns());
	let initializedItems = $state<Campaign[]>([]);
	let selectedIds = $state<Set<string>>(new Set());
	let selectionVersion = $state(0);
	import { toast } from 'svelte-sonner';

	function isSelected(id: string) {
		return selectedIds.has(id);
	}
	function toggleSelection(id: string) {
		if (selectedIds.has(id)) {
			selectedIds.delete(id);
		} else {
			selectedIds.add(id);
		}
		// Force reactivity
		selectedIds = new Set(selectedIds);
		selectionVersion++;
	}
	function selectAll(items: Campaign[]) {
		selectedIds = new Set(items.map((item) => item.id));
		selectionVersion++;
	}
	function deselectAll() {
		selectedIds = new Set();
		selectionVersion++;
	}
	function getSelectedArray() {
		return Array.from(selectedIds);
	}

	async function handleBulkDelete() {
		const ids = getSelectedArray();
		const count = ids.length;
		if (count === 0) return;
		if (!confirm(`Delete ${count} campaign${count === 1 ? '' : 's'}?`)) return;
		try {
			await deleteCampaigns(ids).updates(listCampaigns());
			toast.success(`${count} campaign${count === 1 ? '' : 's'} deleted successfully!`);
			deselectAll();
			refresh();
		} catch (error: any) {
			toast.error(error.message || 'Failed to delete campaigns');
		}
	}

	async function handleDelete(id: string) {
		if (!confirm('Delete this item?')) return;
		try {
			await deleteCampaigns([id]).updates(listCampaigns());
			selectedIds.delete(id);
			selectedIds = new Set(selectedIds);
			toast.success('Campaign deleted successfully!');
			refresh();
		} catch (error: any) {
			toast.error(error.message || 'Failed to delete campaign');
		}
	}

	function refresh() {
		itemsPromise = listCampaigns();
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="max-w-4xl mx-auto">
		<Breadcrumb feature="campaigns" />
		<div class="bg-white shadow rounded-lg p-6">
			<div class="flex justify-between items-center mb-6 gap-4">
				<h1 class="text-3xl font-bold flex-shrink-0">Campaigns</h1>
				<div class="flex-1 flex justify-end">
					<BulkActionToolbar 
						selectedCount={selectedIds.size}
						totalCount={initializedItems.length}
						onSelectAll={() => selectAll(initializedItems)}
						onDeselectAll={deselectAll}
						onDelete={handleBulkDelete}
						newItemHref="/campaigns/new"
						newItemLabel="+ New Campaign" />
				</div>
			</div>

			{#await itemsPromise}
				<div class="flex flex-col items-center justify-center py-12">
					<svg class="h-8 w-8 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke-width="4" class="opacity-25"/><path d="M4 12a8 8 0 018-8" stroke-width="4" class="opacity-75"/></svg>
					<p class="mt-3 text-gray-500 text-sm">Loading campaigns...</p>
				</div>
			{:then items}
				{@html (() => { initializedItems = items; return '' })()}

				<div class="grid gap-4">
					{#if items.length === 0}
						<!-- EmptyState -->
						<div class="rounded-lg border border-gray-200 bg-white p-8 text-center">
							<div class="text-center py-8">
								<Megaphone class="h-16 w-16 text-gray-300 mx-auto mb-4" />
								<h2 class="text-xl font-semibold text-gray-700 mb-2">No Campaigns</h2>
								<p class="text-gray-500 mb-4">Get started by creating your first campaign</p>
								<a href="/campaigns/new" class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Create Your First Campaign</a>
							</div>
						</div>
					{:else}
						{#each items as campaign (campaign.id)}
							<div class="mb-6 last:mb-0">
								<div
									class="bg-white shadow rounded-lg p-6 flex items-start gap-4 transition-shadow"
								>
									<input
										type="checkbox"
										checked={isSelected(campaign.id)}
										onchange={() => toggleSelection(campaign.id)}
										onclick={(e) => e.stopPropagation()}
										class="mt-1 w-4 h-4 text-blue-600"
									/>
									<div class="flex-1">
										<div class="flex items-start gap-3 mb-2">
											<div class="flex-1">
												<h2 class="text-xl font-semibold">
													<a 
														href={`/campaigns/${campaign.id}`} 
														class="hover:underline text-blue-600"
														onclick={(e) => e.stopPropagation()}
													>
														{campaign.name}
													</a>
												</h2>
											</div>
										</div>
										<div class="mt-2">
											<pre class="bg-gray-50 p-4 rounded text-sm overflow-auto">{JSON.stringify(
												campaign.content,
												null,
												2
											)}</pre>
										</div>
										<div class="mt-3">
											<p class="text-xs text-gray-500 mt-3">
												Created: {new Date(campaign.createdAt).toLocaleString()}
											</p>
										</div>
									</div>
									<div class="flex flex-col gap-2 shrink-0">
										<Button
											href={`/campaigns/${campaign.id}`}
											variant="default"
											size="default"
											class="text-center"
											onclick={(e: MouseEvent) => e.stopPropagation()}
										>
											Edit
										</Button>
										<AsyncButton
											variant="destructive"
											size="default"
											loading={false}
											loadingLabel="Deleting..."
											onclick={async (e: MouseEvent) => {
												e.stopPropagation();
												if (!confirm('Delete this item?')) return;
												await handleDelete(campaign.id);
											}}
										>
											Delete
										</AsyncButton>
									</div>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			{:catch error}
				<div class="text-center py-12">
					<p class="text-red-600 mb-3">{error?.message || 'Failed to load campaigns'}</p>
					<button 
						onclick={() => itemsPromise = itemsPromise}
						class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
					>
						Retry
					</button>
				</div>
			{/await}
		</div>
	</div>
</div>
