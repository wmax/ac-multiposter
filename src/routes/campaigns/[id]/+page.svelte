<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getCampaign } from './view.remote';
	import { updateCampaign } from './update.remote';
	import { deleteCampaigns } from './delete.remote';
	import type { Campaign } from '../list.remote';
	import { listCampaigns } from '../list.remote';

	const campaignId = $derived($page.params.id || '');

	let isEditMode = $state(false);
	let editName = $state('');
	let editContent = $state('{}');
	let campaignData = $state<Campaign | null>(null);

	// Load campaign data
	$effect(() => {
		getCampaign(campaignId).then(data => {
			campaignData = data;
			// If entering edit mode via query param, populate fields
			if ($page.url.searchParams.get('edit') === '1' && data) {
				isEditMode = true;
				editName = data.name;
				editContent = JSON.stringify(data.content, null, 2);
			}
		});
	});

	function startEdit(campaign: Campaign) {
		isEditMode = true;
		editName = campaign.name;
		editContent = JSON.stringify(campaign.content, null, 2);
	}

	function cancelEdit() {
		isEditMode = false;
	}

	async function handleUpdate(campaign: Campaign) {
		try {
			const content = JSON.parse(editContent);
			await updateCampaign({ id: campaign.id, name: editName, content }).updates(
				getCampaign(campaign.id),
				listCampaigns()
			);
			isEditMode = false;
		} catch (error) {
			alert('Failed to update campaign: ' + (error instanceof Error ? error.message : 'Unknown error'));
		}
	}

	async function handleDelete(campaign: Campaign) {
		if (!confirm(`Delete campaign "${campaign.name}"?`)) return;

		try {
			await deleteCampaigns([campaign.id]).updates(listCampaigns());
			await goto('/campaigns');
		} catch (error) {
			alert('Failed to delete campaign');
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<!-- Breadcrumb Navigation -->
	<nav class="mb-4 text-sm">
		<ol class="flex items-center space-x-2 text-gray-600">
			<li>
				<button onclick={() => goto('/')} class="hover:text-blue-600 hover:underline">Home</button>
			</li>
			<li>
				<span class="text-gray-400">/</span>
			</li>
			<li>
				<button onclick={() => goto('/campaigns')} class="hover:text-blue-600 hover:underline">Campaigns</button>
			</li>
			<li>
				<span class="text-gray-400">/</span>
			</li>
			{#await getCampaign(campaignId) then campaign}
				{#if campaign}
					<li class="text-gray-900 font-medium truncate max-w-xs">
						{campaign.name}
					</li>
				{:else}
					<li class="text-gray-900 font-medium">Not Found</li>
				{/if}
			{/await}
		</ol>
	</nav>

	{#await getCampaign(campaignId)}
		<div class="text-center py-12">
			<div class="text-gray-600">Loading campaign...</div>
		</div>
	{:then campaign}
		{#if campaign}
			<div class="max-w-4xl">
				<div class="flex justify-between items-start mb-6">
					<div>
						<h1 class="text-3xl font-bold mb-2">{campaign.name}</h1>
						<p class="text-sm text-gray-500">
							Created: {new Date(campaign.createdAt).toLocaleString()}
							{#if campaign.updatedAt !== campaign.createdAt}
								• Updated: {new Date(campaign.updatedAt).toLocaleString()}
							{/if}
						</p>
					</div>
					<div class="flex gap-2">
						{#if !isEditMode}
							<button
								onclick={() => startEdit(campaign)}
								class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
							>
								Edit
							</button>
							<button
								onclick={() => handleDelete(campaign)}
								class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
							>
								Delete
							</button>
						{/if}
					</div>
				</div>

				{#if isEditMode}
					<div class="bg-white shadow rounded-lg p-6">
						<h2 class="text-xl font-semibold mb-4">Edit Campaign</h2>
						<form onsubmit={(e) => { e.preventDefault(); handleUpdate(campaign); }} class="space-y-4">
							<div>
								<label for="edit-name" class="block text-sm font-medium text-gray-700 mb-2">
									Campaign Name
								</label>
								<input
									id="edit-name"
									bind:value={editName}
									class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>

							<div>
								<label for="edit-content" class="block text-sm font-medium text-gray-700 mb-2">
									Content (JSON)
								</label>
								<textarea
									id="edit-content"
									bind:value={editContent}
									rows="12"
									class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
								></textarea>
							</div>

							<div class="flex gap-3">
								<button
									type="submit"
									class="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
								>
									Save Changes
								</button>
								<button
									type="button"
									onclick={cancelEdit}
									class="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
								>
									Cancel
								</button>
							</div>
						</form>
					</div>
				{:else}
					<div class="bg-white shadow rounded-lg p-6">
						<h2 class="text-xl font-semibold mb-4">Content</h2>
						<pre class="bg-gray-50 p-4 rounded text-sm overflow-auto">{JSON.stringify(
								campaign.content,
								null,
								2
							)}</pre>
					</div>
				{/if}
			</div>
		{:else}
			<div class="text-center py-12">
				<h1 class="text-2xl font-bold text-gray-900 mb-4">Campaign Not Found</h1>
				<p class="text-gray-600 mb-6">The campaign you're looking for doesn't exist.</p>
				<button
					onclick={() => goto('/campaigns')}
					class="inline-block px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
				>
					Back to Campaigns
				</button>
			</div>
		{/if}
	{:catch error}
		<div class="text-center py-12">
			<h1 class="text-2xl font-bold text-red-600 mb-4">Error</h1>
			<p class="text-gray-600 mb-6">{error instanceof Error ? error.message : 'Failed to load campaign'}</p>
			<button
				onclick={() => goto('/campaigns')}
				class="inline-block px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
			>
				Back to Campaigns
			</button>
		</div>
	{/await}
</div>
