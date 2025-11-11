<script lang="ts">
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
		<button
			onclick={allSelected ? onDeselectAll : onSelectAll}
			class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
		>
			{allSelected ? 'Deselect All' : 'Select All'}
		</button>
		<button
			onclick={onDelete}
			class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
		>
			{deleteLabel} ({selectedCount})
		</button>
	{/if}
	<a
		href={newItemHref}
		class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
	>
		{newItemLabel}
	</a>
</div>
