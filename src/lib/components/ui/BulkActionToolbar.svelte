<script lang="ts">
import { Button } from '$lib/components/ui/button';
	import AsyncButton from './AsyncButton.svelte';


	interface Props {
		selectedCount: number;
		totalCount: number;
		onSelectAll: () => void;
		onDeselectAll: () => void;
		onDelete: () => void;
		newItemHref: string;
		newItemLabel: string;
		deleteLabel?: string;
	}

	let { 
		selectedCount,
		totalCount,
		onSelectAll,
		onDeselectAll,
		onDelete,
		newItemHref,
		newItemLabel,
		deleteLabel = 'Delete Selected'
	}: Props = $props();

	const allSelected = $derived(selectedCount > 0 && selectedCount === totalCount);
</script>

<div class="flex gap-2">
	{#if selectedCount > 0}
		<Button
			variant="secondary"
			size="default"
			onclick={allSelected ? onDeselectAll : onSelectAll}
		>
			{allSelected ? 'Deselect All' : 'Select All'}
		</Button>
		<AsyncButton
			onclick={onDelete}
			variant="destructive"
			class="px-4 py-2"
		>
			{deleteLabel} ({selectedCount})
		</AsyncButton>
	{/if}
	<Button href={newItemHref} variant="default" size="default">{newItemLabel}</Button>
</div>
