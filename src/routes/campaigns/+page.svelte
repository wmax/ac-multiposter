<script lang="ts">
	import { listCampaigns } from './list.remote';
	import { deleteCampaigns } from './[id]/delete.remote';
	import type { Campaign } from './list.remote';

	// Form state
	let selectedIds: Set<string> = $state(new Set());

	async function handleDelete() {
		if (selectedIds.size === 0) return;
		if (!confirm(`Delete ${selectedIds.size} campaign(s)?`)) return;

		try {
			await deleteCampaigns(Array.from(selectedIds)).updates(listCampaigns());
			selectedIds = new Set(); // Clear and trigger reactivity
		} catch (error) {
			alert('Failed to delete campaigns');
		}
	}

	function toggleSelection(id: string) {
		if (selectedIds.has(id)) {
			selectedIds = new Set([...selectedIds].filter(sid => sid !== id));
		} else {
			selectedIds = new Set([...selectedIds, id]);
		}
	}

	async function toggleSelectAll() {
		const campaigns = await listCampaigns();
		if (selectedIds.size === campaigns.length) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(campaigns.map((c) => c.id));
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<!-- Breadcrumb Navigation -->
	<nav class="mb-4 text-sm">
		<ol class="flex items-center space-x-2 text-gray-600">
			<li>
				<a href="/" class="hover:text-blue-600 hover:underline">Home</a>
			</li>
			<li>
				<span class="text-gray-400">/</span>
			</li>
			<li class="text-gray-900 font-medium">Campaigns</li>
		</ol>
	</nav>

	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">Campaigns</h1>
		<div class="flex gap-2">
			{#if selectedIds.size > 0}
				<button
					onclick={toggleSelectAll}
					class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
				>
					{#await listCampaigns() then campaigns}
						{selectedIds.size === campaigns.length ? 'Deselect All' : 'Select All'}
					{/await}
				</button>
				<button
					onclick={handleDelete}
					class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
				>
					Delete Selected ({selectedIds.size})
				</button>
			{/if}
			<a
				href="/campaigns/new"
				class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
			>
				+ New Campaign
			</a>
		</div>
	</div>

	<div class="grid gap-4">
		{#each await listCampaigns() as campaign (campaign.id)}
			<div class="bg-white shadow rounded-lg p-6 flex items-start gap-4">
				<input
					type="checkbox"
					checked={selectedIds.has(campaign.id)}
					onchange={() => toggleSelection(campaign.id)}
					class="mt-1 w-4 h-4 text-blue-600"
				/>
				<div class="flex-1">
					<h2 class="text-xl font-semibold mb-2">{campaign.name}</h2>
					<pre class="bg-gray-50 p-4 rounded text-sm overflow-auto">{JSON.stringify(
							campaign.content,
							null,
							2
						)}</pre>
					<p class="text-sm text-gray-500 mt-2">
						Created: {new Date(campaign.createdAt).toLocaleString()}
					</p>
				</div>
				<div class="flex flex-col gap-2">
					<a
						href="/campaigns/{campaign.id}"
						class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-center"
					>
						View
					</a>
					<button
						onclick={async () => {
							if (confirm(`Delete campaign "${campaign.name}"?`)) {
								try {
									await deleteCampaigns([campaign.id]).updates(listCampaigns());
								} catch (error) {
									alert('Failed to delete campaign');
								}
							}
						}}
						class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
					>
						Delete
					</button>
				</div>
			</div>
		{:else}
			<div class="text-center py-12 text-gray-500">
				<p class="text-lg mb-4">No campaigns yet</p>
				<a
					href="/campaigns/new"
					class="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
				>
					Create your first campaign
				</a>
			</div>
		{/each}
	</div>
</div>
