<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getCampaign } from './view.remote';
	import { updateCampaign } from './update.remote';
	import { deleteCampaigns } from './delete.remote';
	import type { Campaign } from '../list.remote';
	import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
	import AsyncButton from '$lib/components/ui/AsyncButton.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { updateCampaignSchema } from '$lib/validations/campaign';
	import { Button } from '$lib/components/ui/button';

	function handleDeleteWithConfirm(campaign: Campaign) {
		if (!confirm(`Delete campaign "${campaign.name}"?`)) {
			return false;
		}
		return true;
	}
</script>
<div class="container mx-auto px-4 py-8">
	{#await getCampaign(page.params.id || '')}
		<div class="text-center py-12">
			<div class="text-gray-600">
				Loading campaign...
			</div>
		</div>
	{:then campaign}
		{#if campaign}
			<Breadcrumb 
				feature="campaigns"
				current={campaign.name}
			/>
			<div class="max-w-2xl mx-auto">
				<div class="bg-white shadow rounded-lg p-6">
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
								type="button"
								loadingLabel="Deleting..."
								loading={deleteCampaigns.pending}
								variant="destructive"
								onclick={() => {
									if (handleDeleteWithConfirm(campaign)) {
										(async () => {
											try {
												await deleteCampaigns([campaign.id]);
												toast.success('Campaign deleted successfully!');
												await goto('/campaigns');
											} catch (error) {
												toast.error('Failed to delete campaign');
											}
										})();
									}
								}}
							>
								Delete
							</AsyncButton>
						</div>
					</div>
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
							}
						class="space-y-6"
					>
						<input {...updateCampaign.fields.name.as('hidden', campaign.id)} />
						<div class="space-y-4">
							<label class="block">
								<span class="text-sm font-medium text-gray-700 mb-2">Campaign Name</span>
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
							<label class="block">
								<span class="text-sm font-medium text-gray-700 mb-2">Content (JSON)</span>
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
						</div>
						<div class="flex gap-3 mt-6">
							<AsyncButton
								type="submit"
								loadingLabel="Saving..."
								loading={updateCampaign.pending}
							>
								Save Changes
							</AsyncButton>
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
			<div class="text-center py-12">
				<h1 class="text-2xl font-bold text-red-600 mb-4">Campaign Not Found</h1>
				<p class="text-gray-600 mb-6">The campaign you are looking for does not exist.</p>
				<a href="/campaigns" class="inline-block px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Back to Campaigns</a>
			</div>
		{/if}
	{:catch error}
		<Breadcrumb feature="campaigns" />
		<div class="text-center py-12">
			<h1 class="text-2xl font-bold text-red-600 mb-4">Error</h1>
			<p class="text-gray-600 mb-6">{error instanceof Error ? error.message : 'Failed to load campaign'}</p>
			<a href="/campaigns" class="inline-block px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Back to Campaigns</a>
		</div>
	{/await}
</div>
