<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Campaign } from './+page.server';

	interface PageData {
		params: { id: string };
	}

	let { data } = $props<{ data: PageData }>();

	// Helper to call remote functions via the server endpoint
	async function callRemoteFunction(action: string, params: any = {}): Promise<any> {
		const response = await fetch(`/campaigns/${data.params.id}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action, ...params })
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || `Failed: ${response.status}`);
		}

		return response.json();
	}

	const getCampaignDetail = async (id: string): Promise<Campaign> => {
		return await callRemoteFunction('getCampaignDetail', { campaignId: id });
	};

	const updateCampaignDetail = async (id: string, updates: { name?: string; content?: Record<string, any> }): Promise<Campaign> => {
		return await callRemoteFunction('updateCampaignDetail', { campaignId: id, data: updates });
	};

	const deleteCampaignDetail = async (id: string): Promise<void> => {
		return await callRemoteFunction('deleteCampaignDetail', { campaignId: id });
	};

	// Reactive state
	let campaign: Campaign | null = $state(null);
	let editName = $state('');
	let editContent = $state('');
	let isLoading = $state(true);
	let isSaving = $state(false);
	let isDeleting = $state(false);
	let error: string | null = $state(null);
	let success: string | null = $state(null);
	let isEditMode = $state(false);

	// Load campaign on mount
	async function loadCampaign() {
		try {
			isLoading = true;
			error = null;
			const result = await getCampaignDetail(data.params.id);
			campaign = result;
			editName = result.name;
			editContent = JSON.stringify(result.content, null, 2);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load campaign';
		} finally {
			isLoading = false;
		}
	}

	async function handleSave() {
		if (!campaign) return;

		const name = editName.trim();
		if (!name) {
			error = 'Campaign name is required';
			return;
		}

		try {
			JSON.parse(editContent || '{}');
		} catch {
			error = 'Content must be valid JSON';
			return;
		}

		isSaving = true;
		error = null;
		success = null;

		try {
			const parsedContent = editContent ? JSON.parse(editContent) : {};
			const updated = await updateCampaignDetail(campaign.id, {
				name,
				content: parsedContent
			});
			campaign = updated;
			editName = updated.name;
			editContent = JSON.stringify(updated.content, null, 2);
			isEditMode = false;
			success = 'Campaign updated successfully';
			
			// Clear success message after 3 seconds
			setTimeout(() => {
				success = null;
			}, 3000);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to update campaign';
		} finally {
			isSaving = false;
		}
	}

	async function handleDelete() {
		if (!campaign || !confirm('Are you sure you want to delete this campaign?')) return;

		isDeleting = true;
		error = null;

		try {
			await deleteCampaignDetail(campaign.id);
			await goto('/campaigns');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete campaign';
			isDeleting = false;
		}
	}

	function handleCancel() {
		if (campaign) {
			editName = campaign.name;
			editContent = JSON.stringify(campaign.content, null, 2);
		}
		isEditMode = false;
	}
</script>

<svelte:window onload={loadCampaign} />

<div class="p-6 max-w-4xl mx-auto">
	<!-- Breadcrumb Navigation -->
	<nav class="mb-4 text-sm">
		<ol class="flex items-center space-x-2 text-gray-600">
			<li>
				<a href="/" class="hover:text-blue-600 hover:underline">Home</a>
			</li>
			<li>
				<span class="text-gray-400">/</span>
			</li>
			<li>
				<a href="/campaigns" class="hover:text-blue-600 hover:underline">Campaigns</a>
			</li>
			<li>
				<span class="text-gray-400">/</span>
			</li>
			<li class="text-gray-900 font-medium truncate max-w-xs">
				{campaign?.name || 'Loading...'}
			</li>
		</ol>
	</nav>

	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-3xl font-bold">
				{campaign?.name || 'Loading...'}
			</h1>
		</div>
		{#if campaign && !isLoading}
			<button
				onclick={() => (isEditMode = !isEditMode)}
				class="px-4 py-2 border rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
				disabled={isSaving || isDeleting}
			>
				{isEditMode ? 'Cancel' : 'Edit'}
			</button>
		{/if}
	</div>

	{#if success}
		<div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
			<p class="text-green-800">{success}</p>
		</div>
	{/if}

	{#if error}
		<div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
			<p class="text-red-800">{error}</p>
		</div>
	{/if}

	{#if isLoading}
		<div class="text-center py-12">
			<p class="text-gray-500">Loading campaign...</p>
		</div>
	{:else if campaign}
		{#if isEditMode}
			<!-- Edit Mode -->
			<div class="border rounded-lg p-6 bg-gray-50">
				<h2 class="text-lg font-semibold mb-4">Edit Campaign</h2>

				<div class="space-y-4">
					<div>
						<label for="name" class="block text-sm font-medium mb-1">Campaign Name</label>
						<input
							id="name"
							type="text"
							bind:value={editName}
							placeholder="Campaign name"
							disabled={isSaving}
							class="w-full px-3 py-2 border rounded-md disabled:opacity-50"
						/>
					</div>

					<div>
						<label for="content" class="block text-sm font-medium mb-1">Content (JSON)</label>
						<textarea
							id="content"
							bind:value={editContent}
							class="w-full h-96 p-3 border rounded-md font-mono text-sm disabled:opacity-50"
							placeholder="Enter JSON content"
							disabled={isSaving}
						></textarea>
					</div>

					<div class="flex gap-2 justify-end">
						<button
							onclick={handleCancel}
							class="px-4 py-2 border rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
							disabled={isSaving}
						>
							Cancel
						</button>
						<button
							onclick={handleSave}
							class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
							disabled={isSaving}
						>
							{isSaving ? 'Saving...' : 'Save Changes'}
						</button>
					</div>
				</div>
			</div>
		{:else}
			<!-- View Mode -->
			<div class="space-y-6">
				<div class="border rounded-lg p-6">
					<div class="grid grid-cols-2 gap-4 mb-4">
						<div>
							<p class="text-sm text-gray-600">Campaign ID</p>
							<p class="font-mono text-sm">{campaign.id}</p>
						</div>
						<div>
							<p class="text-sm text-gray-600">Created</p>
							<p>{new Date(campaign.createdAt).toLocaleString()}</p>
						</div>
						<div>
							<p class="text-sm text-gray-600">Last Updated</p>
							<p>{new Date(campaign.updatedAt).toLocaleString()}</p>
						</div>
					</div>
				</div>

				<div class="border rounded-lg p-6">
					<h2 class="text-lg font-semibold mb-4">Campaign Content</h2>
					<pre class="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-96"><code>{JSON.stringify(campaign.content, null, 2)}</code></pre>
				</div>

				<div class="flex gap-2">
					<button
						onclick={() => (isEditMode = true)}
						class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
						disabled={isDeleting}
					>
						Edit Campaign
					</button>
					<button
						onclick={handleDelete}
						class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
						disabled={isDeleting}
					>
						{isDeleting ? 'Deleting...' : 'Delete Campaign'}
					</button>
				</div>
			</div>
		{/if}
	{/if}
</div>
