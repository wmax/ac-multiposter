<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { replaceState } from '$app/navigation';
	import { listCampaigns } from './list.remote';
	import { deleteCampaigns } from './[id]/delete.remote';
	import type { Campaign } from './list.remote';
	import { createListPage } from '$lib/hooks/useListPage.svelte';
	import ListPageLayout from '$lib/components/ui/ListPageLayout.svelte';
	import ListCard from '$lib/components/ui/ListCard.svelte';
	import { Megaphone } from '@lucide/svelte';

	let itemsPromise = $state<Promise<Campaign[]>>(listCampaigns());

	function refreshItems() {
		itemsPromise = listCampaigns();
	}

	// Use the shared list page logic
	const listPage = createListPage<Campaign>({
		fetchItems: listCampaigns,
		deleteItems: (ids) => deleteCampaigns(ids).updates(listCampaigns()),
		itemName: 'campaign',
		itemNamePlural: 'campaigns',
	});

	async function handleBulkDelete() {
		await listPage.handleBulkDelete();
		refreshItems();
	}

	async function handleDelete(id: string) {
		await listPage.handleDelete(id);
		refreshItems();
	}

	let highlightedId = $state<string | null>(null);
	let highlightTimeout: ReturnType<typeof setTimeout> | null = null;

	// Handle highlighting when focus param is present
	function handleFocusParam() {
		if (!browser) return;
		
		const focusId = $page.url.searchParams.get('focus');
		if (!focusId) return;

		// Set the highlight
		highlightedId = focusId;

		// Clear the URL param
		const currentUrl = new URL(window.location.href);
		currentUrl.searchParams.delete('focus');
		replaceState(`${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`, {
			keepFocus: true,
			noScroll: true,
		});

		// Clear any existing timeout
		if (highlightTimeout) {
			clearTimeout(highlightTimeout);
		}

		// Set new timeout to clear highlight
		highlightTimeout = setTimeout(() => {
			highlightedId = null;
			highlightTimeout = null;
		}, 4000);
	}

	// Check for focus param on mount and after navigation
	$inspect(() => {
		// This only runs when $page changes, not in a reactive loop
		handleFocusParam();
	});
</script>

	<ListPageLayout
		feature="campaigns"
		title="Campaigns"
		itemsPromise={itemsPromise}
		selection={listPage.selection}
		selectionVersion={listPage.selection.version}
		onBulkDelete={handleBulkDelete}
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
				selected={listPage.selection.isSelected(campaign.id)}
				onToggle={listPage.selection.toggleSelection}
				editHref={`/campaigns/${campaign.id}?edit=1`}
				onDelete={handleDelete}
				deleteLabel="Delete"
				highlight={campaign.id === highlightedId}
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
