<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { getCampaign } from './view.remote';
	import { updateCampaign } from './update.remote';
	import { deleteCampaigns } from './delete.remote';
	import type { Campaign } from '../list.remote';
	import type { Attachment } from 'svelte/attachments';
	import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
	import AsyncButton from '$lib/components/ui/AsyncButton.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { updateCampaignSchema } from '$lib/validations/campaign';
    import { Button } from '$lib/components/ui/button';
    import { LoaderCircle } from '@lucide/svelte';
    import { campaign } from '$lib/server/db/schema';
    import { capitalizeFirstLetter } from 'better-auth';

	const campaignId = $derived(page.params.id || '');

	const campaignPromise = $derived(getCampaign(campaignId));

	function handleDeleteWithConfirm(campaign: Campaign) {
		if (!confirm(`Delete campaign "${campaign.name}"?`)) {
			return false;
		}
		return true;
	}

	
	$effect(() => {
			campaignPromise.then((campaign) => {
			if (campaign) {
				updateCampaign.fields.id.set(campaign.id);
				updateCampaign.fields.name.set(campaign.name);
				updateCampaign.fields.content.set(JSON.stringify(campaign.content, null, 2));
			}
	});
	});
</script>

{#snippet campaignNotFoundSnippet(headline : string, text : string)}
	<div class="text-center py-12">
		<h1 class="text-2xl font-bold text-red-600 mb-4">{headline}</h1>
		<p class="text-gray-600 mb-6">{text}</p>
		<button
			class="inline-block px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
		>
			<a href="/campaigns">Back to Campaigns</a>
		</button>
	</div>	
{/snippet}

<div class="container mx-auto px-4 py-8">
	{#await campaignPromise}
		<div class="text-center py-12">
			<div class="text-gray-600">
				<LoaderCircle class="animate-spin mx-auto mb-4" size="48" />
				Loading campaign...
			</div>
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
						<AsyncButton
								type="submit"
								label="Delete"
								loadingLabel="Deleting..."
								loading={deleteCampaigns.pending}	
								variant="destructive"
								onclick={async () => {
									try {
										await deleteCampaigns([campaign.id]);
										toast.success('Campaign deleted successfully!');
										await goto('/campaigns');
									} catch (error) {
										toast.error('Failed to delete campaign');
									}
								}}
							/>
						</div>
					</div>

					<div class="bg-white shadow rounded-lg p-6">
						<h2 class="text-xl font-semibold mb-4">Edit Campaign</h2>
						<form {...updateCampaign
									.preflight(updateCampaignSchema)
									.enhance(async ({ form, data, submit }) => {
										try {
											await submit();
											toast.success('Successfully saved!');
											goto('/campaigns');
										} catch (error) {
											toast.error('Oh no! Something went wrong');
										}
									})
								}>

							<input {...updateCampaign.fields.name.as('hidden', campaign.id)} />
							<label class="block text-sm font-medium text-gray-700 mb-2">
								<span>Campaign Name</span>
								<input
									{...updateCampaign.fields.name.as('text',)}
									class="mt-2 w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 {(updateCampaign.fields.name.issues()?.length ?? 0) > 0 ? 'border-red-500' : 'border-gray-300'}"
									placeholder="Enter campaign name"
									value={updateCampaign.fields.name.value() ?? campaign.name}
									onblur={() => updateCampaign.validate()}
								/>
								{#each updateCampaign.fields.name.issues() ?? [] as issue}
									<p class="mt-1 text-sm text-red-600">{issue.message}</p>
								{/each}
							</label>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								<span>Content (JSON)</span>
								<textarea
									{...updateCampaign.fields.content.as('text')}
									rows="12"
									class="mt-2 w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm {(updateCampaign.fields.content.issues()?.length ?? 0) > 0 ? 'border-red-500' : 'border-gray-300'}"
									placeholder="{'{}'}"
									value={updateCampaign.fields.content.value() ?? JSON.stringify(campaign.content, null, 2)}
									onblur={() => updateCampaign.validate()}
								></textarea>
								{#each updateCampaign.fields.content.issues() ?? [] as issue}
									<p class="mt-1 text-sm text-red-600">{issue.message}</p>
								{/each}
								<p class="mt-1 text-sm text-gray-500">Enter campaign content as JSON</p>
							</label>
							<div class="flex gap-2 mt-4">
								<AsyncButton
									type="submit"
									label="Save Changes"
									loadingLabel="Saving..."
									loading={updateCampaign.pending}
								/>
								<Button
									variant="secondary"
									href="/campaigns"
								>
									Cancel
								</Button>
							</div>
						</form>
					</div>
				</div>
			{:else}
				<Breadcrumb feature="campaigns" />
				{@render campaignNotFoundSnippet("Campaign Not Found", "The campaign you are looking for does not exist.")}
		{/if}
	{:catch error}
		<Breadcrumb feature="campaigns" />
		{@render campaignNotFoundSnippet("Error", error instanceof Error ? error.message : 'Failed to load campaign')}
	{/await}
</div>
