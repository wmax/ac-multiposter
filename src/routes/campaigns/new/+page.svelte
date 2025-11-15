<script lang="ts">
	import { goto } from '$app/navigation';
	import { createCampaign } from './create.remote';
	import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
	import CampaignForm from '$lib/components/campaigns/CampaignForm.svelte';
	import { toast } from '$lib/stores/toast.svelte';
</script>

<div class="container mx-auto px-4 py-8">
	<Breadcrumb 
		feature="campaigns"
		current="New Campaign"
	/>

	<div class="max-w-2xl">
		<h1 class="text-3xl font-bold mb-6">Create New Campaign</h1>

		<CampaignForm 
			form={createCampaign}
			mode="create" 
			cancelHref="/campaigns"
			onFormSuccess={() => {
				toast.success('Campaign created successfully!');
				goto('/campaigns');
			}}
			onFormError={() => {
				toast.error('Failed to create campaign');
			}}
		/>
	</div>
</div>
