<script lang="ts">
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import { createCampaign } from './create.remote';
	import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
	import CampaignForm from '$lib/components/campaigns/CampaignForm.svelte';
	import { toast } from '$lib/stores/toast.svelte';

	const createForm = createCampaign;
	let lastHandledResult: typeof createForm.result | undefined = createForm.result;
	let completedSubmissions = $state(0);
	let handledSubmission = $state(0);
	let lastPendingCount = $state(createForm.pending);
	
	// Handle form submission result
	$effect(() => {
		const pending = createForm.pending;
		if (pending === 0 && lastPendingCount > 0) {
			completedSubmissions += 1;
		}
		lastPendingCount = pending;
	});

	$effect(() => {
		const result = createForm.result;
		if (!result || result === lastHandledResult) return;
		if (completedSubmissions === 0 || handledSubmission === completedSubmissions) return;
		handledSubmission = completedSubmissions;
		lastHandledResult = result;
		
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

		<CampaignForm form={createForm} mode="create" cancelHref="/campaigns" />
	</div>
</div>
