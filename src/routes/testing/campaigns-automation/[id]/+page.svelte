<script lang="ts">
	import { page } from '$app/stores';

	const campaignId = $derived($page.params.id ?? '');
</script>

<div class="space-y-4" data-testid="campaign-harness-detail">
	<h1 class="text-2xl font-bold">Campaign Detail: {campaignId}</h1>
	<p class="text-gray-600">This stub route exists only so automated tests can confirm navigation targets.</p>
	<a href="/testing/campaigns-automation" class="text-blue-600 underline">Back to list</a>
</div>
