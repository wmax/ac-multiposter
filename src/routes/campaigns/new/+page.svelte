<script lang="ts">
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import { createCampaign } from './create.remote';
	import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
	import { toast } from '$lib/stores/toast.svelte';

	const createForm = createCampaign;
	
	// Handle form submission result
	$effect(() => {
		const result = createForm.result;
		if (!result) return;
		
		untrack(() => {
			if (result.success) {
				toast.success('Campaign created successfully!');
				const campaignId = result.campaign?.id;
				const target = campaignId ? `/campaigns?focus=${encodeURIComponent(campaignId)}` : '/campaigns';
				goto(target);
			} else if (result.error) {
				toast.error(`Failed to create campaign: ${result.error}`);
			}
		});
	});
</script>

<div class="container mx-auto px-4 py-8">
	<Breadcrumb 
		feature="campaigns"
		current="New Campaign"
	/>

	<div class="max-w-2xl">
		<h1 class="text-3xl font-bold mb-6">Create New Campaign</h1>

		<form {...createForm} class="space-y-6">
			<div>
				<label for="name" class="block text-sm font-medium text-gray-700 mb-2">
					Campaign Name
				</label>
				<input
					{...createForm.fields.name.as('text')}
					class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					placeholder="Enter campaign name"
				/>
			</div>

			<div>
				<label for="content" class="block text-sm font-medium text-gray-700 mb-2">
					Content (JSON)
				</label>
				<textarea
					{...createForm.fields.content.as('text')}
					rows="12"
					class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
					placeholder="{'{}'}"
				></textarea>
				<p class="mt-1 text-sm text-gray-500">Enter campaign content as JSON</p>
			</div>

			<div class="flex gap-3">
				<button
					type="submit"
					disabled={createForm.pending > 0}
					class="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{createForm.pending > 0 ? 'Creating...' : 'Create Campaign'}
				</button>
				<a
					href="/campaigns"
					class="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
				>
					Cancel
				</a>
			</div>
		</form>
	</div>
</div>
