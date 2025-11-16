<script lang="ts">
	import { goto } from '$app/navigation';
	import { createCampaign } from './create.remote';
	import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
	import { createCampaignSchema } from '$lib/validations/campaign';
	import AsyncButton from '$lib/components/ui/AsyncButton.svelte';
	import { toast } from 'svelte-sonner';
    import { SingleStoreDateString } from 'drizzle-orm/singlestore-core';

</script>

<div class="container mx-auto px-4 py-8">
	<Breadcrumb 
		feature="campaigns"
		current="New Campaign"
	/>

	<div class="max-w-2xl">
		<h1 class="text-3xl font-bold mb-6">Create New Campaign</h1>

		<form 
			{...createCampaign.preflight(createCampaignSchema).enhance(async ({ form, data, submit }) => {
				try {
					await submit();
					toast.success('Successfully published!');
					goto('/campaigns');
				} catch (error) {
					toast.error('Oh no! Something went wrong');
				}
				})}
			class="bg-white shadow rounded-lg p-6 space-y-6"
		>
			<div class="space-y-4">
				<label class="block">
					<span class="text-sm font-medium text-gray-700 mb-2">Campaign Name</span>
					<input
						{...createCampaign.fields.name.as('text')}
						class="mt-2 w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 {(createCampaign.fields.name.issues()?.length ?? 0) > 0
							? 'border-red-500'
							: 'border-gray-300'}"
						placeholder="Enter campaign name"
						onblur={() => createCampaign.validate()}
					/>
					{#each createCampaign.fields.name.issues() ?? [] as issue}
						<p class="mt-1 text-sm text-red-600">{issue.message}</p>
					{/each}
				</label>

				<label class="block">
					<span class="text-sm font-medium text-gray-700 mb-2">Content (JSON)</span>
					<textarea
						{...createCampaign.fields.content.as('text')}
						rows="12"
						class="mt-2 w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm {(createCampaign.fields.content.issues()?.length ?? 0) > 0
							? 'border-red-500'
							: 'border-gray-300'}"
						placeholder="{'{}'}"
						onblur={() => createCampaign.validate()}
					></textarea>
					{#each createCampaign.fields.content.issues() ?? [] as issue}
						<p class="mt-1 text-sm text-red-600">{issue.message}</p>
					{/each}
					<p class="mt-1 text-sm text-gray-500">Enter campaign content as JSON</p>
				</label>
			</div>

			<div class="flex gap-3 mt-6">
				<AsyncButton
					type="submit"
					label="Create Campaign"
					loadingLabel="Creating..."
					loading={createCampaign.pending}
					class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
				/>
				
				<a
					href="/campaigns"
					class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					Cancel
				</a>
			</div>
		</form>
	</div>
</div>