<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import { getCampaign } from './view.remote';
	import { updateCampaign } from './update.remote';
	import { deleteCampaigns } from './delete.remote';
	import type { Campaign } from '../list.remote';
	import { listCampaigns } from '../list.remote';
	import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
	import { toast } from '$lib/stores/toast.svelte';

	const campaignId = $derived($page.params.id || '');
	const shouldAutoEdit = $derived($page.url.searchParams.get('edit') === '1');
	const campaignPromise = $derived(getCampaign(campaignId));

	let isEditMode = $state(false);
	let isDeleting = $state(false);
	let loadedCampaign = $state<Campaign | null>(null);
	let autoEditCampaignId = $state<string | null>(null);

	function clearEditParam() {
		if (!$page.url.searchParams.has('edit')) return;
		const cleanUrl = new URL($page.url);
		cleanUrl.searchParams.delete('edit');
		goto(`${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`, {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}

	function startEdit(campaign: Campaign) {
		// Pre-populate the form with current values
		updateCampaign.fields.set({
			id: campaign.id,
			name: campaign.name,
			content: JSON.stringify(campaign.content, null, 2)
		});
		isEditMode = true;
	}

	function cancelEdit() {
		isEditMode = false;
	}

	$effect(() => {
		const result = updateCampaign.result;
		if (!result) return;
		
		untrack(() => {
			if (result.success) {
				toast.success('Campaign updated successfully!');
				isEditMode = false;
				const updatedId = result.campaign?.id ?? result.updatedCampaign?.id;
				const target = updatedId ? `/campaigns?focus=${encodeURIComponent(updatedId)}` : '/campaigns';
				goto(target);
			} else if (result.error) {
				toast.error(`Failed to update campaign: ${result.error}`);
			}
		});
	});

	$effect(() => {
		const currentPromise = campaignPromise;
		currentPromise
			.then((campaign) => {
				if (campaignPromise !== currentPromise) return;
				loadedCampaign = campaign;
				if (!campaign) {
					autoEditCampaignId = null;
					return;
				}
				if (shouldAutoEdit && autoEditCampaignId !== campaign.id) {
					startEdit(campaign);
					autoEditCampaignId = campaign.id;
					clearEditParam();
				}
			})
			.catch(() => {
				if (campaignPromise === currentPromise) {
					loadedCampaign = null;
				}
			});
	});
	
	function handleDeleteWithConfirm(campaign: Campaign) {
		if (!confirm(`Delete campaign "${campaign.name}"?`)) {
			return false; // Cancel delete
		}
		return true; // Proceed with delete
	}
</script>

{#snippet campaignNotFoundSnippet(headline : string, text : string)}
	<div class="text-center py-12">
		<h1 class="text-2xl font-bold text-red-600 mb-4">{headline}</h1>
		<p class="text-gray-600 mb-6">{text}</p>
		<button
			onclick={() => goto('/campaigns')}
			class="inline-block px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
		>
			Back to Campaigns
		</button>
	</div>	
{/snippet}

<div class="container mx-auto px-4 py-8">
	{#await campaignPromise}
		<div class="text-center py-12">
			<div class="text-gray-600">Loading campaign...</div>
		</div>
	{:then campaign}
			{#if campaign}
				<Breadcrumb 
					feature="campaigns"
					current={campaign.name}
				/>
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
								<form
									method="POST"
									use:enhance={() => {
										if (!handleDeleteWithConfirm(campaign)) {
											return () => {}; // Cancel delete by returning empty function
										}
										isDeleting = true;
										return async ({ result }) => {
											if (result.type === 'success') {
												await deleteCampaigns([campaign.id]).updates(listCampaigns());
												toast.success('Campaign deleted successfully!');
												await goto('/campaigns');
											} else {
												toast.error('Failed to delete campaign');
												isDeleting = false;
											}
										};
									}}
								>
									<button
										type="submit"
										disabled={isDeleting}
										class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{isDeleting ? 'Deleting...' : 'Delete'}
									</button>
								</form>
							{/if}
						</div>
					</div>

					{#if isEditMode}
						<div class="bg-white shadow rounded-lg p-6">
							<h2 class="text-xl font-semibold mb-4">Edit Campaign</h2>
							<form {...updateCampaign} class="space-y-4">
								<!-- Hidden id field required by schema -->
								<input {...updateCampaign.fields.id.as('text')} type="hidden" />
								
								<div>
									<label for="edit-name" class="block text-sm font-medium text-gray-700 mb-2">
										Campaign Name
									</label>
									<input
										{...updateCampaign.fields.name.as('text')}
										class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>

								<div>
									<label for="edit-content" class="block text-sm font-medium text-gray-700 mb-2">
										Content (JSON)
									</label>
									<textarea
										{...updateCampaign.fields.content.as('text')}
										rows="12"
										class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
									></textarea>
								</div>

								<div class="flex gap-3">
									<button
										type="submit"
										disabled={updateCampaign.pending > 0}
										class="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{updateCampaign.pending > 0 ? 'Saving...' : 'Save Changes'}
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
				<Breadcrumb feature="campaigns" />
				{@render campaignNotFoundSnippet("Campaign Not Found", "The campaign you&apos;re looking for doesn&apos;t exist.")}
		{/if}
	{:catch error}
		<Breadcrumb feature="campaigns" />
		{@render campaignNotFoundSnippet("Error", error instanceof Error ? error.message : 'Failed to load campaign')}
	{/await}
</div>
