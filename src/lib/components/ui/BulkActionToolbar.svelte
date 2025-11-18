<script lang="ts">
import { Button } from '$lib/components/ui/button';
	import AsyncButton from './AsyncButton.svelte';
	import { toast } from 'svelte-sonner';


	interface Props {
		selectedCount: number;
		totalCount: number;
		onSelectAll: () => void;
		onDeselectAll: () => void;
		onDelete: () => Promise<void>;
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

	let bulkDeleting = $state(false);

	async function handleBulkDelete() {
		bulkDeleting = true;
		const count = selectedCount;
		try {
			await onDelete();
			toast.success(`${count} item${count === 1 ? '' : 's'} deleted successfully!`);
		} catch (error) {
			toast.error('Failed to delete selected items');
		} finally {
			bulkDeleting = false;
		}
	}

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
			onclick={handleBulkDelete}
			variant="destructive"
			class="px-4 py-2"
			loading={bulkDeleting}
			loadingLabel="Deleting..."
		>
			{deleteLabel} ({selectedCount})
		</AsyncButton>
	{/if}
	<Button href={newItemHref} variant="default" size="default">{newItemLabel}</Button>
</div>
