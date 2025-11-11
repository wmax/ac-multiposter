<script lang="ts">
	// Import only types from server
	import type { Campaign } from './+page.server';

	// Helper to call remote functions via the server endpoint
	async function callRemoteFunction(action: string, params: any = {}): Promise<any> {
		const response = await fetch('/campaigns', {
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

	const listCampaigns = async (): Promise<Campaign[]> => {
		return await callRemoteFunction('listCampaigns');
	};

	const createCampaign = async (data: { name: string; content: Record<string, any> }): Promise<Campaign> => {
		return await callRemoteFunction('createCampaign', { data });
	};

	const updateCampaign = async (campaignId: string, data: { name?: string; content?: Record<string, any> }): Promise<Campaign> => {
		return await callRemoteFunction('updateCampaign', { campaignId, data });
	};

	const deleteCampaigns = async (campaignIds: string[]): Promise<void> => {
		return await callRemoteFunction('deleteCampaigns', { campaignIds });
	};

	// Reactive state using Svelte 5 runes
	let campaigns: Campaign[] = $state([]);
	let selectedIds: Set<string> = $state(new Set());
	let showForm = $state(false);
	let editingId: string | null = $state(null);
	let formName = $state('');
	let formContent = $state('');
	let isLoading = $state(false);
	let error: string | null = $state(null);
	let success: string | null = $state(null);

	// Initialize campaigns on mount
	async function initializeCampaigns() {
		try {
			const result = await listCampaigns();
			campaigns = result;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load campaigns';
		}
	}

	function resetForm() {
		formName = '';
		formContent = '';
		editingId = null;
		showForm = false;
	}

	async function handleSubmit() {
		const name = formName;
		const content = formContent;
		const eid = editingId;

		if (!name.trim()) {
			error = 'Campaign name is required';
			return;
		}

		try {
			JSON.parse(content || '{}');
		} catch {
			error = 'Content must be valid JSON';
			return;
		}

		isLoading = true;
		error = null;
		success = null;

		try {
			const parsedContent = content ? JSON.parse(content) : {};

			if (eid) {
				await updateCampaign(eid, {
					name: name.trim(),
					content: parsedContent
				});
				success = 'Campaign updated';
			} else {
				await createCampaign({
					name: name.trim(),
					content: parsedContent
				});
				success = 'Campaign created';
			}

			// Refresh campaigns list
			await initializeCampaigns();
			resetForm();
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			isLoading = false;
		}
	}

	async function handleDelete() {
		if (selectedIds.size === 0) return;

		isLoading = true;
		error = null;

		try {
			const idsToDelete = Array.from(selectedIds);
			await deleteCampaigns(idsToDelete);

			campaigns = campaigns.filter((camp) => !selectedIds.has(camp.id));
			selectedIds.clear();
			success = `${idsToDelete.length} campaign(s) deleted`;
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			isLoading = false;
		}
	}

	function toggleAll() {
		if (selectedIds.size === campaigns.length) {
			selectedIds.clear();
		} else {
			selectedIds = new Set(campaigns.map((c) => c.id));
		}
	}

	function editCampaign(campaign: Campaign) {
		editingId = campaign.id;
		formName = campaign.name;
		formContent = JSON.stringify(campaign.content, null, 2);
		showForm = true;
	}

	function toggleSelect(id: string) {
		if (selectedIds.has(id)) {
			selectedIds.delete(id);
		} else {
			selectedIds.add(id);
		}
		selectedIds = selectedIds;
	}
</script>

<svelte:window onload={initializeCampaigns} />

<div class="p-6 max-w-6xl mx-auto">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">Campaigns</h1>
		<button
			onclick={() => (showForm = !showForm)}
			class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
			disabled={isLoading}
		>
			{showForm ? 'Cancel' : 'New Campaign'}
		</button>
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

	{#if showForm}
		<div class="border rounded-lg p-4 mb-6 bg-gray-50">
			<h2 class="text-lg font-semibold mb-4">
				{editingId ? 'Edit Campaign' : 'Create Campaign'}
			</h2>

			<div class="space-y-4">
				<div>
					<label for="name" class="block text-sm font-medium mb-1">Campaign Name</label>
					<input
						id="name"
						type="text"
						bind:value={formName}
						placeholder="My Campaign"
						disabled={isLoading}
						class="w-full px-3 py-2 border rounded-md disabled:opacity-50"
					/>
				</div>

				<div>
					<label for="content" class="block text-sm font-medium mb-1">Content (JSON)</label>
					<textarea
						id="content"
						bind:value={formContent}
						class="w-full h-32 p-2 border rounded font-mono text-sm disabled:opacity-50"
						placeholder="Enter JSON content"
						disabled={isLoading}
					></textarea>
				</div>

				<div class="flex gap-2 justify-end">
					<button
						onclick={resetForm}
						class="px-4 py-2 border rounded-md hover:bg-gray-100 disabled:opacity-50 transition-colors"
						disabled={isLoading}
					>
						Cancel
					</button>
					<button
						onclick={handleSubmit}
						class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
						disabled={isLoading}
					>
						{isLoading ? 'Saving...' : editingId ? 'Update' : 'Create'}
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if selectedIds.size > 0}
		<div class="flex gap-2 mb-4 items-center">
			<span class="text-sm text-gray-600">{selectedIds.size} selected</span>
			<button
				onclick={handleDelete}
				class="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
				disabled={isLoading}
			>
				Delete Selected
			</button>
		</div>
	{/if}

	{#if campaigns.length === 0}
		<div class="text-center py-12">
			<p class="text-gray-500 mb-4">No campaigns yet. Create one to get started.</p>
		</div>
	{:else}
		<div class="border rounded-lg overflow-hidden">
			<table class="w-full">
				<thead>
					<tr class="border-b bg-gray-50">
						<th class="w-12 p-3 text-left">
							<input
								type="checkbox"
								checked={selectedIds.size === campaigns.length && campaigns.length > 0}
								onchange={() => toggleAll()}
								class="cursor-pointer"
							/>
						</th>
						<th class="p-3 text-left">Name</th>
						<th class="p-3 text-left">Created</th>
						<th class="p-3 text-right">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each campaigns as campaign (campaign.id)}
						<tr class="border-b hover:bg-gray-50">
							<td class="p-3">
								<input
									type="checkbox"
									checked={selectedIds.has(campaign.id)}
									onchange={() => toggleSelect(campaign.id)}
									class="cursor-pointer"
								/>
							</td>
							<td class="p-3">
								<a
									href={`/campaigns/${campaign.id}`}
									class="hover:underline font-medium text-blue-600"
								>
									{campaign.name}
								</a>
							</td>
							<td class="p-3 text-sm text-gray-500">
								{new Date(campaign.createdAt).toLocaleDateString()}
							</td>
							<td class="p-3 text-right">
								<div class="flex gap-2 justify-end">
									<button
										onclick={() => editCampaign(campaign)}
										class="px-3 py-1 text-sm border rounded-md hover:bg-gray-100 transition-colors"
									>
										Edit
									</button>
									<a href={`/campaigns/${campaign.id}`}>
										<button class="px-3 py-1 text-sm border rounded-md hover:bg-gray-100 transition-colors">
											View
										</button>
									</a>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
