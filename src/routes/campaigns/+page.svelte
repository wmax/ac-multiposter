<script lang="ts">
	import { listCampaigns } from './list.remote';
	import { deleteCampaigns } from './[id]/delete.remote';
	import type { Campaign } from './list.remote';
	import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
	import ListCard from '$lib/components/ui/ListCard.svelte';
	import BulkActionToolbar from '$lib/components/ui/BulkActionToolbar.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { createMultiSelect } from '$lib/hooks/multiSelect.svelte';
	import { Megaphone } from '@lucide/svelte';

	// Multi-select state
	const selection = createMultiSelect<Campaign>();

	async function handleBulkDelete() {
		if (selection.count === 0) return;
		if (!confirm(`Delete ${selection.count} campaign(s)?`)) return;

		try {
			await deleteCampaigns(selection.getSelectedArray()).updates(listCampaigns());
			selection.deselectAll();
		} catch (error) {
			alert('Failed to delete campaigns');
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<Breadcrumb feature="campaigns" />

	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">Campaigns</h1>
		{#await listCampaigns() then campaigns}
			<BulkActionToolbar
				selectedCount={selection.count}
				totalCount={campaigns.length}
				onSelectAll={() => selection.selectAll(campaigns)}
				onDeselectAll={() => selection.deselectAll()}
				onDelete={handleBulkDelete}
				newItemHref="/campaigns/new"
				newItemLabel="+ New Campaign"
			/>
		{/await}
	</div>

	<div class="grid gap-4">
		{#await listCampaigns()}
			<div class="text-center py-12 text-gray-500">Loading campaigns...</div>
		{:then campaigns}
			{#if campaigns.length === 0}
				<EmptyState
					icon={Megaphone}
					title="No Campaigns"
					description="Get started by creating your first marketing campaign"
					actionLabel="Create Your First Campaign"
					actionHref="/campaigns/new"
				/>
			{:else}
				{#each campaigns as campaign (campaign.id)}
					<ListCard
						id={campaign.id}
						href={`/campaigns/${campaign.id}`}
						selected={selection.isSelected(campaign.id)}
						onToggle={selection.toggleSelection}
						editHref={`/campaigns/${campaign.id}?edit=1`}
						onDelete={async (id) => {
							await deleteCampaigns([id]).updates(listCampaigns());
						}}
						deleteLabel="Delete"
					>
						{#snippet title()}
							<a 
								href={`/campaigns/${campaign.id}`} 
								class="hover:underline text-blue-600"
								onclick={(e) => e.stopPropagation()}
							>
								{campaign.name}
							</a>
						{/snippet}

						{#snippet content()}
							<pre class="bg-gray-50 p-4 rounded text-sm overflow-auto">{JSON.stringify(
									campaign.content,
									null,
									2
								)}</pre>
						{/snippet}

						{#snippet metadata()}
							<p class="text-xs text-gray-500 mt-3">
								Created: {new Date(campaign.createdAt).toLocaleString()}
							</p>
						{/snippet}
					</ListCard>
				{/each}
			{/if}
		{:catch error}
			<div class="text-center py-12">
				<p class="text-red-600 mb-3">{error?.message || 'Failed to load campaigns'}</p>
				<a href="/api/auth/signin" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Sign in</a>
			</div>
		{/await}
	</div>
</div>
