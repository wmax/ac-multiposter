<script lang="ts">
	import { listCampaigns, createCampaign, updateCampaign, deleteCampaigns } from './campaigns.remote';
	import type { Campaign } from './campaigns.remote';

	// Form state
	let showCreateForm = $state(false);
	let editingCampaign: Campaign | null = $state(null);
	let editName = $state('');
	let editContent = $state('{}');
	let selectedIds: Set<string> = $state(new Set());

	// Create form reference  
	const createForm = createCampaign;

	function openEditForm(campaign: Campaign) {
		editingCampaign = campaign;
		editName = campaign.name;
		editContent = JSON.stringify(campaign.content, null, 2);
	}

	function closeEditForm() {
		editingCampaign = null;
	}

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

	async function handleUpdate() {
		if (!editingCampaign) return;
		
		try {
			const content = JSON.parse(editContent);
			await updateCampaign({ id: editingCampaign.id, name: editName, content }).updates(
				listCampaigns()
			);
			closeEditForm();
		} catch (error) {
			alert('Failed to update campaign');
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
			<button
				onclick={() => (showCreateForm = true)}
				class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
			>
				+ New Campaign
			</button>
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
					<button
						onclick={() => openEditForm(campaign)}
						class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
					>
						Edit
					</button>
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
				<button
					onclick={() => (showCreateForm = true)}
					class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
				>
					Create your first campaign
				</button>
			</div>
		{/each}
	</div>
</div>

<!-- Create Form Modal -->
{#if showCreateForm}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
		<div class="bg-white rounded-lg p-6 max-w-2xl w-full">
			<h2 class="text-2xl font-bold mb-4">Create Campaign</h2>
			<form {...createForm} onsubmit={() => {showCreateForm = false}}>
				<div class="space-y-4">
					<div>
						<label for="create-name" class="block text-sm font-medium text-gray-700 mb-1"
							>Name</label
						>
						<input
							id="create-name"
							{...createForm.fields.name.as('text')}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					<div>
						<label for="create-content" class="block text-sm font-medium text-gray-700 mb-1"
							>Content (JSON)</label
						>
						<textarea
							id="create-content"
							name="content"
							rows="10"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
						></textarea>
					</div>
					<div class="flex gap-2 justify-end">
						<button
							onclick={() => (showCreateForm = false)}
							type="button"
							class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
						>
							Cancel
						</button>
						<button
							type="submit"
							class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
						>
							Create
						</button>
					</div>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Edit Form Modal -->
{#if editingCampaign}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
		<div class="bg-white rounded-lg p-6 max-w-2xl w-full">
			<h2 class="text-2xl font-bold mb-4">Edit Campaign</h2>
			<form onsubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
				<div class="space-y-4">
					<div>
						<label for="edit-name" class="block text-sm font-medium text-gray-700 mb-1"
							>Name</label
						>
						<input
							id="edit-name"
							bind:value={editName}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					<div>
						<label for="edit-content" class="block text-sm font-medium text-gray-700 mb-1"
							>Content (JSON)</label
						>
						<textarea
							id="edit-content"
							bind:value={editContent}
							rows="10"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
						></textarea>
					</div>
					<div class="flex gap-2 justify-end">
						<button
							onclick={closeEditForm}
							type="button"
							class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
						>
							Cancel
						</button>
						<button type="submit" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
							Save
						</button>
					</div>
				</div>
			</form>
		</div>
	</div>
{/if}
