<script lang="ts">
	import { listCampaigns } from './list.remote';
	import { deleteCampaigns } from './[id]/delete.remote';
	import type { Campaign } from './list.remote';
	import { createListPage } from '$lib/hooks/useListPage.svelte';
	import ListPageLayout from '$lib/components/ui/ListPageLayout.svelte';
	import ListCard from '$lib/components/ui/ListCard.svelte';
	import { Megaphone } from '@lucide/svelte';

	// Use the shared list page logic
	const listPage = createListPage<Campaign>({
		fetchItems: listCampaigns,
		deleteItems: (ids) => deleteCampaigns(ids).updates(listCampaigns()),
		itemName: 'campaign',
		itemNamePlural: 'campaigns',
	});
</script>

<ListPageLayout
	feature="campaigns"
	title="Campaigns"
	itemsPromise={listPage.itemsPromise}
	selection={listPage.selection}
	onBulkDelete={listPage.handleBulkDelete}
	newItemHref="/campaigns/new"
	newItemLabel="+ New Campaign"
	emptyIcon={Megaphone}
	emptyTitle="No Campaigns"
	emptyDescription="Get started by creating your first marketing campaign"
	emptyActionLabel="Create Your First Campaign"
	loadingMessage="Loading campaigns..."
>
	{#snippet children(campaign)}
		<ListCard
			id={campaign.id}
			href={`/campaigns/${campaign.id}`}
			selected={listPage.selection.isSelected(campaign.id)}
			onToggle={listPage.selection.toggleSelection}
			editHref={`/campaigns/${campaign.id}?edit=1`}
			onDelete={listPage.handleDelete}
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
	{/snippet}
</ListPageLayout>
