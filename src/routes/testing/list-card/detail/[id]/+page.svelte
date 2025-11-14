<script lang="ts">
	import { page } from '$app/stores';

	const cardId = $derived($page.params.id ?? '');
</script>

<div class="container mx-auto px-4 py-12" data-testid="detail-view">
	<h1 class="text-2xl font-bold mb-4">Viewing detail for {cardId}</h1>
	<p class="text-gray-600">This route exists solely for verifying ListCard navigation in tests.</p>
	<a href="/testing/list-card" class="text-blue-600 underline mt-4 inline-block">Back to list</a>
</div>
