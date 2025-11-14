<script lang="ts">
	import ListCard from '$lib/components/ui/ListCard.svelte';
	import { createMultiSelect } from '$lib/hooks/multiSelect.svelte';

	type DemoItem = {
		id: string;
		title: string;
		description: string;
		status: string;
	};

	const demoItems: DemoItem[] = [
		{ id: 'demo-1', title: 'Campaign Alpha', description: 'Top-performing campaign variant.', status: 'active' },
		{ id: 'demo-2', title: 'Campaign Beta', description: 'SEO focus with long-tail keywords.', status: 'paused' },
		{ id: 'demo-3', title: 'Campaign Gamma', description: 'Experimental copy for social ads.', status: 'draft' }
	];

	const selection = createMultiSelect<DemoItem>();
	let actionClicks = $state(0);
	let lastActionId = $state<string | null>(null);

	function handleQuickAction(event: MouseEvent, id: string) {
		event.stopPropagation();
		actionClicks = actionClicks + 1;
		lastActionId = id;
		const button = event.currentTarget instanceof HTMLButtonElement ? event.currentTarget : null;
		if (button) {
			const nextCount = Number(button.dataset.clickCount ?? '0') + 1;
			button.dataset.clickCount = String(nextCount);
		}
	}
</script>

<div class="container mx-auto px-4 py-8" data-testid="list-card-demo">
	<h1 class="text-2xl font-bold mb-2">ListCard Interaction Demo</h1>
	<p class="text-gray-600 mb-6">
		Interact with the checkboxes or action buttons to ensure the cards do not navigate unexpectedly.
	</p>
	<p class="text-sm text-gray-500" data-testid="action-count">Action clicks: {actionClicks}</p>
	<p class="text-sm text-gray-500 mb-6" data-testid="last-action">
		Last action: {lastActionId ?? 'none'}
	</p>

	<div class="grid gap-4">
		{#each demoItems as item}
			<div data-card-id={item.id}>
				<ListCard
					id={item.id}
					href={`/testing/list-card/detail/${item.id}`}
					selected={selection.isSelected(item.id)}
					onToggle={selection.toggleSelection}
					deleteLabel="Remove"
				>
					{#snippet title()}
						<span>{item.title}</span>
					{/snippet}

					{#snippet subtitle()}
						<span class="uppercase tracking-wide text-xs text-gray-500">{item.status}</span>
					{/snippet}

					{#snippet content()}
						<p class="text-sm text-gray-700" data-testid={`card-desc-${item.id}`}>{item.description}</p>
					{/snippet}

					{#snippet metadata()}
						<button
							type="button"
							class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded"
							data-testid={`card-action-${item.id}`}
							onclick={(event) => handleQuickAction(event, item.id)}
						>
							Quick Action
						</button>
					{/snippet}
				</ListCard>
			</div>
		{/each}
	</div>
</div>
