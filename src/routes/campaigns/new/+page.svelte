<script lang="ts">
	import { goto } from '$app/navigation';
	import { createCampaign } from './create.remote';
	import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
	import { createCampaignSchema } from '$lib/validations/campaign';
	import AsyncButton from '$lib/components/ui/AsyncButton.svelte';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';

</script>

<div class="container mx-auto px-4 py-8">
	<div class="max-w-2xl mx-auto">
		<Breadcrumb feature="campaigns" current="New Campaign"/>

			<div class="bg-white shadow rounded-lg p-6 pace-y-4">
				<h1 class="text-3xl font-bold mb-6">Create New Campaign</h1>

				<form 
					{...createCampaign.preflight(createCampaignSchema).enhance(async ({ submit }) => {
						try {
							await submit();
							toast.success('Successfully Saved!');
							goto('/campaigns');
						} catch (error) {
							toast.error('Oh no! Something went wrong');
						}
						})}
				>

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

				<div class="flex gap-3 mt-6">
					<AsyncButton
						type="submit"
						loadingLabel="Creating..."
						loading={createCampaign.pending}
					>
						Create Campaign
					</AsyncButton>
					<Button
						variant="secondary"
						href="/campaigns"
						size="default"
					>
						Cancel
					</Button>
				</div>
			</form>
		</div>
	</div>
</div>